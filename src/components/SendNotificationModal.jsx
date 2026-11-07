import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Send, Headset } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";
import { getSessionMemberId } from "../lib/auth";
import { NOTIFICATION_SENDER } from "../lib/notifications";
import MemberNotificationsPanel from "./MemberNotificationsPanel";

export default function SendNotificationModal({ member, onClose, onSent }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!member) return null;

  async function send() {
    const text = message.trim();
    if (!text) {
      toast.error("Write a message first");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("member_notifications").insert({
        member_id: member.id,
        message: text,
        sender_name: NOTIFICATION_SENDER,
        created_by: getSessionMemberId(),
      });
      if (error) throw error;
      toast.success(`Notification sent to ${member.username}`);
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to send notification");
    }
    setBusy(false);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={e => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-50 rounded-xl">
                <Bell className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Send Notification</h2>
                <p className="text-xs text-gray-500">To @{member.username}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
              <Headset className="w-4 h-4 text-sky-600 shrink-0" />
              <p className="text-xs text-sky-800">
                The member sees this in their dashboard as <span className="font-bold">{NOTIFICATION_SENDER}</span>. Replies are not possible.
              </p>
            </div>
            <div>
              <label className="font-semibold text-gray-900 block mb-1.5">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
                maxLength={1000}
                placeholder="Write your message to this member…"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all text-gray-700 resize-none"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{message.length}/1000</p>
            </div>
          </div>

            <MemberNotificationsPanel member={member} />
          </div>

          <div className="flex gap-3 px-6 py-5 border-t border-gray-100 bg-gray-50">
            <button
              onClick={onClose}
              className="flex-[2] h-12 rounded-xl bg-white border border-gray-300 text-gray-900 font-medium hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={send}
              disabled={busy}
              className="flex-[3] h-12 rounded-xl font-medium text-white bg-sky-600 hover:bg-sky-700 transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> {busy ? "Sending..." : "Send Notification"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
