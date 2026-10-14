-- Adds a code's amount to the redeeming member's available_balance and total_earnings.
-- Called from src/lib/redeem.js when a user redeems a maintenance code.

create or replace function public.add_code_amount_to_balance(p_member_id uuid, p_amount numeric)
returns void
language plpgsql
security definer
set search_path=public
as $$
begin
  if p_amount is null or p_amount <= 0 then return; end if;
  update public.members
  set available_balance = available_balance + p_amount,
      total_earnings = total_earnings + p_amount,
      updated_at = now()
  where id = p_member_id;
end $$;
