import { CC } from "./constants.js";
export let ALL_CATS = Object.keys(CC).filter(k => k !== "Income");
export function extendAllCats(newCats) {
  const toAdd = newCats.filter(n => !ALL_CATS.includes(n));
  if (toAdd.length) ALL_CATS = [...ALL_CATS, ...toAdd];
}
