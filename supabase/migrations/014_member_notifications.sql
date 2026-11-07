-- One-way notifications from the admin to a single member.
-- Members can read them in their dashboard inbox but cannot reply.
create table if not exists public.member_notifications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete cascade,
  message text not null,
  sender_name text default 'SavingsPro Customer Service',
  created_by uuid references public.members(id) on delete set null,
  is_read boolean default false,
  read_at timestamptz,
  created_at timestamptz default now(),
  created_date timestamptz default now()
);

create index if not exists idx_member_notifications_member
  on public.member_notifications(member_id, created_at desc);

grant select, insert, update, delete on public.member_notifications to anon;
