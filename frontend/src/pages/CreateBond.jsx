import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppShell from "@/components/AppShell";
import RibbonButton from "@/components/RibbonButton";
import WaxStamp from "@/components/WaxStamp";
import VaultSeal from "@/components/VaultSeal";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { getSession } from "@/lib/session";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { CategoryMotif } from "@/components/PbIllustrations";
import { 
  StaggeredList, 
  particleBurst,
  SignetRingPicker,
  TensionSlider,
  TENSION_PRESETS,
  AtmospherePicker,
  ATMOSPHERES,
  DeadlineChips,
} from "@/components/motion";

const TASK_TEMPLATES = [
  { title: "Hula hoop duration (minutes)", task_type: "timed_ranked", verification: "numeric", target: 60, unit: "min" },
  { title: "Skipping rep count", task_type: "timed_ranked", verification: "numeric", target: 500, unit: "reps" },
  { title: "Rubik's cube solve (seconds)", task_type: "timed_ranked", verification: "numeric", target: 30, unit: "sec" },
  { title: "Chili ladder — level clear", task_type: "binary", verification: "photo_upload" },
  { title: "5-hour endurance session", task_type: "timed_ranked", verification: "numeric", target: 300, unit: "min" },
  { title: "5-minute comedy set", task_type: "binary", verification: "photo_upload" },
  { title: "Daily streak check-in (habit)", task_type: "binary", verification: "self_report" },
  { title: "Course unit completed", task_type: "binary", verification: "self_report" },
];

const STEPS = [
  { key: "basics", label: "Basics" },
  { key: "stakes", label: "Stakes" },
  { key: "clauses", label: "Clauses" },
  { key: "split", label: "Split" },
  { key: "seal", label: "Seal" },
];

// Contest template — pre-fills the form for the self-referential contest bond
const CONTEST_TEMPLATE = {
  title: "Ship My Contest Entry by Deadline",
  category: "project",
  description: "I pledge to ship and submit my Fabrizio Romano x Emergent Builder's Contest entry before the deadline. Witnesses hold me accountable — no last-minute excuses.",
  cause_name: "Builder's Contest $100K Prize Pool",
  funder_amount: 1000,
  activation_threshold: 200,
  fundee_pledge_amount: 10,
  completion_target_percent: 70,
  seal_style: "gold",
  cover_emoji: "\uD83C\uDFC6",
  task_requirements: [
    { id: crypto.randomUUID(), title: "Submit entry to contest page", task_type: "binary", verification: "self_report" },
    { id: crypto.randomUUID(), title: "Share entry link with 3 friends", task_type: "binary", verification: "self_report" },
    { id: crypto.randomUUID(), title: "Screenshot live submission", task_type: "binary", verification: "photo_upload" },
  ],
  payout_split: [
    { label: "Prize Celebration", percent: 70 },
    { label: "Next Project Fund", percent: 25 },
    { label: "Platform Fee", percent: 5 },
  ],
};

// Football template — "HERE WE GO" themed pledge for football fans
const FOOTBALL_TEMPLATE = {
  title: "HERE WE GO: My Football Pledge",
  category: "football",
  description: "Seal your vow like a transfer deal. Pledge to hit your football goal — fitness, skills, watch every match, or coach your kid's team. Your crew witnesses it. Miss the deadline and everyone sees the L. HERE WE GO.",
  cause_name: "Grassroots Football Academy",
  funder_amount: 2000,
  activation_threshold: 300,
  fundee_pledge_amount: 15,
  completion_target_percent: 70,
  seal_style: "burgundy",
  cover_emoji: "\u26BD",
  task_requirements: [
    { id: crypto.randomUUID(), title: "Log first training session", task_type: "binary", verification: "self_report" },
    { id: crypto.randomUUID(), title: "Weekly check-in (4 weeks)", task_type: "binary", verification: "self_report" },
    { id: crypto.randomUUID(), title: "Upload 5K run time (seconds)", task_type: "timed_ranked", verification: "numeric", target: 1800, unit: "sec" },
    { id: crypto.randomUUID(), title: "Photo proof at finish line", task_type: "binary", verification: "photo_upload" },
  ],
  payout_split: [
    { label: "Grassroots Academy", percent: 60 },
    { label: "Kit Fund", percent: 25 },
    { label: "Top Finishers", percent: 10 },
    { label: "Platform Fee", percent: 5 },
  ],
};

