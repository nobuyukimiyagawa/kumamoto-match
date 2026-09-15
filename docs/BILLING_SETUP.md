# 課金（Stripe）の設定手順

チームプラン（月額）を Stripe で受け付ける。カード・Apple Pay・Google Pay に対応。
初期費用・月額は 0 円、決済ごとに Stripe の手数料（国内カード 3.6%）だけ。

## 構成

```
チーム管理「チームプランに加入する」
  → Edge Function stripe-checkout（ログイン確認 → 運営者確認 → Stripe Checkout の URL を返す）
  → Stripe がホストする支払い画面（カード情報はサイトを通らない）
  → 支払い完了 → Stripe が Edge Function stripe-webhook を呼ぶ
  → teams.plan = 'team', plan_until = 期間終了日 を書き込む
  → サイトに戻る（/team/?paid=1）

「お支払いの管理・解約」→ stripe-checkout/portal → Stripe Billing Portal
```

- 画面の文言と金額表示: `src/config/plan.ts`（金額は Stripe の Price が正。両方そろえる）
- 無料プランの掲載上限: `PLAN.enforceFreeLimit`。**いまは false**（テスト中は誰でも何件でも出せる）
- チームプランのチームは一覧で「★ PLAN」の印が付き、同じ日の中で上に並ぶ

## Stripe 側の設定（1回だけ）

1. https://dashboard.stripe.com/register でアカウント作成（メール認証まで。本人確認は後でもテストモードは使える）
2. **商品と価格を作る**: 商品カタログ → 商品を追加
   - 名前: チームプラン ／ 価格: 980 円 ／ 継続（月ごと）
   - 作成後の **Price ID（price_…）** を控える
3. **Webhook を作る**: 開発者 → Webhook → エンドポイントを追加
   - URL: `https://hyzvldrmasniedxsiohh.supabase.co/functions/v1/stripe-webhook`
   - 受け取るイベント: `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`
   - 作成後の **署名シークレット（whsec_…）** を控える
4. **API キー**: 開発者 → API キー → シークレットキー（sk_test_… / sk_live_…）を控える
5. **Apple Pay / Google Pay**: Checkout（Stripe ホスト）では自動で有効。設定 → 決済手段 で ON になっていることを確認
6. **カスタマーポータル**: 設定 → Billing → カスタマーポータル で「サブスクリプションのキャンセル」を許可

## Supabase 側の設定

Edge Functions → Secrets に以下を追加（値は Stripe からコピーして貼る。リポジトリには書かない）

| 名前 | 値 |
|---|---|
| STRIPE_SECRET_KEY | sk_test_… （本番に切り替えるとき sk_live_… に差し替え） |
| STRIPE_PRICE_ID | price_… |
| STRIPE_WEBHOOK_SECRET | whsec_… |
| SITE_URL | `https://nobuyukimiyagawa.github.io/kumamoto-match/`（line-auth と同じ。設定済み） |

Edge Functions（両方とも配置済み、Verify JWT は OFF）:
- `stripe-checkout` … 呼び出し側でログインを確認する
- `stripe-webhook` … Stripe の署名で確認する

## テスト（テストモード）

1. テストアカウント（test1@example.com など）でログイン → チーム管理 → 「チームプランに加入する」
2. Stripe の画面でテストカード `4242 4242 4242 4242`、有効期限は未来の任意、CVC 任意
3. サイトに戻ると「お支払いありがとうございます」→ 数秒でプランが「チームプラン」に変わる
4. 「お支払いの管理・解約」から解約 → 期限まで有効、期限後に無料に戻る
5. Stripe ダッシュボード → 開発者 → Webhook → 配信ログで 200 が返っていることを確認

## 本番に切り替えるとき

- Stripe で本人確認（事業情報・銀行口座）を済ませ、本番モードでも商品・Webhook を作り直す（テストと本番は別）
- Secrets の STRIPE_SECRET_KEY / STRIPE_PRICE_ID / STRIPE_WEBHOOK_SECRET を本番の値に差し替える
- サイトに「特定商取引法に基づく表記」「利用規約」「プライバシーポリシー」を用意する（審査で見られる）
- `PLAN.enforceFreeLimit` を true にするかどうか決める

## 設定済みの状態（2026-09-15）

- Stripe アカウント「ピッチメイト」（acct_1UFuQEK2…）のサンドボックスで設定完了。**別アカウント（acct_1UFuQPGl…）も存在するが未使用**
- 商品「チームプラン」980円/月（prod_VGRTki0ZIe5VVA / price_1UFuaoK2MWJXFQJDg2FSYZ6c）。税コードは SaaS 業務用（txcd_10103001）
- Webhook「pitchmate-supabase」→ stripe-webhook。API 2026-08-26.dahlia
- Secrets: STRIPE_SECRET_KEY / STRIPE_PRICE_ID / STRIPE_WEBHOOK_SECRET / SITE_URL 投入済み
- テスト決済（test1 / FC 熊本イレブン）で plan=team, plan_until=1か月後 になることを確認

### ハマりどころ
- アカウントが新しいと **Managed Payments** が既定で ON。古い API バージョンを固定すると Checkout が拒否される。
  → SDK の apiVersion を 2026-08-26.dahlia にし、`managed_payments: { enabled: false }` を渡している
- 新 API では `subscription.current_period_end` が `items.data[0]` に、`invoice.subscription` が
  `invoice.parent.subscription_details.subscription` に移った。webhook は両方を見る
- 鍵を別アカウントに差し替えると `stripe_customer_id` が食い違う。checkout は顧客が無ければ作り直す
