// Stripe からの通知（Webhook）を受けて、チームのプランを更新する。
//
//   POST /stripe-webhook   … Stripe が呼ぶ。署名を確かめてから処理する
//
// 見る出来事:
//   checkout.session.completed            … 加入完了 → plan = team
//   customer.subscription.updated/deleted … 更新・解約・支払い失敗 → status を見て plan を決める
//   invoice.paid                          … 月々の更新 → plan_until を伸ばす
//
// 必要な secrets:
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET（whsec_…）
// Verify JWT は OFF にする（Stripe は Supabase のトークンを持っていない）。

import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const stripe = new Stripe(STRIPE_KEY, { apiVersion: "2024-12-18.acacia" });
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

/** サブスクの状態から、チームのプランと期限を決めて書き込む */
async function applySubscription(sub: Stripe.Subscription) {
  const teamId = sub.metadata?.team_id;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  // 有効: active / trialing。past_due（支払い失敗中）も期限までは有効扱い。それ以外は無料に戻す
  const active = ["active", "trialing", "past_due"].includes(sub.status);
  const until = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
  const patch = {
    plan: active ? "team" : "free",
    plan_until: active ? until : null,
    stripe_subscription_id: active ? sub.id : null,
  };
  const q = admin.from("teams").update(patch);
  const { error } = teamId ? await q.eq("id", teamId) : await q.eq("stripe_customer_id", customerId);
  if (error) console.error("teams update failed:", error.message);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  const sig = req.headers.get("stripe-signature") ?? "";
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, WEBHOOK_SECRET);
  } catch (e) {
    console.error("signature check failed:", (e as Error).message);
    return new Response("bad signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === "subscription" && s.subscription) {
          const sub = await stripe.subscriptions.retrieve(String(s.subscription));
          await applySubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await applySubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.paid": {
        const inv = event.data.object as Stripe.Invoice;
        const subId = typeof inv.subscription === "string" ? inv.subscription : inv.subscription?.id;
        if (subId) await applySubscription(await stripe.subscriptions.retrieve(subId));
        break;
      }
      default:
        // 見ない出来事は 200 で返す（Stripe が再送しないように）
        break;
    }
  } catch (e) {
    console.error("webhook handling failed:", (e as Error).message);
    return new Response("error", { status: 500 });
  }
  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