// Fitness template — general 30-day fitness pledge
const FITNESS_TEMPLATE = {
  title: "30-Day Fitness Pledge",
  category: "fitness",
  description: "Pledge to hit your fitness goal in 30 days — run 5K, hit the gym 3x/week, or beat your personal best. Your crew witnesses every check-in. Miss the deadline and everyone sees the L.",
  cause_name: "Community Wellness Fund",
  funder_amount: 1500,
  activation_threshold: 250,
  fundee_pledge_amount: 15,
  completion_target_percent: 70,
  seal_style: "emerald",
  cover_emoji: "\uD83C\uDFC3",
  task_requirements: [
    { id: crypto.randomUUID(), title: "Log first workout", task_type: "binary", verification: "self_report" },
    { id: crypto.randomUUID(), title: "Weekly check-in (4 weeks)", task_type: "binary", verification: "self_report" },
    { id: crypto.randomUUID(), title: "Upload workout photo", task_type: "binary", verification: "photo_upload" },
    { id: crypto.randomUUID(), title: "Record final 5K time (seconds)", task_type: "timed_ranked", verification: "numeric", target: 1800, unit: "sec" },
  ],
  payout_split: [
    { label: "Community Wellness", percent: 60 },
    { label: "Gym Fund", percent: 25 },
    { label: "Top Finishers", percent: 10 },
    { label: "Platform Fee", percent: 5 },
  ],
};

