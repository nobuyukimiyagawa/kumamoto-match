-- テスト用アカウント6つと、見え方を確認するための募集・エントリー・評価。
-- Supabase ダッシュボードの SQL Editor で実行する（service role で動くので RLS は無視される）。
-- 消すときは末尾の「片付け」を実行する。
--
-- ログイン: メール test1@example.com 〜 test6@example.com
-- パスワードはこのファイルに書かない（公開リポジトリのため）。実行前に下の <TEST_PASSWORD> を置き換え、
-- 実際の値は ~/.config/pitchmate-test-password に置く。投入後に変えるときは末尾の「パスワード変更」を使う。
--   test1 山田 太郎   … FC 熊本イレブン のオーナー（本格志向・熊本市中央区）
--   test2 佐藤 健     … 益城ユナイテッド のオーナー（エンジョイ・益城町）
--   test3 鈴木 大輔   … 合志フットボールクラブ のオーナー（初心者歓迎・合志市）
--   test4 高橋 翔     … 八代サンデーズ のオーナー（エンジョイ・八代市）
--   test5 田中 ケンタ … 個人（GK / DF）
--   test6 中村 リョウ … 個人（FW / MF）

begin;

-- 固定 ID（片付けで消しやすいように先頭を 0000...-0001 に揃える）
-- users / profiles
--   11111111-0000-4000-8000-000000000001 … 000006
-- teams
--   22222222-0000-4000-8000-000000000001 … 000004
-- posts
--   33333333-0000-4000-8000-000000000001 … 000009
-- applications
--   44444444-0000-4000-8000-000000000001 … 000006

-- 1) auth.users（メール確認済み、パスワード付き）
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('<TEST_PASSWORD>', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('name', u.name),
  now(), now(), '', '', '', '', ''
from (values
  ('11111111-0000-4000-8000-000000000001'::uuid, 'test1@example.com', '山田 太郎'),
  ('11111111-0000-4000-8000-000000000002'::uuid, 'test2@example.com', '佐藤 健'),
  ('11111111-0000-4000-8000-000000000003'::uuid, 'test3@example.com', '鈴木 大輔'),
  ('11111111-0000-4000-8000-000000000004'::uuid, 'test4@example.com', '高橋 翔'),
  ('11111111-0000-4000-8000-000000000005'::uuid, 'test5@example.com', '田中 ケンタ'),
  ('11111111-0000-4000-8000-000000000006'::uuid, 'test6@example.com', '中村 リョウ')
) as u(id, email, name)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id,
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  'email', id::text, now(), now(), now()
from auth.users
where id::text like '11111111-0000-4000-8000-%'
  and not exists (select 1 from auth.identities i where i.user_id = auth.users.id);

-- 2) profiles
insert into profiles (id, display_name, city, positions, years, note) values
  ('11111111-0000-4000-8000-000000000001', '山田 太郎',   '熊本市中央区水前寺', '{MF}',    15, 'FC 熊本イレブン代表。土日どちらも動けます。'),
  ('11111111-0000-4000-8000-000000000002', '佐藤 健',     '上益城郡益城町木山', '{DF}',    10, '益城ユナイテッド代表。平日夜が中心です。'),
  ('11111111-0000-4000-8000-000000000003', '鈴木 大輔',   '合志市御代志',       '{GK,DF}', 6,  '合志FC代表。初心者の方も気軽にどうぞ。'),
  ('11111111-0000-4000-8000-000000000004', '高橋 翔',     '八代市萩原町',       '{FW}',    12, '八代サンデーズ代表。日曜午前に活動中。'),
  ('11111111-0000-4000-8000-000000000005', '田中 ケンタ', '熊本市東区長嶺南',   '{GK,DF}', 8,  'GK 歴8年。土曜は基本空いています。声かけてください。'),
  ('11111111-0000-4000-8000-000000000006', '中村 リョウ', '菊池郡菊陽町光の森', '{FW,MF}', 4,  '大学サッカー部OB。走れます。日曜が動きやすいです。')
on conflict (id) do nothing;

