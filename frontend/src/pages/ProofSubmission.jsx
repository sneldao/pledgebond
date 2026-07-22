import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import AppShell from "@/components/AppShell";
import RibbonButton from "@/components/RibbonButton";
import WaxStamp from "@/components/WaxStamp";
import SealLoader from "@/components/SealLoader";
import { api } from "@/lib/api";
import { getMyParticipantId } from "@/lib/session";
import { sfx } from "@/lib/sound";
import { toast } from "sonner";
import { Upload, Camera } from "lucide-react";
import { particleBurst } from "@/components/motion";

export default function ProofSubmission() {
  const { id, taskId } = useParams();
  const nav = useNavigate();
  const myPid = getMyParticipantId(id);
  const [bond, setBond] = useState(null);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState("");
  const [numeric, setNumeric] = useState("");
  const [image, setImage] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const b = await api.getBond(id);
        setBond(b);
        setTask(b.task_requirements.find((t) => t.id === taskId));
      } catch (e) {
        toast.error("Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, taskId]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target.result);
    reader.readAsDataURL(f);
  };

  const submit = async () => {
    if (!myPid) {
      toast.error("Only a witnessed fundee can log this clause.");
      return;
    }
    try {
      setSubmitting(true);
      const kind = task.verification === "photo_upload" ? "photo" : task.verification === "numeric" ? "numeric" : "self";
      const body = {
        participant_id: myPid,
        task_id: task.id,
        kind,
        note,
        numeric_value: numeric ? Number(numeric) : null,
        image_data_url: image,
      };
      const b = await api.submitProof(id, body);
      sfx.pledgeIn();
      
      // Particle burst celebration
      particleBurst(window.innerWidth / 2, window.innerHeight / 2);
      
      toast.success("Clause fulfilled", { description: "Auto-approved on this demo ledger." });
      nav(`/bond/${id}`);
    } catch (e) {
      console.error(e);
      toast.error("Could not submit proof", { description: e?.response?.data?.detail || e.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !bond || !task) {
    return <AppShell showBack><SealLoader label="Unrolling the clause..." size={100} /></AppShell>;
  }

  return (
    <AppShell showBack backTo={`/bond/${id}`} title="Log a clause">
      <div className="pt-4">
        <div className="flex items-center gap-2">
          <WaxStamp>{task.verification.replace("_", " ")}</WaxStamp>
          <div className="font-ui text-[11px] uppercase tracking-widest text-ink-500">Clause of — {bond.title}</div>
        </div>
        <h1 className="font-serif-display text-[26px] leading-tight text-ink mt-2">{task.title}</h1>
        {task.target && (
          <p className="font-serif-display italic text-[14px] text-ink-600 mt-1">Target: {task.target}{task.unit ? " " + task.unit : ""}</p>
        )}

        <div className="mt-6 space-y-4">
          {(task.verification === "numeric" || task.task_type === "timed_ranked") && (
            <div>
              <label className="font-serif-display text-[15px] text-ink-700">Your value</label>
              <input
                type="number"
                value={numeric}
                onChange={(e) => setNumeric(e.target.value)}
                data-testid="proof-numeric-input"
                placeholder={task.unit || "value"}
                className="w-full mt-1 px-3 py-2.5 bg-parchment-50 border-b-2 border-ink outline-none font-ui text-[16px] text-ink focus:border-wax"
              />
            </div>
          )}

          {task.verification === "photo_upload" && (
            <div>
              <label className="font-serif-display text-[15px] text-ink-700">Upload photo / video</label>
              <div className="mt-2">
                <label
                  htmlFor="proof-file-input"
                  className="cursor-pointer flex items-center justify-center gap-2 py-8 border-2 border-dashed border-parchment-300 bg-parchment-50 text-ink-600 hover:bg-parchment-200"
                >
                  <Upload size={16} /> <span className="font-ui text-[13px]">Choose file or drag here</span>
                </label>
                <input
                  id="proof-file-input"
                  type="file"
                  accept="image/*,video/*"
                  onChange={onFile}
                  data-testid="proof-file-input"
                  className="hidden"
                />
                {image && (
                  <div className="mt-3 border border-parchment-300 p-2 bg-parchment-50">
                    <img src={image} alt="proof preview" className="max-h-56 mx-auto" />
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="font-serif-display text-[15px] text-ink-700">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              data-testid="proof-note-input"
              placeholder="A word for the record..."
              className="w-full mt-1 px-3 py-2.5 bg-parchment-50 border border-parchment-300 outline-none font-ui text-[14.5px] text-ink focus:border-wax"
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0" style={{ background: "linear-gradient(0deg, rgba(255,251,242,1) 60%, rgba(255,251,242,0))" }}>
        <div className="mx-auto w-full max-w-[460px] px-4 py-4 flex items-center gap-3">
          <RibbonButton variant="ghost" onClick={() => nav(`/bond/${id}`)} className="flex-1" data-testid="proof-cancel-button">Cancel</RibbonButton>
          <RibbonButton variant="wax" onClick={submit} disabled={submitting} className="flex-1" data-testid="proof-submit-button">
            {submitting ? "Sealing..." : "Seal my mark"}
          </RibbonButton>
        </div>
      </div>
    </AppShell>
  );
}
