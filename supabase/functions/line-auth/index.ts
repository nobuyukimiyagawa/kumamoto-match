// LINE ログイン用の Edge Function。
//
//   GET /line-auth/start?return=<戻り先URL>   … LINE の認可画面へ飛ばす
//   GET /line-auth/callback?code=...&state=... … LINE からの戻り。ユーザーを作り、
//                                                 サイトへ token_hash 付きで戻す
//
// Supabase に LINE の標準プロバイダが無いため、ここで LINE の OpenID Connect を受け、
// service_role でユーザーを用意し、マジックリンク用の token_hash を発行してサイトに渡す。
// サイト側は verifyOtp({ token_hash, type: "magiclink" }) でセッションにする。
//
// 必要な secrets（supabase secrets set …）:
//   LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, SITE_URL（戻り先として許可するサイトの先頭）
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY は Edge Function に自動で入る。

import { createClient } from "npm:@supabase/supabase-js@2";

const CHANNEL_ID = Deno.env.get("LINE_CHANNEL_ID") ?? "";
const CHANNEL_SECRET = Deno.env.get("LINE_CHANNEL_SECRET") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function selfUrl(req: Request, path: string) {
  const u = new URL(req.url);
  // /functions/v1/line-auth/... の形。関数名までを残して path を付け替える
  const base = u.pathname.replace(/\/(start|callback)\/?$/, "");
  return `${u.origin}${base}/${path}`;
}

function redirect(to: string, headers: Record<string, string> = {}) {
  return new Response(null, { status: 302, headers: { Location: to, ...headers } });
}

function backWithError(ret: string, msg: string) {
  const u = new URL(ret);
  u.searchParams.set("error", msg);
  return redirect(u.toString());
}

/** 戻り先はサイト配下だけ許す（オープンリダイレクト防止） */
function safeReturn(ret: string | null) {
  if (!ret) return null;
  if (SITE_URL && ret.startsWith(SITE_URL)) return ret;
  if (ret.startsWith("http://localhost:")) return ret;
  return null;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (url.pathname.endsWith("/start")) {
    const ret = safeReturn(url.searchParams.get("return"));
    if (!ret) return new Response("bad return url", { status: 400 });
    const state = crypto.randomUUID();
    const auth = new URL("https://access.line.me/oauth2/v2.1/authorize");
    auth.searchParams.set("response_type", "code");
    auth.searchParams.set("client_id", CHANNEL_ID);
    auth.searchParams.set("redirect_uri", selfUrl(req, "callback"));
    auth.searchParams.set("state", state);
    auth.searchParams.set("scope", "profile openid email");
    // state と戻り先を Cookie に持ち、callback で照合する
    const cookie = [
      `line_state=${state}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
      `line_return=${encodeURIComponent(ret)}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
    ];
    const res = redirect(auth.toString());
    for (const c of cookie) res.headers.append("Set-Cookie", c);
    return res;
  }

  if (url.pathname.endsWith("/callback")) {
    const cookies = Object.fromEntries(
      (req.headers.get("cookie") ?? "").split(";").map((s) => s.trim().split("=")).filter((p) => p.length === 2),
    );
    const ret = safeReturn(decodeURIComponent(cookies.line_return ?? "")) ?? (SITE_URL ? SITE_URL + "auth/line/" : "");
    if (!ret) return new Response("no return url", { status: 400 });

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state || state !== cookies.line_state) return backWithError(ret, "state_mismatch");

    // 1) コードをトークンに交換
    const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code", code,
        redirect_uri: selfUrl(req, "callback"),
        client_id: CHANNEL_ID, client_secret: CHANNEL_SECRET,
      }),
    });
    if (!tokenRes.ok) return backWithError(ret, "token_exchange_failed");
    const token = await tokenRes.json() as { id_token?: string };
    if (!token.id_token) return backWithError(ret, "no_id_token");

    // 2) id_token を LINE に検証してもらい、ユーザー情報を得る
    const verifyRes = await fetch("https://api.line.me/oauth2/v2.1/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ id_token: token.id_token, client_id: CHANNEL_ID }),
    });
    if (!verifyRes.ok) return backWithError(ret, "verify_failed");
    const claims = await verifyRes.json() as { sub: string; name?: string; picture?: string; email?: string };

    // 3) Supabase のユーザーを用意する。LINE の userId をキーに探し、無ければ作る
    //    メールが取れない場合は LINE の ID から作った代替アドレスを使う（本人には見せない）
    const email = claims.email ?? `line_${claims.sub}@line.pitchmate.invalid`;
    let userId: string | null = null;
    {
      // LINE ID で既存ユーザーを探す（app_metadata.line_sub）
      const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = data?.users.find((u) => (u.app_metadata as Record<string, unknown>)?.line_sub === claims.sub);
      if (found) userId = found.id;
    }
    if (!userId) {
      const { data, error } = await admin.auth.admin.createUser({
        email, email_confirm: true,
        user_metadata: { name: claims.name, avatar_url: claims.picture, provider: "line" },
        app_metadata: { line_sub: claims.sub },
      });
      if (error) {
        // 同じメールが既にあれば、その人に LINE を紐づける
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const same = list?.users.find((u) => u.email === email);
        if (!same) return backWithError(ret, "create_user_failed");
        await admin.auth.admin.updateUserById(same.id, { app_metadata: { ...same.app_metadata, line_sub: claims.sub } });
        userId = same.id;
      } else {
        userId = data.user.id;
      }
    }

    // 4) マジックリンクの token_hash を作り、サイトへ渡す（メールは送らない）
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (linkErr || !link?.properties?.hashed_token) return backWithError(ret, "link_failed");

    const back = new URL(ret);
    back.searchParams.set("token_hash", link.properties.hashed_token);
    const res = redirect(back.toString());
    res.headers.append("Set-Cookie", "line_state=; Path=/; Max-Age=0");
    res.headers.append("Set-Cookie", "line_return=; Path=/; Max-Age=0");
    return res;
  }

  return new Response("not found", { status: 404 });
});