-- 3) teams（trigger teams_add_owner がオーナーを team_members に入れる）
insert into teams (id, name, city, level, note, owner_id) values
  ('22222222-0000-4000-8000-000000000001', 'FC 熊本イレブン',       '熊本市中央区', 'competitive', '県リーグ経験者中心。45分×2本、審判は分担でお願いします。', '11111111-0000-4000-8000-000000000001'),
  ('22222222-0000-4000-8000-000000000002', '益城ユナイテッド',       '上益城郡益城町', 'casual',    '20〜40代のエンジョイチーム。平日ナイターが多めです。',     '11111111-0000-4000-8000-000000000002'),
  ('22222222-0000-4000-8000-000000000003', '合志フットボールクラブ', '合志市',       'beginner',    '初心者歓迎。ケガのないよう楽しくやっています。',           '11111111-0000-4000-8000-000000000003'),
  ('22222222-0000-4000-8000-000000000004', '八代サンデーズ',         '八代市',       'casual',      '日曜午前に球磨川河川敷で活動。県南のチーム募集中。',        '11111111-0000-4000-8000-000000000004')
on conflict (id) do nothing;

insert into team_members (team_id, profile_id, role)
select t.id, t.owner_id, 'owner' from teams t where t.id::text like '22222222-%'
on conflict do nothing;

-- 4) posts（日付は実行日基準。今日にも募集があるようにする）
insert into posts (id, kind, status, team_id, venue_id, match_date, start_time, end_time, level, positions, needed, venue_status, fee, body) values
  -- 今日
  ('33333333-0000-4000-8000-000000000001', 'training_match', 'open',
    '22222222-0000-4000-8000-000000000002', (select id from venues where name = '益城町総合運動公園'),
    current_date, '19:00', '21:00', 'casual', null, null, 'planned', 2500,
    '平日ナイターのトレマ相手を探しています。相手が決まり次第、会場を予約します。会場費は折半でお願いします。'),
  ('33333333-0000-4000-8000-000000000002', 'helper', 'open',
    '22222222-0000-4000-8000-000000000001', (select id from venues where name = '熊本市総合屋内プール前グラウンド'),
    current_date, '19:30', '21:30', 'competitive', '{GK,DF}', 2, null, 500,
    'GK が急遽来られなくなりました。DF も1名欲しいです。経験者歓迎。'),
  -- 明日
  ('33333333-0000-4000-8000-000000000003', 'training_match', 'open',
    '22222222-0000-4000-8000-000000000001', (select id from venues where name = '熊本県民総合運動公園'),
    current_date + 1, '10:00', '12:00', 'competitive', null, null, 'reserved', 3000,
    '会場は予約済みです。45分×2本、審判は分担で。人数は11人制でお願いします。'),
  -- 3日後
  ('33333333-0000-4000-8000-000000000004', 'helper', 'open',
    '22222222-0000-4000-8000-000000000003', (select id from venues where name = 'フットボールパーク御代志'),
    current_date + 3, '09:00', '11:00', 'beginner', '{ANY}', 3, null, 0,
    '人数が足りません。ポジション問わず3名。初心者でも大丈夫です。参加費無料。'),
  -- 6日後
  ('33333333-0000-4000-8000-000000000005', 'training_match', 'open',
    '22222222-0000-4000-8000-000000000003', (select id from venues where name = '菊池市総合体育館グラウンド'),
    current_date + 6, '14:00', '16:00', 'beginner', null, null, 'reserved', 0,
    '初心者チーム同士でゆるくやりましょう。会場は押さえてあります。会場費はこちらで持ちます。'),
  -- 9日後
  ('33333333-0000-4000-8000-000000000006', 'helper', 'open',
    '22222222-0000-4000-8000-000000000004', (select id from venues where name = '八代市球磨川河川敷グラウンド'),
    current_date + 9, '09:00', '11:00', 'casual', '{FW}', 1, null, 1000,
    '点を取れる人を1名。県南の方、ぜひ。参加費は1,000円（会場費と保険）。'),
  -- 13日後
  ('33333333-0000-4000-8000-000000000007', 'training_match', 'open',
    '22222222-0000-4000-8000-000000000004', (select id from venues where name = '宇土市民グラウンド'),
    current_date + 13, '09:00', '11:00', 'casual', null, null, 'planned', 2000,
    '日曜午前のトレマ相手募集。相手が決まってから宇土市民グラウンドを予約します。負担額は目安です。'),
  -- 終わった募集（評価の確認用）
  ('33333333-0000-4000-8000-000000000008', 'training_match', 'filled',
    '22222222-0000-4000-8000-000000000001', (select id from venues where name = '熊本県民総合運動公園'),
    current_date - 10, '10:00', '12:00', 'competitive', null, null, 'reserved', 3000,
    '（終了）45分×2本。'),
  ('33333333-0000-4000-8000-000000000009', 'helper', 'filled',
    '22222222-0000-4000-8000-000000000002', (select id from venues where name = '益城町総合運動公園'),
    current_date - 7, '19:00', '21:00', 'casual', '{GK}', 1, null, 500,
    '（終了）GK 1名。')
