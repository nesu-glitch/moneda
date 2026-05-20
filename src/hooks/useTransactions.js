import { useState, useCallback } from "react";
import { extractMerchant } from "../utils/categories.js";
import { detectSubscriptions, detectRecurring } from "../utils/recurring.js";
import { ALL_CATS, extendAllCats } from "../utils/allCats.js";

export function useTransactions({
  updateMemory, setMerchantMemory, setCustomCats,
  setBudgets, setShowBudgetWiz,
  setAutoPayments, setReminders, setWidgetConfig,
  setUser, setLang,
  setSplitGroups, setSplitExpenses, setSettlements,
  showToast, setPage,
  user, merchantMemory,
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

  const finalizeTxns = useCallback((txns, filename) => {
    const sorted = [...txns].sort((a, b) => new Date(b.date) - new Date(a.date));
    setTransactions(sorted);
    updateMemory(sorted);
    showToast(`✅ Loaded ${sorted.length} transactions`);
    setPage("dashboard");
    if (isFirstUpload && !user?.quickStart) { setShowBudgetWiz(true); }
    setIsFirstUpload(false);
  }, [isFirstUpload, updateMemory, user, showToast, setPage, setShowBudgetWiz]);

  const handleUpload = useCallback((parsed, error, filename) => {
    if (error) { showToast(error, "error"); return; }

    // parsed is now {txns, comments, isMonedaExport, savedAutoPayments, savedReminders, savedBudgets, savedCustomCats, savedWidgetConfig}
    const { txns: rawTxns, comments: restoredComments = {}, isMonedaExport = false, savedAutoPayments = [], savedReminders = [], savedBudgets = {}, savedCustomCats = [], savedWidgetConfig = [], savedProfile = null, savedSplits = null } = parsed;

    // Restore comments from the export
    if (Object.keys(restoredComments).length > 0) {
      setComments(prev => ({ ...prev, ...restoredComments }));
    }

    // For Moneda re-uploads: all cats already set, skip classify entirely
    if (isMonedaExport) {
      const sorted = [...rawTxns].sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(sorted);
      updateMemory(sorted);
      // Restore custom categories from Config sheet + any non-standard cats in transactions
      const txnCats = sorted.filter(t => t.cat && t.cat !== "Income").map(t => t.cat);
      const allRestoredCats = [...new Set([...savedCustomCats, ...txnCats])].filter(c => !ALL_CATS.includes(c));
      if (allRestoredCats.length > 0) { setCustomCats(c => [...new Set([...c, ...allRestoredCats])]); extendAllCats(allRestoredCats); }
      // Restore auto payments (merge, don't duplicate by name)
      if (savedAutoPayments.length > 0) setAutoPayments(ps => { const names = new Set(ps.map(p => p.name)); return [...ps, ...savedAutoPayments.filter(p => !names.has(p.name))]; });
      // Restore reminders
      if (savedReminders.length > 0) setReminders(rs => [...rs, ...savedReminders]);
      // Restore budgets (merge)
      if (Object.keys(savedBudgets).length > 0) setBudgets(prev => ({ ...savedBudgets, ...prev }));
      // Restore widget order/visibility preferences
      if (savedWidgetConfig.length > 0) setWidgetConfig(savedWidgetConfig);
      // Restore user profile (name, theme, language, avatar, goal) — silent
      if (savedProfile) {
        setUser(prev => ({ ...(prev || {}), name: savedProfile.userName || prev?.name || "", themeId: savedProfile.themeId || prev?.themeId || "nature", avatar: savedProfile.avatar || prev?.avatar || "", goal: savedProfile.goal || prev?.goal || "know", lang: savedProfile.lang || prev?.lang || "es" }));
        if (savedProfile.lang) setLang(savedProfile.lang);
      }
      if (savedSplits) {
        if (savedSplits.splitGroups?.length) setSplitGroups(savedSplits.splitGroups);
        if (savedSplits.splitExpenses?.length) setSplitExpenses(savedSplits.splitExpenses);
        if (savedSplits.settlements?.length) setSettlements(savedSplits.settlements);
      }
      const restoredCats = sorted.filter(t => t.cat && t.cat !== "Income").length;
      showToast(`✅ Restored ${sorted.length} transactions · ${restoredCats} with saved categories`);
      setPage("dashboard");
      if (isFirstUpload && !user?.quickStart) { setShowBudgetWiz(true); }
      setIsFirstUpload(false);
      return;
    }

    // Sync any custom cats stored in merchant memory into ALL_CATS so CategoryReview shows them
    const memCustomCats = [...new Set(Object.values(merchantMemory).filter(c => c && c !== "Income" && !ALL_CATS.includes(c)))];
    if (memCustomCats.length > 0) { setCustomCats(c => [...new Set([...c, ...memCustomCats])]); extendAllCats(memCustomCats); }

    // Standard Bank statement upload — apply merchant memory then classify unknowns
    let autoClassified = 0;
    const preClassified = rawTxns.map(t => {
      if (t.cat === null) {
        const merchant = extractMerchant(t.desc);
        if (merchantMemory[merchant]) { autoClassified++; return { ...t, cat: merchantMemory[merchant] }; }
      }
      return t;
    });
    if (autoClassified > 0) showToast(`🧠 Auto-classified ${autoClassified} known merchant${autoClassified !== 1 ? "s" : ""} from memory`, "info");
    const namedSubs = detectSubscriptions(preClassified);
    const subs = [...namedSubs, ...detectRecurring(preClassified, namedSubs)];
    const unknowns = preClassified.filter(t => t.cat === null);
    const steps = [];
    if (subs.length > 0) steps.push("📦 Subscriptions");
    if (unknowns.length > 0) steps.push("🤔 Classify");
    if (isFirstUpload && !user?.quickStart) steps.push("🎯 Budgets");
    setModalSteps(steps);
    setPending({ txns: preClassified, filename });
    setDetectedSubs(subs); setUnknownTxns(unknowns);
    if (subs.length > 0) setShowSubVerify(true);
    else if (unknowns.length > 0) setShowCatReview(true);
    else finalizeTxns(preClassified, filename);
  }, [finalizeTxns, isFirstUpload, merchantMemory, updateMemory, user, showToast, setPage, setShowBudgetWiz, setCustomCats, setBudgets, setAutoPayments, setReminders, setWidgetConfig, setUser, setLang, setSplitGroups, setSplitExpenses, setSettlements]);

  const handleSubDone = useCallback((confirmed) => {
    setShowSubVerify(false);
    confirmed.forEach(s => setAutoPayments(ps => ps.some(p => p.name === s.name) ? ps : [...ps, { id: Date.now() + Math.random(), name: s.name, amount: s.frequency === "yearly" ? +(s.amount / 12).toFixed(2) : s.amount, day: s.day, frequency: s.frequency }]));
    if (unknownTxns.length > 0) setShowCatReview(true);
    else if (pending) finalizeTxns(pending.txns, pending.filename);
  }, [unknownTxns, pending, finalizeTxns, setAutoPayments]);

  const handleCatDone = useCallback((assignments, newCats) => {
    setShowCatReview(false);
    if (newCats?.length) { setCustomCats(c => [...new Set([...c, ...newCats])]); extendAllCats(newCats); }
    if (!pending) return;
    const resolved = pending.txns.map(t => t.cat === null ? { ...t, cat: assignments[t.id] || "Other" } : t);
    // Persist the merchant→category assignments to memory
    setMerchantMemory(prev => {
      const next = { ...prev };
      for (const [txnId, cat] of Object.entries(assignments)) {
        const t = resolved.find(x => x.id === txnId);
        if (t) { next[extractMerchant(t.desc)] = cat; }
      }
      return next;
    });
    finalizeTxns(resolved, pending.filename);
  }, [pending, finalizeTxns, setCustomCats, setMerchantMemory]);

  const onCatChange = useCallback((id, cat) => {
    setTransactions(ts => {
      const t = ts.find(x => x.id === id);
      if (!t) return ts;
      const merchant = extractMerchant(t.desc);
      setMerchantMemory(prev => ({ ...prev, [merchant]: cat }));
      // Update every transaction from the same merchant (not income)
      const updated = ts.map(x => extractMerchant(x.desc) === merchant && x.cat !== "Income" ? { ...x, cat } : x);
      const changedCount = updated.filter((x, i) => x !== ts[i]).length;
      if (changedCount > 1) showToast(`Updated ${changedCount} transactions for "${merchant}" → ${cat}`, "info");
      return updated;
    });
  }, [setMerchantMemory, showToast]);

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
