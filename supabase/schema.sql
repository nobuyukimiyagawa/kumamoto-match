-- ピッチメイト スキーマ（Supabase / Postgres）
-- 位置情報は venues にのみ持たせる。profiles には緯度経度を作らない。

create type post_kind   as enum ('training_match','helper');
create type post_status as enum ('open','closed','filled');
create type play_level  as enum ('beginner','casual','competitive');
create type member_role as enum ('owner','admin','member');

-- 個人。auth.users と 1:1
create table profiles (
  id           uuid primary key references auth.users on delete cascade,
  display_name text not null,
  city         text,                    -- 市区町村まで。番地は持たない
  positions    text[] default '{}',
  years        int,
  note         text,
  created_at   timestamptz default now()
);

create table teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  city       text,
  level      play_level not null default 'casual',
  note       text,
  owner_id   uuid not null references profiles(id),
  -- 課金はチーム単位。無料開始なので当面 null
  billing_customer_id text,
  created_at timestamptz default now()
);

create table team_members (
  team_id    uuid references teams(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  role       member_role not null default 'member',
  primary key (team_id, profile_id)
);

create table venues (
  id      uuid primary key default gen_random_uuid(),
  name    text not null,
  city    text not null,
  address text not null,
  lat     double precision not null,
  lng     double precision not null,
  -- 熊本県内だけを受け付ける
  constraint venues_in_kumamoto check (
    lat between 32.09 and 33.21 and lng between 129.99 and 131.34
  )
);

create table posts (
  id         uuid primary key default gen_random_uuid(),
  kind       post_kind   not null,
  status     post_status not null default 'open',
  team_id    uuid not null references teams(id) on delete cascade,
  venue_id   uuid not null references venues(id),
  match_date date not null,
  start_time time not null,
  end_time   time not null,
  level      play_level not null,
  positions  text[],          -- helper のときのみ
  needed     int,             -- helper のときのみ
  fee        int default 0,
  body       text not null,
  created_at timestamptz default now(),
  -- helper なら必要人数が要る
  constraint helper_needs_count check (kind <> 'helper' or needed is not null)
);
create index posts_search_idx on posts (status, match_date, kind);

create table applications (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references posts(id) on delete cascade,
  -- チーム間なら applicant_team_id、助っ人なら applicant_profile_id
  applicant_team_id    uuid references teams(id) on delete cascade,
  applicant_profile_id uuid references profiles(id) on delete cascade,
  status  text not null default 'pending',
  message text,
  created_at timestamptz default now(),
  constraint one_applicant check (
    (applicant_team_id is null) <> (applicant_profile_id is null)
  )
);
create unique index applications_team_once
  on applications (post_id, applicant_team_id) where applicant_team_id is not null;
create unique index applications_profile_once
  on applications (post_id, applicant_profile_id) where applicant_profile_id is not null;

-- 行レベルの権限
alter table profiles     enable row level security;
alter table teams        enable row level security;
alter table team_members enable row level security;
alter table venues       enable row level security;
alter table posts        enable row level security;
alter table applications enable row level security;

-- 募集・会場・チームは誰でも読める（検索流入のため）
create policy "read posts"  on posts  for select using (true);
create policy "read venues" on venues for select using (true);
create policy "read teams"  on teams  for select using (true);

-- 自分のプロフィールだけ書き換えられる
create policy "own profile" on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

-- 募集はチームのオーナー／管理者だけが作れる
create policy "team can post" on posts for all using (
  exists (select 1 from team_members m
          where m.team_id = posts.team_id and m.profile_id = auth.uid()
            and m.role in ('owner','admin'))
);

-- 応募は本人と募集主だけが読める
create policy "read own applications" on applications for select using (
  applicant_profile_id = auth.uid()
  or exists (select 1 from team_members m where m.team_id = applications.applicant_team_id and m.profile_id = auth.uid())
  or exists (select 1 from posts p join team_members m on m.team_id = p.team_id
             where p.id = applications.post_id and m.profile_id = auth.uid())
);