on conflict (id) do nothing;

-- 5) applications
insert into applications (id, post_id, applicant_team_id, applicant_profile_id, status, message, created_at, decided_at) values
  -- 今日のトレマ（益城）に FC 熊本イレブンがエントリー中（承認待ち）
  ('44444444-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000001', '22222222-0000-4000-8000-000000000001', null, 'pending',  'ぜひお願いします。11人揃います。', now() - interval '2 hours', null),
  -- 今日の助っ人（FC 熊本イレブン）に 田中 が承認待ち、中村 は承認済み
  ('44444444-0000-4000-8000-000000000002', '33333333-0000-4000-8000-000000000002', null, '11111111-0000-4000-8000-000000000005', 'pending',  'GK できます。19時に着けます。', now() - interval '3 hours', null),
  ('44444444-0000-4000-8000-000000000003', '33333333-0000-4000-8000-000000000002', null, '11111111-0000-4000-8000-000000000006', 'approved', 'DF でも行けます。', now() - interval '1 day', now() - interval '20 hours'),
  -- 明日のトレマ（FC 熊本イレブン）に 合志FC がエントリー中
  ('44444444-0000-4000-8000-000000000004', '33333333-0000-4000-8000-000000000003', '22222222-0000-4000-8000-000000000003', null, 'pending',  '胸を借りるつもりで。よろしくお願いします。', now() - interval '5 hours', null),
  -- 終わったトレマ: FC 熊本イレブン vs 益城ユナイテッド（承認済み）
  ('44444444-0000-4000-8000-000000000005', '33333333-0000-4000-8000-000000000008', '22222222-0000-4000-8000-000000000002', null, 'approved', '', now() - interval '14 days', now() - interval '13 days'),
  -- 終わった助っ人: 益城ユナイテッド に 田中（承認済み）
  ('44444444-0000-4000-8000-000000000006', '33333333-0000-4000-8000-000000000009', null, '11111111-0000-4000-8000-000000000005', 'approved', '', now() - interval '9 days', now() - interval '8 days')
on conflict (id) do nothing;

-- 6) ratings（終わった試合の相互評価。片方だけ未評価のものも残して「評価する」の確認に使う）
insert into ratings (post_id, application_id, from_kind, from_id, to_kind, to_id, stars, comment) values
  -- トレマ: 益城 → FC 熊本イレブン（5）。FC 熊本イレブン → 益城 は未評価のまま（test1 でログインすると「評価する」に出る）
  ('33333333-0000-4000-8000-000000000008', '44444444-0000-4000-8000-000000000005', 'team', '22222222-0000-4000-8000-000000000002', 'team', '22222222-0000-4000-8000-000000000001', 5, '時間どおりで、審判の分担も気持ちよくできました。'),
  -- 助っ人: 益城 → 田中（4）、田中 → 益城（5）
  ('33333333-0000-4000-8000-000000000009', '44444444-0000-4000-8000-000000000006', 'team', '22222222-0000-4000-8000-000000000002', 'profile', '11111111-0000-4000-8000-000000000005', 4, '安定した GK でした。また呼びたいです。'),
  ('33333333-0000-4000-8000-000000000009', '44444444-0000-4000-8000-000000000006', 'profile', '11111111-0000-4000-8000-000000000005', 'team', '22222222-0000-4000-8000-000000000002', 5, '雰囲気が良くて楽しかったです。')
on conflict do nothing;

commit;

-- 確認
select email from auth.users where id::text like '11111111-0000-4000-8000-%' order by email;

-- ============================================================
-- 片付け（テストデータを全部消す）。auth.users を消せば profiles 以下は cascade で消える。
-- posts は teams の cascade で消える。
-- ============================================================
-- delete from auth.users where id::text like '11111111-0000-4000-8000-%';

-- ============================================================
-- パスワード変更（6人まとめて）
-- ============================================================
-- update auth.users set encrypted_password = extensions.crypt('<TEST_PASSWORD>', extensions.gen_salt('bf')), updated_at = now()
--   where id::text like '11111111-0000-4000-8000-%';
