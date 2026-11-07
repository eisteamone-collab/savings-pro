import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headset, Trash2, Inbox } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { NOTIFICATION_SENDER } from "../lib/notifications";
import { formatDate } from "../lib/helpers";

// Admin view of the notifications already sent to one member: same copy the member reads,
// with the ability to undo (delete) a message for real in Supabase.
export default function MemberNotificationsPanel({ member, refreshKey = 0 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const memberId = member?.id;

  const load = useCallback(async () => {
    if (!memberId) return;
    const { data, error } = await supabase
      .from("member_notifications")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });
    if (error) toast.error("Could not load sent messages");
    else setItems(data || []);
    setLoading(false);
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function remove(item) {
    setBusyId(item.id);
    const { data, error } = await supabase
      .from("member_notifications")
      .delete()
      .eq("id", item.id)
      .select("id");
    setBusyId(null);
    if (error || !data || data.length === 0) {
      toast.error(error?.message || "Could not delete the message");
      return;
    }
    setItems(prev => prev.filter(n => n.id !== item.id));
    setConfirmId(null);
    toast.success("Message deleted");
  }

  return (
    <div className="border-t border-gray-100">
      <div className="flex items-center justify-between px-6 pt-4 pb-2">
        <h3 className="text-sm font-bold text-gray-800">Sent messages</h3>
        <span className="text-xs text-gray-400">{items.length} total</span>
      </div>

      <div className="px-6 pb-5 max-h-64 overflow-y-auto space-y-2">
        {loading ? (
          <p className="text-xs text-gray-400">Loading…</p>
        ) : items.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-gray-400 py-3">
            <Inbox className="w-4 h-4" /> No notifications sent to this member yet.
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <Headset className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-gray-800">{item.sender_name || NOTIFICATION_SENDER}</p>
                    <span className="text-[11px] text-gray-400">{formatDate(item.created_at)}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        item.is_read ? "bg-gray-200 text-gray-600" : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {item.is_read ? "Read" : "Unread"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1 break-words whitespace-pre-wrap">{item.message}</p>
                </div>
                <button
                  onClick={() => setConfirmId(confirmId === item.id ? null : item.id)}
                  disabled={busyId === item.id}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Delete this message"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <AnimatePresence>
                {confirmId === item.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-xs text-red-600 flex-1">Delete this message for the member too?</p>
                      <button
                        onClick={() => setConfirmId(null)}
                        className="px-2.5 h-8 rounded-lg bg-white border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => remove(item)}
                        disabled={busyId === item.id}
                        className="px-2.5 h-8 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        {busyId === item.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
