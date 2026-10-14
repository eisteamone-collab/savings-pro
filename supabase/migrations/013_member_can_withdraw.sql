-- Add can_withdraw column to members table (default true so existing members keep withdraw access)
alter table public.members add column if not exists can_withdraw boolean default true;
