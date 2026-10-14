-- Add amount column to code_redemption_history so the code amount is visible in history
alter table public.code_redemption_history add column if not exists amount numeric default 0;
