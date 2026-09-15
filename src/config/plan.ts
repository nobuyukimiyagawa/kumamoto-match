// チームプラン（月額）の表示用の定義。金額は Stripe 側の Price が正で、ここは画面の文言だけ。
// 金額を変えるときは Stripe の Price と、ここの priceYen の両方を変える。
export const PLAN = {
  name: "チームプラン",
  priceYen: 980,
  interval: "月" as const,
  benefits: [
    "募集の掲載数が無制限（無料は同時に1件まで）",
    "一覧で「チームプラン」の印が付き、上位に表示",
    "エントリーが入ったときの通知（準備中）",
  ],
  /**
   * 無料チームの同時掲載数の上限を実際に効かせるか。
   * false のあいだは表示だけで、募集は何件でも出せる（テスト期間用）。
   */
  enforceFreeLimit: false,
  freePostLimit: 1,
} as const;
