-- 2026-09-15 トレーニングマッチの会場予約状況（予約確定／予約予定）
alter table posts add column if not exists venue_status text
  check (venue_status in ('reserved', 'planned'));

-- 2026-09-15 チームプラン（Stripe 月額課金）
alter table teams
  add column if not exists plan text not null default 'free' check (plan in ('free', 'team')),
  add column if not exists plan_until timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;
-- Stripe の ID は運営者以外に見せない（RLS の read teams は全員なので、列を分けず select で除外するのは
-- クライアント側の責務にする。値は顧客 ID だけで秘密ではないが、念のため画面には出さない）
create index if not exists teams_stripe_customer_idx on teams (stripe_customer_id);
