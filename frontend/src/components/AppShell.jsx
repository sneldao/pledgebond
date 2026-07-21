import React from "react";
import { useNavigate } from "react-router-dom";
import { getSession, clearSession } from "@/lib/session";
import { isMuted, setMuted, unlockAudio } from "@/lib/sound";
import { Volume2, VolumeX, ChevronLeft, Compass } from "lucide-react";
import { useEffect, useState } from "react";

export const AppShell = ({ children, showBack = false, backTo = null, title = "", right = null }) => {
  const nav = useNavigate();
  const session = getSession();
  const [muted, setLocalMuted] = useState(isMuted());

  useEffect(() => {
    unlockAudio();
  }, []);

  const toggleMute = () => {
    const nm = !muted;
    setMuted(nm);
    setLocalMuted(nm);
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col relative parchment-noise">
      {/* Top bar */}
      <div className="sticky top-0 z-30 backdrop-blur-sm" style={{ background: "linear-gradient(180deg, rgba(255,251,242,0.96) 0%, rgba(251,242,227,0.86) 100%)", borderBottom: "1px solid rgba(199,177,138,0.55)" }}>
        <div className="mx-auto w-full max-w-[460px] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showBack ? (
              <button
                onClick={() => (backTo ? nav(backTo) : nav(-1))}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-ink text-ink hover:bg-parchment-200 transition-colors"
                data-testid="appshell-back-button"
                aria-label="Back"
              >
                <ChevronLeft size={18} />
              </button>
            ) : (
              <button
                onClick={() => nav("/explore")}
                className="flex items-center gap-2 font-serif-display text-[20px] text-ink"
                data-testid="appshell-logo-button"
              >
                <span className="inline-block w-6 h-6 rounded-full" style={{ background: "radial-gradient(circle at 30% 30%, #9A1F3D 0%, #7B1730 60%, #4A0F1E 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)" }} />
                Pledgebond
              </button>
            )}
            {title && <span className="font-serif-display text-[18px] text-ink-700 ml-2">{title}</span>}
          </div>
          <div className="flex items-center gap-2">
            {right}
            <button
              onClick={toggleMute}
              className="w-9 h-9 flex items-center justify-center rounded-full border border-parchment-300 text-ink-700 hover:bg-parchment-200 transition-colors"
              data-testid="appshell-mute-toggle"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            {session && (
              <button
                onClick={() => nav("/explore")}
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded border border-parchment-300 text-ink-700 hover:bg-parchment-200"
                data-testid="appshell-explore-button"
              >
                <Compass size={14} /> <span className="font-ui text-xs">Explore</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 mx-auto w-full max-w-[460px] px-4 pb-32">
        {children}
      </main>

      {/* Footer sentinel */}
      <div className="mx-auto w-full max-w-[460px] px-4 pb-8 pt-2">
        <div className="text-center font-ui text-[10px] text-ink-500 tracking-widest uppercase opacity-70">
          Recorded in the Pledgebond demo ledger
        </div>
      </div>
    </div>
  );
};

export default AppShell;
