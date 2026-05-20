import { useState } from "react";

export function useBudgets() {
  const [budgets, setBudgets] = useState({});
  const [catGroups, setCatGroups] = useState([]);
  const [showBudgetWiz, setShowBudgetWiz] = useState(false);

  return { budgets, setBudgets, catGroups, setCatGroups, showBudgetWiz, setShowBudgetWiz };
}
