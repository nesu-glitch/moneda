import { useCallback } from "react";
import { doExport } from "../utils/parsers/index.js";

export function useExport({ transactions, comments, autoPayments, reminders, budgets, customCats, widgetConfig, splitGroups, splitExpenses, settlements, reimbursed, catGroups, user, lang }) {
  const handleExport = useCallback(() =>
    doExport(transactions, comments, {
      autoPayments, reminders, budgets, customCats, widgetConfig,
      splitGroups, splitExpenses, settlements, reimbursed, catGroups,
      profile: {
        userName: user?.name || "",
        lang,
        themeId: user?.themeId || "nature",
        avatar: user?.avatar || "",
        goal: user?.goal || "know",
      },
    }),
    [transactions, comments, autoPayments, reminders, budgets, customCats, widgetConfig, splitGroups, splitExpenses, settlements, reimbursed, catGroups, user, lang]
  );

  return { handleExport };
}
