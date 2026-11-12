import { useState, useCallback } from "react";
import { extractMerchant } from "../utils/categories.js";
import { detectSubscriptions, detectRecurring } from "../utils/recurring.js";
import { ALL_CATS, extendAllCats } from "../utils/allCats.js";
import { splitDuplicates, byDateDesc } from "../utils/dedupe.js";
import { toDate } from "../utils/format.js";

const isGoalReminder = r => /^🎯 (Meta|Goal)/.test(r.text || "");

export function useTransactions({
  updateMemory, setMerchantMemory, setCustomCats,
  setBudgets, setCatGroups, setShowBudgetWiz,
  setAutoPayments, setReminders, setWidgetConfig,
  setUser, setLang,
  setSplitGroups, setSplitExpenses, setSettlements,
  showToast, setPage,
  user, merchantMemory, autoPayments, lang,
}) {
  const [transactions, setTransactions] = useState([]);
  const [comments, setComments]         = useState({});
  const [reimbursed, setReimbursed]     = useState({});
  const [pending, setPending]           = useState(null);
  const [detectedSubs, setDetectedSubs] = useState([]);
  const [unknownTxns, setUnknownTxns]   = useState([]);
  const [showSubVerify, setShowSubVerify] = useState(false);
  const [showCatReview, setShowCatReview] = useState(false);
  const [isFirstUpload, setIsFirstUpload] = useState(true);
  const [modalSteps, setModalSteps]     = useState([]);

  const es = lang === "es";

  // Adds transactions to state. Rows already loaded are skipped unless the user
  // explicitly chose "include anyway" in the duplicate warning.
  const addTxns = useCallback((txns, allowDuplicates) => {
    const fresh = allowDuplicates ? txns : splitDuplicates(transactions, txns).fresh;
    setTransactions(prev => [...prev, ...fresh].sort(byDateDesc));
    return fresh;
  }, [transactions]);

  const finalizeTxns = useCallback((txns, { allowDuplicates = false, skipWizard = false } = {}) => {
    const fresh = addTxns(txns, allowDuplicates);
    updateMemory(txns);
    showToast(es ? `${fresh.length} movimientos cargados` : `Loaded ${fresh.length} transactions`);
    setPage("dashboard");
    if (isFirstUpload && !user?.quickStart && !skipWizard) { setShowBudgetWiz(true); }
    setIsFirstUpload(false);
  }, [addTxns, isFirstUpload, updateMemory, user, showToast, setPage, setShowBudgetWiz, es]);

  // Restores everything a Moneda export carries besides the transactions themselves.
  const restoreSavedState = useCallback((parsed, txns) => {
    const { savedAutoPayments = [], savedReminders = [], savedBudgets = {}, savedCustomCats = [], savedWidgetConfig = [], savedProfile = null, savedSplits = null, savedState = null } = parsed;
    // Custom categories from the Config sheet + any non-standard cats in transactions
    const txnCats = txns.filter(t => t.cat && t.cat !== "Income").map(t => t.cat);
    const allRestoredCats = [...new Set([...savedCustomCats, ...txnCats])].filter(c => !ALL_CATS.includes(c));
    if (allRestoredCats.length > 0) { setCustomCats(c => [...new Set([...c, ...allRestoredCats])]); extendAllCats(allRestoredCats); }
    // Auto payments (merge, don't duplicate by name)
    if (savedAutoPayments.length > 0) setAutoPayments(ps => { const names = new Set(ps.map(p => p.name)); return [...ps, ...savedAutoPayments.filter(p => !names.has(p.name))]; });
    // Reminders: skip ones already present, and let the saved goal reminder replace the one
    // onboarding creates every session (otherwise they pile up, one per save/restore cycle).
    if (savedReminders.length > 0) setReminders(rs => {
      const base = savedReminders.some(isGoalReminder) ? rs.filter(r => !isGoalReminder(r)) : rs;
      const seen = new Set(base.map(r => `${r.text}|${r.repeat}`));
      const add = savedReminders.filter(r => { const k = `${r.text}|${r.repeat}`; if (seen.has(k)) return false; seen.add(k); return true; });
      return [...base, ...add];
    });
    if (Object.keys(savedBudgets).length > 0) setBudgets(prev => ({ ...savedBudgets, ...prev }));
    if (savedWidgetConfig.length > 0) setWidgetConfig(savedWidgetConfig);
    // User profile (name, theme, language, avatar, goal) — silent
    if (savedProfile) {
      setUser(prev => ({ ...(prev || {}), name: savedProfile.userName || prev?.name || "", themeId: savedProfile.themeId || prev?.themeId || "nature", avatar: savedProfile.avatar || prev?.avatar || "", goal: savedProfile.goal || prev?.goal || "know", lang: savedProfile.lang || prev?.lang || "es" }));
      if (savedProfile.lang) setLang(savedProfile.lang);
    }
    if (savedSplits) {
      if (savedSplits.splitGroups?.length) setSplitGroups(savedSplits.splitGroups);
      if (savedSplits.splitExpenses?.length) setSplitExpenses(savedSplits.splitExpenses);
      if (savedSplits.settlements?.length) setSettlements(savedSplits.settlements);
    }
    if (savedState) {
      if (savedState.reimbursed && typeof savedState.reimbursed === "object") setReimbursed(prev => ({ ...savedState.reimbursed, ...prev }));
      if (Array.isArray(savedState.catGroups) && savedState.catGroups.length) setCatGroups(gs => { const ids = new Set(gs.map(g => g.id)); return [...gs, ...savedState.catGroups.filter(g => !ids.has(g.id))]; });
    }
    return Object.keys(savedBudgets).length > 0;
  }, [setCustomCats, setAutoPayments, setReminders, setBudgets, setCatGroups, setWidgetConfig, setUser, setLang, setSplitGroups, setSplitExpenses, setSettlements]);

  const handleUpload = useCallback((parsed, error) => {
    if (error) { showToast(error, "error"); return; }

    const { comments: restoredComments = {}, isMonedaExport = false, hasMonedaExport = false, savedAutoPayments = [], allowDuplicates = false } = parsed;

    // An id must never be shared by two transactions (comments, reimbursements and split
    // links hang off it), so re-key any incoming row whose id is already taken.
    const taken = new Set(transactions.map(t => t.id));
    const comms = { ...restoredComments };
    const rawTxns = parsed.txns.map(t => {
      if (!taken.has(t.id)) { taken.add(t.id); return t; }
      const id = `${t.id}-${Math.random().toString(36).slice(2, 8)}`;
      taken.add(id);
      if (comms[t.id] !== undefined) { comms[id] = comms[t.id]; delete comms[t.id]; }
      return { ...t, id };
    });

    if (Object.keys(comms).length > 0) setComments(prev => ({ ...prev, ...comms }));

    // For Moneda re-uploads: all cats already set, skip classify entirely
    if (isMonedaExport) {
      const fresh = addTxns(rawTxns, allowDuplicates);
      updateMemory(rawTxns);
      const hasBudgets = restoreSavedState(parsed, rawTxns);
      const restoredCats = fresh.filter(t => t.cat && t.cat !== "Income").length;
      showToast(es ? `${fresh.length} movimientos restaurados · ${restoredCats} con categoría guardada` : `Restored ${fresh.length} transactions · ${restoredCats} with saved categories`);
      setPage("dashboard");
      // A backup that already carries budgets doesn't need the budget wizard on top
      if (isFirstUpload && !user?.quickStart && !hasBudgets) { setShowBudgetWiz(true); }
      setIsFirstUpload(false);
      return;
    }

    // Effective state: merges current React state with values about to be restored
    // from the Moneda file. React batches state updates, so the bank path below
    // can't read the new values from state yet — these variables bridge that gap.
    let effectiveMemory = { ...merchantMemory };
    const effectiveAutoPayNames = new Set(autoPayments.map(p => p.name));
    let hasBudgets = false;

    // Mixed upload: Moneda export + bank statement uploaded together.
    // Restore saved state from the Moneda file, then fall through to the
    // bank path so new transactions get classified normally.
    if (hasMonedaExport) {
      hasBudgets = restoreSavedState(parsed, rawTxns);
      // Derive merchant→category mappings from Moneda transactions so the bank
      // path auto-classifies the same merchants without prompting the user again.
      for (const t of rawTxns) {
        if (t.cat && t.cat !== "Income") {
          const m = extractMerchant(t.desc);
          if (m && !effectiveMemory[m]) effectiveMemory[m] = t.cat;
        }
      }
      setMerchantMemory(effectiveMemory);
      // Mark restored auto-payment names so already-confirmed subs are filtered below.
      savedAutoPayments.forEach(p => { if (p.name) effectiveAutoPayNames.add(p.name); });
    }

    // Sync any custom cats stored in merchant memory into ALL_CATS so CategoryReview shows them
    const memCustomCats = [...new Set(Object.values(effectiveMemory).filter(c => c && c !== "Income" && !ALL_CATS.includes(c)))];
    if (memCustomCats.length > 0) { setCustomCats(c => [...new Set([...c, ...memCustomCats])]); extendAllCats(memCustomCats); }

    // Standard Bank statement upload — apply merchant memory then classify unknowns
    let autoClassified = 0;
    const preClassified = rawTxns.map(t => {
      if (t.cat === null) {
        const merchant = extractMerchant(t.desc);
        if (effectiveMemory[merchant]) { autoClassified++; return { ...t, cat: effectiveMemory[merchant] }; }
      }
      return t;
    });
    if (autoClassified > 0) showToast(es ? `🧠 ${autoClassified} movimiento${autoClassified !== 1 ? "s" : ""} clasificado${autoClassified !== 1 ? "s" : ""} de memoria` : `🧠 Auto-classified ${autoClassified} transaction${autoClassified !== 1 ? "s" : ""} from memory`, "info");
    const namedSubs = detectSubscriptions(preClassified);
    const subs = [...namedSubs, ...detectRecurring(preClassified, namedSubs)]
      .filter(s => !effectiveAutoPayNames.has(s.name));
    const unknowns = preClassified.filter(t => t.cat === null);
    const opts = { allowDuplicates, skipWizard: hasBudgets };
    const steps = [];
    if (subs.length > 0) steps.push("📦 Subscriptions");
    if (unknowns.length > 0) steps.push("🤔 Classify");
    if (isFirstUpload && !user?.quickStart && !hasBudgets) steps.push("🎯 Budgets");
    setModalSteps(steps);
    setPending({ txns: preClassified, opts });
    setDetectedSubs(subs); setUnknownTxns(unknowns);
    if (subs.length > 0) setShowSubVerify(true);
    else if (unknowns.length > 0) setShowCatReview(true);
    else finalizeTxns(preClassified, opts);
  }, [transactions, addTxns, finalizeTxns, restoreSavedState, isFirstUpload, merchantMemory, updateMemory, user, showToast, setPage, setShowBudgetWiz, setCustomCats, setMerchantMemory, autoPayments, es]);

  const handleSubDone = useCallback((confirmed) => {
    setShowSubVerify(false);
    // Yearly charges keep their full yearly amount (the pages divide by 12 themselves) and
    // need the month they renew in, otherwise the countdown treats them as monthly.
    confirmed.forEach(s => setAutoPayments(ps => ps.some(p => p.name === s.name) ? ps : [...ps, { id: Date.now() + Math.random(), name: s.name, amount: s.amount, day: s.day, month: s.frequency === "yearly" ? toDate(s.date).getMonth() + 1 : undefined, frequency: s.frequency }]));
    if (unknownTxns.length > 0) setShowCatReview(true);
    else if (pending) finalizeTxns(pending.txns, pending.opts);
  }, [unknownTxns, pending, finalizeTxns, setAutoPayments]);

  const handleCatDone = useCallback((assignments, newCats) => {
    setShowCatReview(false);
    if (newCats?.length) { setCustomCats(c => [...new Set([...c, ...newCats])]); extendAllCats(newCats); }
    if (!pending) return;
    const resolved = pending.txns.map(t => t.cat === null ? { ...t, cat: assignments[t.id] || "Other" } : t);
    // Persist the merchant→category assignments to memory
    const byId = new Map(resolved.map(t => [t.id, t]));
    setMerchantMemory(prev => {
      const next = { ...prev };
      for (const [txnId, cat] of Object.entries(assignments)) {
        const t = byId.get(txnId);
        if (t) { next[extractMerchant(t.desc)] = cat; }
      }
      return next;
    });
    finalizeTxns(resolved, pending.opts);
  }, [pending, finalizeTxns, setCustomCats, setMerchantMemory]);

  const onCatChange = useCallback((id, cat) => {
    const t = transactions.find(x => x.id === id);
    if (!t || t.cat === "Income" || !cat) return;
    const merchant = extractMerchant(t.desc);
    // Update every transaction from the same merchant (not income)
    let changedCount = 0;
    const updated = transactions.map(x => {
      if (extractMerchant(x.desc) !== merchant || x.cat === "Income" || x.cat === cat) return x;
      changedCount++;
      return { ...x, cat };
    });
    setTransactions(updated);
    setMerchantMemory(prev => ({ ...prev, [merchant]: cat }));
    if (changedCount > 1) showToast(es ? `${changedCount} movimientos de "${merchant}" → ${cat}` : `Updated ${changedCount} transactions for "${merchant}" → ${cat}`, "info");
  }, [transactions, setMerchantMemory, showToast, es]);

  const onCommentSave = useCallback((id, text) => setComments(c => ({ ...c, [id]: text })), []);
  const onMarkReimbursed = useCallback((id, data) => setReimbursed(r => data ? { ...r, [id]: data } : Object.fromEntries(Object.entries(r).filter(([k]) => k !== id))), []);

  return {
    transactions, comments, reimbursed,
    modalSteps, detectedSubs, unknownTxns,
    showSubVerify, showCatReview,
    handleUpload, handleSubDone, handleCatDone,
    onCatChange, onCommentSave, onMarkReimbursed,
  };
}
