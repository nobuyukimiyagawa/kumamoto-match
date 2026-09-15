// チームプランの支払い開始（Stripe Checkout）と、支払い管理画面（Billing Portal）。
//
//   POST /stripe-checkout          body: { teamId, return }  → { url }  Checkout（月額サブスク）へ
//   POST /stripe-checkout/portal   body: { teamId, return }  → { url }  Billing Portal（カード変更・解約）へ
//
// 呼び出しにはサイトのログイン（Supabase の JWT）が要る。チームのオーナーか運営者だけが呼べる。
// カード情報はここを通らない。Stripe がホストする画面で入力され、結果は stripe-webhook が受け取る。
//
// 必要な secrets:
//   STRIPE_SECRET_KEY   … Stripe の秘密鍵（sk_test_… / sk_live_…）
//   STRIPE_PRICE_ID     … チームプランの Price ID（price_…）
//   SITE_URL            … 戻り先として許可するサイトの先頭（line-auth と同じ値）
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY は自動で入る。

import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const PRICE_ID = Deno.env.get("STRIPE_PRICE_ID") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2024-12-18.acacia" });
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

/** 戻り先はサイト配下か localhost だけ（オープンリダイレクト防止。line-auth と同じ判定） */
function safeReturn(ret: unknown): string | null {
  if (typeof ret !== "string") return null;
  let u: URL;
  try { u = new URL(ret); } catch { return null; }
  if (u.username || u.password) return null;
  // SITE_URL はカンマ区切りで複数可（例: Netlify と GitHub Pages）
  for (const raw of SITE_URL.split(",").map((x) => x.trim()).filter(Boolean)) {
    let site: URL;
    try { site = new URL(raw); } catch { continue; }
    if (u.protocol === site.protocol && u.hostname === site.hostname && u.port === site.port
        && u.pathname.startsWith(site.pathname)) return u.toString();
  }
  if (u.protocol === "http:" && u.hostname === "localhost") return u.toString();
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!STRIPE_KEY || !PRICE_ID) return json({ error: "stripe_not_configured" }, 500);

  // 1) 呼び出した人を確かめる（サイトのログイン JWT）
  const auth = req.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: me } = await userClient.auth.getUser();
  if (!me?.user) return json({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => ({})) as { teamId?: string; return?: string };
  const ret = safeReturn(body.return) ?? (SITE_URL ? SITE_URL.split(",")[0].trim() + "team/" : "");
  if (!body.teamId || !ret) return json({ error: "bad_request" }, 400);

  // 2) チームの運営者か確かめる
  const { data: team } = await admin.from("teams").select("id, name, plan, stripe_customer_id, stripe_subscription_id").eq("id", body.teamId).single();
  if (!team) return json({ error: "team_not_found" }, 404);
  const { data: member } = await admin.from("team_members").select("role").eq("team_id", team.id).eq("profile_id", me.user.id).single();
  if (!member || !["owner", "admin"].includes(member.role)) return json({ error: "forbidden" }, 403);

  // 3) Stripe の顧客を用意する（チーム1つに顧客1つ）
  let customerId = team.stripe_customer_id as string | null;
  if (!customerId) {
    const c = await stripe.customers.create({
      email: me.user.email ?? undefined,
      name: team.name,
      metadata: { team_id: team.id, owner_user_id: me.user.id },
    });
    customerId = c.id;
    await admin.from("teams").update({ stripe_customer_id: customerId }).eq("id", team.id);
  }

  const url = new URL(req.url);
  const back = new URL(ret);

  // 4a) 支払い管理（Billing Portal）
  if (url.pathname.endsWith("/portal")) {
    const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: back.toString() });
    return json({ url: session.url });
  }

  // 4b) 新規加入（Checkout、月額サブスク）
  if (team.plan === "team" && team.stripe_subscription_id) {
    return json({ error: "already_subscribed" }, 409);
  }
  const success = new URL(back); success.searchParams.set("paid", "1");
  const cancel = new URL(back); cancel.searchParams.set("paid", "0");
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    // カード・Apple Pay・Google Pay は Stripe 側の設定で自動的に出る
    success_url: success.toString(),
    cancel_url: cancel.toString(),
    locale: "ja",
    allow_promotion_codes: true,
    subscription_data: { metadata: { team_id: team.id } },
    metadata: { team_id: team.id },
  });
  return json({ url: session.url });
});
