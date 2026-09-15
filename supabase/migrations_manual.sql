-- 2026-09-15 トレーニングマッチの会場予約状況（予約確定／予約予定）
alter table posts add column if not exists venue_status text
  check (venue_status in ('reserved', 'planned'));
