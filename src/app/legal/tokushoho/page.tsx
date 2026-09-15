import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { OPERATOR } from "@/config/operator";
import { PLAN } from "@/config/plan";
import { SITE } from "@/config/site";

export const metadata: Metadata = { title: "特定商取引法に基づく表記" };

export default function TokushohoPage() {
  return (
    <LegalPage title="特定商取引法に基づく表記" hud="legal // 特定商取引法">
      <table>
        <tbody>
          <tr><th>販売事業者</th><td>{OPERATOR.name}</td></tr>
          <tr><th>運営責任者</th><td>{OPERATOR.representative}</td></tr>
          <tr>
            <th>所在地</th>
            <td>〒{OPERATOR.postal}　{OPERATOR.address}<br />
              <span style={{ color: "var(--text-sub)" }}>番地以降は、ご請求があれば遅滞なく開示します。</span></td>
          </tr>
          <tr>
            <th>連絡先</th>
            <td>メール: <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a><br />
              電話: {OPERATOR.phone}（受付 平日10:00〜18:00。お問い合わせはメールを優先してください）</td>
          </tr>
          <tr><th>サービス名</th><td>{SITE.name}（PITCHMATE）　{SITE.tagline}</td></tr>
          <tr>
            <th>販売価格</th>
            <td>{PLAN.name}: 月額 {PLAN.priceYen.toLocaleString()}円（税込）<br />
              募集の閲覧・エントリー・無料プランでの利用は無料です。</td>
          </tr>
          <tr>
            <th>商品代金以外の必要料金</th>
            <td>ありません。インターネット接続にかかる通信料はお客様のご負担です。</td>
          </tr>
          <tr>
            <th>お支払い方法</th>
            <td>クレジットカード（Visa / Mastercard / JCB / American Express / Diners）、Apple Pay、Google Pay。
              決済は Stripe, Inc. の決済システムを通じて行い、カード情報は当サービスでは保持しません。</td>
          </tr>
          <tr>
            <th>お支払い時期</th>
            <td>お申し込み時に初回分を決済し、以降は毎月同日に自動で決済されます（月額課金）。</td>
          </tr>
          <tr>
            <th>サービスの提供時期</th>
            <td>決済完了後、ただちにご利用いただけます。</td>
          </tr>
          <tr>
            <th>解約について</th>
            <td>チーム管理画面の「お支払いの管理・解約」から、いつでも解約できます。解約後も、支払い済みの期間の終了日まではチームプランをご利用いただけます。</td>
          </tr>
          <tr>
            <th>返品・キャンセル</th>
            <td>デジタルサービスの性質上、決済後の返金・日割り精算は行っておりません。二重決済など当方の責による誤請求があった場合は、上記連絡先までご連絡ください。速やかに対応します。</td>
          </tr>
          <tr>
            <th>動作環境</th>
            <td>最新版の Safari、Chrome、Edge、Firefox（スマートフォン・PC）。位置情報を使う機能は、ブラウザで位置情報の利用を許可した場合のみ動作します。</td>
          </tr>
          <tr>
            <th>募集・エントリーについて</th>
            <td>トレーニングマッチや助っ人の募集は利用者（チーム）が掲載するものであり、参加費・会場費・負担額の受け渡しは当事者間で直接行われます。当サービスはこれらの金銭を受け取らず、仲介もしません。</td>
          </tr>
        </tbody>
      </table>
    </LegalPage>
  );
}
