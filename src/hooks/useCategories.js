import { useState, useCallback } from "react";
import { extractMerchant } from "../utils/categories.js";

export function useCategories() {
  const [customCats, setCustomCats] = useState([]);
  const [merchantMemory, setMerchantMemory] = useState({});

  const updateMemory = useCallback((txns) => {
    setMerchantMemory(prev => {
      const next = { ...prev };
      for (const t of txns) {
        if (t.cat && t.cat !== "Income") {
          next[extractMerchant(t.desc)] = t.cat;
        }
      }
      return next;
    });
  }, []);

  const clearMemory = useCallback(() => setMerchantMemory({}), []);

  return { customCats, setCustomCats, merchantMemory, setMerchantMemory, updateMemory, clearMemory };
}
