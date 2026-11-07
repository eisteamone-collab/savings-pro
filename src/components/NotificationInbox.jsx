import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Headset } from "lucide-react";
import { supabase } from "../lib/supabase";
import { NOTIFICATION_SENDER } from "../lib/notifications";
import { formatDate } from "../lib/helpers";

// Member inbox: one-way messages sent by the admin, shown as SavingsPro Customer Service.
export default function NotificationInbox({ member }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const memberId = member?.id;

  const load = useCallback(async () => {
    if (!memberId) return;
    const { data, error } = await supabase
      .from("member_notifications")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
  }, [memberId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, [load]);

  const unread = items.filter(n => !n.is_read).length;

  async function openInbox() {
    setOpen(true);
    const unreadIds = items.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    setItems(prev => prev.map(n => (unreadIds.includes(n.id) ? { ...n, is_read: true } : n)));
    await supabase
      .from("member_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in("id", unreadIds);
  }

  return (
    <>
      <button
        onClick={openInbox}
        className="relative inline-flex items-center justify-center gap-1 bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm h-auto whitespace-nowrap shadow-sm transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4 mr-1" /> Notifications
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-50 rounded-xl">
                    <Bell className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Notifications</h2>
                    <p className="text-xs text-gray-500">Messages from {NOTIFICATION_SENDER}</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-3">
                {loading ? (
                  <p className="text-center text-sm text-gray-400 py-8">Loading…</p>
                ) : items.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">No notifications yet</p>
                ) : (
                  items.map(n => (
                    <div key={n.id} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-7 h-7 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                          <Headset className="w-4 h-4" />
                        </span>
                        <p className="text-sm font-bold text-gray-900 flex-1 truncate">
                          {n.sender_name || NOTIFICATION_SENDER}
                        </p>
                        <span className="text-[11px] text-gray-400 shrink-0">
                          {formatDate(n.created_at || n.created_date, "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{n.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-400 text-center">
                  One-way message — replies are not available.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
