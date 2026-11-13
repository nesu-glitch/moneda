// ── Languages ─────────────────────────────────────────────────────────────────
// English and Spanish live in constants.js. Catalan/Valencian, Basque and Galician live in
// ./i18n/*.js and fall back to Spanish for anything not translated yet.
import ca from "./i18n/ca.js";
import eu from "./i18n/eu.js";
import gl from "./i18n/gl.js";

export const EXTRA_LANGS = { ca, eu, gl };
export const LANGS = [
  { id:"es", name:"Español" },
  { id:"ca", name:"Català" },
  { id:"eu", name:"Euskara" },
  { id:"gl", name:"Galego" },
  { id:"en", name:"English" },
];
const LOCALES = { es:"es-ES", en:"en-GB", ca:"ca-ES", eu:"eu-ES", gl:"gl-ES" };
export const locale = lang => LOCALES[lang] || "es-ES";

// say(lang, spanish, english, vars?) — inline text, keyed by its Spanish wording.
// Other languages look the Spanish text up in their PHRASES table; {name} placeholders are filled from vars.
export function say(lang, es, en, vars) {
  let s = lang === "en" ? en : lang === "es" ? es : (EXTRA_LANGS[lang]?.PHRASES?.[es] ?? es);
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return s;
}