export default function CreateBond() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const session = getSession();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [quickSealMode, setQuickSealMode] = useState(true); // Default to Quick Seal

  const [form, setForm] = useState(() => {
    const base = {
      title: "",
      description: "",
      category: "individual",
      cause_name: "",
      cause_link: "",
      funder_name: session?.displayName || "",
      funder_amount: 2500,
      activation_threshold: 400,
      fundee_pledge_amount: 25,
      deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
      completion_target_percent: 70,
      seal_style: "burgundy",
      task_requirements: [
        { id: crypto.randomUUID(), title: "Log start time", task_type: "binary", verification: "self_report" },
      ],
      payout_split: [
        { label: "Cause A", percent: 50 },
        { label: "Cause B", percent: 25 },
        { label: "Top 5", percent: 20 },
        { label: "Platform Fee", percent: 5 },
      ],
    };
    // Apply contest template if ?template=contest
    if (searchParams.get("template") === "contest") {
      Object.assign(base, CONTEST_TEMPLATE);
    }
    // Apply football template if ?template=football
    if (searchParams.get("template") === "football") {
      Object.assign(base, FOOTBALL_TEMPLATE);
    }
    // Apply fitness template if ?template=fitness
    if (searchParams.get("template") === "fitness") {
      Object.assign(base, FITNESS_TEMPLATE);
    }
    // Apply individual URL param overrides (allows deep-linking to pre-filled bonds)
    const titleParam = searchParams.get("title");
    if (titleParam) base.title = titleParam;
    const descParam = searchParams.get("description");
    if (descParam) base.description = descParam;
    const causeParam = searchParams.get("cause");
    if (causeParam) base.cause_name = causeParam;
    const stakeParam = searchParams.get("stake");
    if (stakeParam) base.funder_amount = Number(stakeParam);
    const sealParam = searchParams.get("seal");
    if (sealParam && ["burgundy", "gold", "emerald"].includes(sealParam)) base.seal_style = sealParam;
    return base;
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const canNext = useMemo(() => {
    if (step === 0) return form.title.trim().length >= 3 && form.cause_name.trim().length >= 2;
    if (step === 1) return form.funder_amount > 0 && form.activation_threshold > 0 && form.fundee_pledge_amount > 0;
    if (step === 2) return form.task_requirements.length > 0 && form.task_requirements.every((t) => t.title.trim());
    if (step === 3) return form.payout_split.reduce((s, p) => s + Number(p.percent || 0), 0) === 100;
    return true;
  }, [step, form]);

  const submit = async () => {
    setSaving(true);
    try {
      const body = {
        ...form,
        funder_amount: Number(form.funder_amount),
        activation_threshold: Number(form.activation_threshold),
        fundee_pledge_amount: Number(form.fundee_pledge_amount),
        completion_target_percent: Number(form.completion_target_percent),
        deadline: new Date(form.deadline).toISOString(),
        task_requirements: form.task_requirements.map((t) => ({ ...t, target: t.target ? Number(t.target) : undefined })),
        payout_split: form.payout_split.map((p) => ({ label: p.label, percent: Number(p.percent) })),
      };
      const bond = await api.createBond(body);
      
      // Trigger particle burst on success
      particleBurst(window.innerWidth / 2, window.innerHeight / 2);
      
      toast.success("Pledge drafted — the seal awaits.", { description: bond.title });
      nav(`/bond/${bond.id}`);
    } catch (e) {
      console.error(e);
      toast.error("Could not draft the pledge.", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const activeSteps = quickSealMode 
    ? STEPS.filter(s => ["basics", "stakes", "seal"].includes(s.key))
    : STEPS;

  return (
    <AppShell showBack backTo="/explore" title="Draft a Pledge">
      {/* Quick Seal Mode Toggle */}
      <motion.div 
        className="mt-4 mb-6 flex items-center justify-between p-3 bg-parchment-100 border border-parchment-300 rounded-lg"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="flex-1">
          <div className="font-serif-display text-[14px] text-ink font-medium">
            {quickSealMode ? "Quick Seal" : "Advanced Draft"}
          </div>
          <div className="font-ui text-[11px] text-ink-500">
            {quickSealMode ? "Simple 3-step flow with smart defaults" : "Full control over all bond details"}
          </div>
        </div>
        <button
          onClick={() => {
            setQuickSealMode(!quickSealMode);
            setStep(0); // Reset to first step when toggling
          }}
          className={`relative w-14 h-7 rounded-full transition-colors ${
            quickSealMode ? "bg-wax" : "bg-parchment-300"
          }`}
          data-testid="quick-seal-toggle"
        >
          <motion.div
            className="absolute top-1 w-5 h-5 bg-parchment rounded-full shadow-md"
            animate={{
              left: quickSealMode ? "32px" : "4px",
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
      </motion.div>

      {/* Stepper with animated progress */}
      <motion.div 
        className="mt-4 flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {activeSteps.map((s, i) => (
          <div key={s.key} className="flex-1 flex items-center gap-2">
            <motion.button
              onClick={() => setStep(STEPS.indexOf(s))}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-serif-display text-[15px] border transition-colors ${
                STEPS.indexOf(s) === step
                  ? "bg-wax text-parchment border-wax"
                  : STEPS.indexOf(s) < step
                    ? "bg-gold text-ink border-gold"
                    : "bg-transparent text-ink border-parchment-300"
              }`}
              data-testid={`create-step-${s.key}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              animate={STEPS.indexOf(s) === step ? { 
                scale: [1, 1.1, 1],
                transition: { duration: 0.6, repeat: Infinity, repeatDelay: 2 }
              } : {}}
            >
              {i + 1}
            </motion.button>
            <span className={`font-ui text-[11.5px] ${STEPS.indexOf(s) === step ? "text-ink" : "text-ink-500"}`}>{s.label}</span>
            {i < activeSteps.length - 1 && <span className="flex-1 ink-divider ml-1" />}
          </div>
        ))}
      </motion.div>

      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8
            }}
          >
            {step === 0 && <BasicsStep form={form} set={set} />}
            {step === 1 && <StakesStep form={form} set={set} />}
            {step === 2 && <ClausesStep form={form} set={set} />}
            {step === 3 && <SplitStep form={form} set={set} />}
            {step === 4 && <SealStep form={form} set={set} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40" style={{ background: "linear-gradient(0deg, rgba(255,251,242,1) 60%, rgba(255,251,242,0))" }}>
        <div className="mx-auto w-full max-w-[460px] px-4 py-4 flex items-center gap-3">
          <RibbonButton
            variant="ghost"
            onClick={() => {
              const currentStepIndex = activeSteps.findIndex(s => STEPS.indexOf(s) === step);
              if (currentStepIndex > 0) {
                setStep(STEPS.indexOf(activeSteps[currentStepIndex - 1]));
              } else {
                nav(-1);
              }
            }}
            data-testid="create-back-button"
            className="flex-1"
          >
            {step === 0 ? "Cancel" : "Back"}
          </RibbonButton>
          {step < STEPS.indexOf(activeSteps[activeSteps.length - 1]) ? (
            <RibbonButton
              variant="wax"
              onClick={() => {
                const currentStepIndex = activeSteps.findIndex(s => STEPS.indexOf(s) === step);
                if (canNext && currentStepIndex < activeSteps.length - 1) {
                  setStep(STEPS.indexOf(activeSteps[currentStepIndex + 1]));
                }
              }}
              data-testid="create-next-button"
              className="flex-1"
              disabled={!canNext}
              style={{ opacity: canNext ? 1 : 0.55, cursor: canNext ? "pointer" : "not-allowed" }}
            >
              Continue
            </RibbonButton>
          ) : (
            <RibbonButton
              variant="gold"
              onClick={submit}
              disabled={saving}
              data-testid="create-submit-button"
              className="flex-1"
            >
              {saving ? "Pressing wax..." : "Press the Seal"}
            </RibbonButton>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="mb-4">
      <label className="font-serif-display text-[15px] text-ink-700 block mb-1">{label}</label>
      {children}
      {hint && <p className="font-ui text-[11px] text-ink-500 mt-1">{hint}</p>}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2.5 bg-parchment-50 border-b-2 border-ink outline-none font-ui text-[15px] text-ink focus:border-wax transition-colors ${props.className || ""}`}
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`w-full px-3 py-2.5 bg-parchment-50 border border-parchment-300 outline-none font-ui text-[14.5px] text-ink focus:border-wax transition-colors ${props.className || ""}`}
    />
  );
}

function BasicsStep({ form, set }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <CategoryMotif category={form.category || "custom"} size="medium" />
        <h2 className="font-serif-display text-[24px] text-ink">Set the stage</h2>
      </div>
      <p className="font-ui text-[12.5px] text-ink-500 mb-4">Give this bond a title, a purpose, and a cause it serves.</p>
      <Field label="Bond title" hint="e.g. '5-Hour Hula Hoop Endurance'">
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} data-testid="create-title-input" placeholder="Name your challenge..." />
      </Field>
      <Field label="Description">
        <TextArea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} data-testid="create-description-input" placeholder="What is the group promising?" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <div className="flex gap-1">
            {[
              { k: "football", label: "\u26BD Football" },
              { k: "fitness", label: "Fitness" },
              { k: "project", label: "Project" },
              { k: "custom", label: "Custom" },
            ].map((o) => (
              <button
                key={o.k}
                onClick={() => set("category", o.k)}
                data-testid={`create-category-${o.k}`}
                className={`flex-1 px-2 py-2 border text-[13px] font-ui flex items-center justify-center gap-1 ${form.category === o.k ? "bg-ink text-parchment border-ink" : "bg-transparent text-ink border-parchment-300"}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Cover mark (optional)">
          <Input value={form.cover_emoji} onChange={(e) => set("cover_emoji", e.target.value)} data-testid="create-cover-emoji-input" placeholder="e.g. \uD83D\uDD25" />
        </Field>
      </div>
      <Field label="Cause name">
        <Input value={form.cause_name} onChange={(e) => set("cause_name", e.target.value)} data-testid="create-cause-name-input" placeholder="e.g. Children's Music Therapy Fund" />
      </Field>
      <Field label="Cause link (optional)">
        <Input value={form.cause_link} onChange={(e) => set("cause_link", e.target.value)} data-testid="create-cause-link-input" placeholder="https://..." />
      </Field>
    </div>
  );
}

function StakesStep({ form, set }) {
  const handleTensionChange = (presetKey, presetData) => {
    set("tension_preset", presetKey);
    set("funder_amount", presetData.funder_amount);
    set("activation_threshold", presetData.activation_threshold);
    set("fundee_pledge_amount", presetData.fundee_pledge_amount);
    set("completion_target_percent", presetData.completion_target_percent);
  };

  return (
    <div>
      <h2 className="font-serif-display text-[24px] text-ink">Stakes & timing</h2>
      <p className="font-ui text-[12.5px] text-ink-500 mb-6">How much you stake, how much each fundee matches, and when the seal expires.</p>

      <Field label="Tension level" hint="Choose how much pressure you want. Higher stakes = higher commitment.">
        <TensionSlider
          value={form.tension_preset || "standard"}
          onChange={handleTensionChange}
        />
      </Field>

      <Field label="Deadline">
        <DeadlineChips
          value={form.deadline}
          onChange={(date) => set("deadline", date)}
          data-testid="create-deadline-chips"
        />
        <div className="mt-3">
          <Input 
            type="datetime-local" 
            value={form.deadline} 
            onChange={(e) => set("deadline", e.target.value)} 
            data-testid="create-deadline-input"
            className="text-sm"
          />
        </div>
      </Field>
    </div>
  );
}

function ClausesStep({ form, set }) {
  const updateTask = (i, patch) => {
    const next = [...form.task_requirements];
    next[i] = { ...next[i], ...patch };
    set("task_requirements", next);
  };
  const removeTask = (i) => {
    const next = form.task_requirements.filter((_, idx) => idx !== i);
    set("task_requirements", next.length ? next : [{ id: crypto.randomUUID(), title: "", task_type: "binary", verification: "self_report" }]);
  };
  const addTask = (template) => {
    const t = template || { title: "", task_type: "binary", verification: "self_report" };
    set("task_requirements", [...form.task_requirements, { id: crypto.randomUUID(), ...t }]);
  };

  return (
    <div>
      <h2 className="font-serif-display text-[24px] text-ink">Clauses of the bond</h2>
      <p className="font-ui text-[12.5px] text-ink-500 mb-4">Each task must be provable. Add self-report, photo, or numeric proof types.</p>

      <div className="space-y-3">
        {form.task_requirements.map((t, i) => (
          <div key={t.id} className="ornate-frame p-3 relative" data-testid={`create-task-row-${i}`}>
            <button
              onClick={() => removeTask(i)}
              className="absolute top-2 right-2 text-ink-500 hover:text-wax"
              data-testid={`create-task-remove-${i}`}
              aria-label="Remove clause"
            >
              <Trash2 size={14} />
            </button>
            <label className="font-ui text-[11px] uppercase tracking-widest text-ink-500">Clause {i + 1}</label>
            <Input
              value={t.title}
              onChange={(e) => updateTask(i, { title: e.target.value })}
              placeholder="Task title..."
              data-testid={`create-task-title-${i}`}
              className="mt-1"
            />
            <div className="grid grid-cols-2 gap-2 mt-2">
              <select
                value={t.task_type}
                onChange={(e) => updateTask(i, { task_type: e.target.value })}
                data-testid={`create-task-type-${i}`}
                className="px-2 py-2 bg-parchment-50 border border-parchment-300 font-ui text-[13px]"
              >
                <option value="binary">Binary (done / not done)</option>
                <option value="threshold_percent">Group % threshold</option>
                <option value="timed_ranked">Timed / Ranked</option>
              </select>
              <select
                value={t.verification}
                onChange={(e) => updateTask(i, { verification: e.target.value })}
                data-testid={`create-task-verif-${i}`}
                className="px-2 py-2 bg-parchment-50 border border-parchment-300 font-ui text-[13px]"
              >
                <option value="self_report">Self report</option>
                <option value="photo_upload">Photo / video</option>
                <option value="numeric">Numeric log</option>
              </select>
            </div>
            {(t.task_type === "timed_ranked" || t.verification === "numeric") && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input value={t.target || ""} onChange={(e) => updateTask(i, { target: e.target.value })} placeholder="Target" data-testid={`create-task-target-${i}`} />
                <Input value={t.unit || ""} onChange={(e) => updateTask(i, { unit: e.target.value })} placeholder="Unit (min, reps...)" data-testid={`create-task-unit-${i}`} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="font-serif-display text-[15px] text-ink-700 mb-2">Or add from templates:</div>
        <div className="flex flex-wrap gap-2">
          {TASK_TEMPLATES.map((t) => (
            <button
              key={t.title}
              onClick={() => addTask(t)}
              className="px-3 py-1.5 border border-parchment-300 text-[12px] font-ui text-ink hover:bg-parchment-200"
              data-testid={`create-task-template-${t.title.slice(0, 10)}`}
            >
              + {t.title}
            </button>
          ))}
        </div>
        <button
          onClick={() => addTask()}
          className="mt-3 inline-flex items-center gap-1 text-[13px] font-ui text-wax hover:text-wax-500 underline underline-offset-4"
          data-testid="create-add-blank-task"
        >
          <Plus size={13} /> Add a blank clause
        </button>
      </div>
    </div>
  );
}

function SplitStep({ form, set }) {
  const update = (i, patch) => {
    const next = [...form.payout_split];
    next[i] = { ...next[i], ...patch };
    set("payout_split", next);
  };
  const total = form.payout_split.reduce((s, p) => s + Number(p.percent || 0), 0);

  return (
    <div>
      <h2 className="font-serif-display text-[24px] text-ink">Payout pockets</h2>
      <p className="font-ui text-[12.5px] text-ink-500 mb-4">On release, coins flow to each pocket. Percentages must total 100.</p>

      <div className="space-y-2">
        {form.payout_split.map((p, i) => (
          <div key={i} className="ledger-row flex items-center gap-3 py-2">
            <Input
              value={p.label}
              onChange={(e) => update(i, { label: e.target.value })}
              data-testid={`create-split-label-${i}`}
              className="flex-1"
              placeholder="Pocket label"
            />
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                max={100}
                value={p.percent}
                onChange={(e) => update(i, { percent: e.target.value })}
                data-testid={`create-split-percent-${i}`}
                className="w-16 text-right"
              />
              <span className="font-ui text-[13px]">%</span>
            </div>
            <button
              onClick={() => set("payout_split", form.payout_split.filter((_, idx) => idx !== i))}
              className="text-ink-500 hover:text-wax"
              aria-label="Remove pocket"
              data-testid={`create-split-remove-${i}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => set("payout_split", [...form.payout_split, { label: "New pocket", percent: 0 }])}
        className="mt-3 inline-flex items-center gap-1 text-[13px] font-ui text-wax underline underline-offset-4"
        data-testid="create-split-add"
      >
        <Plus size={13} /> Add a pocket
      </button>
      <div className={`mt-4 font-ui text-[13px] ${total === 100 ? "text-ink-700" : "text-wax"}`}>Total: {total}% {total !== 100 && "(must be 100)"}
      </div>
    </div>
  );
}

function SealStep({ form, set }) {
  const totalPledged = 0;
  const handleSignetChange = (style) => {
    set("signet_style", style);
  };
  
  const handleAtmosphereChange = (atmosphere) => {
    set("atmosphere", atmosphere);
  };

  // Generate initials from funder_name
  const initials = form.funder_name 
    ? form.funder_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'XX';

  return (
    <div>
      <h2 className="font-serif-display text-[24px] text-ink mb-2">Seal the bond</h2>
      <p className="font-ui text-[12.5px] text-ink-500 mb-6">Personalize your bond's identity and atmosphere.</p>

      <Field label="Signet ring" hint="Your personalized seal — choose the heraldic style.">
        <SignetRingPicker
          initials={initials}
          value={form.signet_style || "classic"}
          onChange={handleSignetChange}
          data-testid="create-signet-picker"
        />
      </Field>

      <Field label="Seal color" hint="The wax color that represents your bond.">
        <div className="grid grid-cols-3 gap-3">
          {[
            { k: "burgundy", label: "Burgundy", desc: "Traditional, passionate" },
            { k: "gold", label: "Aged Gold", desc: "Premium, prestigious" },
            { k: "emerald", label: "Emerald", desc: "Growth, renewal" },
          ].map((s) => (
            <button
              key={s.k}
              onClick={() => set("seal_style", s.k)}
              data-testid={`create-seal-style-${s.k}`}
              className={`p-3 border-2 transition-all ${form.seal_style === s.k ? "border-wax bg-parchment-100 shadow-wax" : "border-parchment-300 hover:border-ink-400"} flex flex-col items-center gap-2`}
            >
              <VaultSeal status="pending" pledgeRatio={0.5} size={64} style={s.k} showTension={false} hidePill />
              <span className="font-serif-display text-[12px] text-ink font-medium">{s.label}</span>
              <span className="font-ui text-[10px] text-ink-500">{s.desc}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="Atmosphere" hint="The visual vibe of your bond page.">
        <AtmospherePicker
          value={form.atmosphere || "archive"}
          onChange={handleAtmosphereChange}
          data-testid="create-atmosphere-picker"
        />
      </Field>

      <div className="mt-6 ornate-frame p-4 bg-parchment-50">
        <div className="font-serif-display text-[16px] text-ink mb-2">Ready to press?</div>
        <div className="space-y-2 font-ui text-[12px] text-ink-600">
          <div className="flex justify-between">
            <span>Bond:</span>
            <span className="font-medium text-ink">{form.title}</span>
          </div>
          <div className="flex justify-between">
            <span>Tension:</span>
            <span className="font-medium text-ink capitalize">{form.tension_preset || "standard"}</span>
          </div>
          <div className="flex justify-between">
            <span>Funder stake:</span>
            <span className="font-medium text-ink">${form.funder_amount}</span>
          </div>
          <div className="flex justify-between">
            <span>Activation:</span>
            <span className="font-medium text-ink">${form.activation_threshold}</span>
          </div>
          <div className="flex justify-between">
            <span>Fundee pledge:</span>
            <span className="font-medium text-ink">${form.fundee_pledge_amount}</span>
          </div>
          <div className="flex justify-between">
            <span>Deadline:</span>
            <span className="font-medium text-ink">{new Date(form.deadline).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Seal:</span>
            <span className="font-medium text-ink capitalize">{form.seal_style} {form.signet_style || "classic"}</span>
          </div>
          <div className="flex justify-between">
            <span>Atmosphere:</span>
            <span className="font-medium text-ink capitalize">{form.atmosphere || "archive"}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-parchment-300 font-ui text-[11px] text-ink-500">
          The bond will be published as "Awaiting Seal" until the fundee pool reaches ${form.activation_threshold}.
        </div>
      </div>
    </div>
  );
}
