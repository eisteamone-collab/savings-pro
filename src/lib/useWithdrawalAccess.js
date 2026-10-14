import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

// Permissions must come from a fresh member read, not the persisted table cache.
export function useWithdrawalAccess(memberId) {
  const [access, setAccess] = useState({ memberId: null, enabled: false });
  const requestVersion = useRef(0);

  const refreshAccess = useCallback(async () => {
    const version = ++requestVersion.current;
    let enabled = false;
    if (memberId) {
      try {
        const { data, error } = await supabase
          .from("members")
          .select("can_withdraw")
          .eq("id", memberId)
          .single();
        enabled = !error && data?.can_withdraw === true;
      } catch {
        // Keep withdrawals hidden if access cannot be confirmed.
      }
    }
    if (version === requestVersion.current) setAccess({ memberId, enabled });
    return enabled;
  }, [memberId]);

  useEffect(() => {
    refreshAccess();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshAccess();
    };
    const interval = setInterval(refreshWhenVisible, 5000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      requestVersion.current += 1;
    };
  }, [refreshAccess]);

  return { canWithdraw: access.memberId === memberId && access.enabled, refreshAccess };
}
