import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import { toast } from "sonner";

const KIND_ICONS = {
  witness_joined: "\uD83D\uDC41\uFE0F",
  proof_submitted: "\u2705",
  bond_activated: "\uD83D\uDD10",
  bond_released: "\uD83C\uDF89",
  bond_failed: "\uD83D\uDC94",
  deadline_24h: "\u23F0",
  deadline_1h: "\u231B",
};

function fmtTimeAgo(iso) {
  try {
    const dt = new Date(iso).getTime();
    const now = Date.now();
    const ms = now - dt;
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

export function NotificationsBell() {
  const session = getSession();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef(null);

  const owner = session?.displayName;

  const pollUnread = async () => {
    if (!owner) return;
    try {
      const { count } = await api.notifications.unreadCount(owner);
      setUnread(count);
    } catch {
      // silent fail — don't spam toasts for polling
    }
  };

  const loadNotifs = async () => {
    if (!owner) return;
    setLoading(true);
    try {
      const data = await api.notifications.list(owner);
      setNotifs(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!owner) return;
    pollUnread();
    // Poll every 30 seconds for unread count
    pollRef.current = setInterval(pollUnread, 30000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line
  }, [owner]);

  const openDrawer = () => {
    setOpen(true);
    loadNotifs();
  };

  const markAllRead = async () => {
    if (!owner) return;
    try {
      await api.notifications.markRead(owner);
      setUnread(0);
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      toast.error("Could not mark notifications as read");
    }
  };

  if (!owner) return null;

  return (
    <>
      <button
        onClick={openDrawer}
        className="relative w-9 h-9 flex items-center justify-center rounded-full border border-parchment-300 text-ink-700 hover:bg-parchment-200 transition-colors"
        data-testid="notifications-bell-button"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
      >
        <Bell size={16} />
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-wax text-parchment font-ui text-[9px] flex items-center justify-center"
            data-testid="notifications-unread-badge"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-ink/30"
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="relative w-full sm:max-w-[380px] bg-parchment-50 border-l border-parchment-300 min-h-[100dvh] sm:min-h-0 sm:max-h-[80dvh] sm:mt-16 sm:mr-4 sm:rounded-lg shadow-2xl overflow-y-auto"
              initial={{ x: 380, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 380, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
            >
              <div className="sticky top-0 bg-parchment-50 border-b border-parchment-300 px-4 py-3 flex items-center justify-between z-10">
                <div className="font-serif-display text-[20px] text-ink">Notifications</div>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="font-ui text-[11px] text-wax hover:text-wax-500 underline underline-offset-2"
                      data-testid="notifications-mark-all-read"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="text-ink-500 hover:text-ink"
                    aria-label="Close notifications"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="px-4 py-2">
                {loading ? (
                  <div className="py-8 text-center font-ui text-ink-500 text-[13px]">
                    Consulting the ledger…
                  </div>
                ) : notifs.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="font-serif-display text-[18px] text-ink-600">All quiet.</div>
                    <p className="font-ui text-[12px] text-ink-500 mt-1">
                      No notifications yet. Join or witness a bond to start receiving updates.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-parchment-200">
                    {notifs.map((n) => (
                      <div
                        key={n.id}
                        className={`py-3 flex items-start gap-3 ${!n.read ? "bg-wax/5" : ""}`}
                        data-testid={`notification-${n.id}`}
                      >
                        <div className="shrink-0 text-[18px] mt-0.5">
                          {KIND_ICONS[n.kind] || "\uD83D\uDCB3"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-serif-display text-[14px] text-ink leading-tight">
                            {n.message}
                          </div>
                          <div className="font-ui text-[10px] text-ink-500 mt-1">
                            {fmtTimeAgo(n.created_at)}
                            {n.bond_title && ` · ${n.bond_title}`}
                          </div>
                        </div>
                        {!n.read && (
                          <div className="shrink-0 w-2 h-2 rounded-full bg-wax mt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default NotificationsBell;
