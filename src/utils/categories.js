export const RULES = {
  Groceries:["mercadona","lidl","aldi","carrefour","eroski","consum","dia ","leclerc","supermercado","alcampo","hipercor"],
  Restaurants:["restaurante","restaurant","burger","mcdonalds","kfc","pizza","sushi","tapas","cafeteria","bar ","cafe ","starbucks","dunkin","tabaco","estanco","cerveceria","kebab","telepizza","vinos","bodega","honest green","city land","mm31","alliance vendin","sfc doner","bar antigua","casa esteban","maquina ta"],
  Transport:["renfe","metro","bus ","taxi","uber","cabify","bolt","ryanair","vueling","iberia","edreams","parking","gasolinera","bp ","repsol","shell","crtm","emt ","cercanias","estacion de","la estacion"],
  Utilities:["endesa","iberdrola","naturgy","gas natural","agua ","telefonica","movistar","vodafone","orange","internet","electricidad"],
  Subscriptions:["netflix","spotify","hbo","disney","amazon prime","apple one","google one","microsoft","chatgpt","youtube premium","linkedin","notion","adobe","canva"],
  Health:["farmacia","pharmacy","doctor","clinica","hospital","sanitas","adeslas","gym","fitness","crossfit","dentista","dental"],
  Shopping:["amazon","zara","h&m","mango","pull&bear","ikea","pccomponentes","mediamarkt","fnac","el corte ingles","shein","aliexpress","vinted","expnavalu","pidlitacka"],
  Housing:["alquiler","hipoteca","comunidad propietarios","seguro hogar"],
  Education:["ie business","coursera","udemy","edx","libro","libreria","kindle","academia"],
  Entertainment:["cinema","teatro","concierto","museo","steam","playstation","xbox","nintendo"],
  "ATM / Cash":["cajero","atm","efectivo","retirada de efectivo"],
  Transfers:["bizum","transferencia","transfer","revolut","wise","paypal"],
};
export const SUB_KW = {netflix:"Netflix",spotify:"Spotify",hbo:"HBO Max",disney:"Disney+","amazon prime":"Amazon Prime","apple one":"Apple One","google one":"Google One",microsoft:"Microsoft 365",chatgpt:"ChatGPT Plus",linkedin:"LinkedIn",adobe:"Adobe CC",notion:"Notion",canva:"Canva"};

export function extractMerchant(desc) {
  if (!desc) return "Unknown";
  const raw = desc.trim();
  // Bizum: extract person name — stop at CONCEPTO or end
  const bizumMatch = raw.match(/BIZUM\s+(?:A FAVOR DE|RECIBIDO DE|DE|ENVIADO A)\s+(.+?)(?:\s+CONCEPTO\b|\s*[-,]|\s{2,}|$)/i);
  if (bizumMatch) { const name=bizumMatch[1].trim().replace(/\s*TARJ\.?.*/i,"").trim(); if(name.length>1) return name.slice(0,36); }
  // Transferencia: extract counterpart name
  const transMatch = raw.match(/(?:TRANSFERENCIA|TRANSFER|DEVOLUCION BIZUM)\s+(?:A|DE|RECIBIDA DE|EMITIDA A)?\s*(.+?)(?:\s*[-,]|\s{2,}|IBAN|ES\d{2}|$)/i);
  if (transMatch) { const name=transMatch[1].trim(); if(name.length>2&&!/^\d/.test(name)) return name.slice(0,36); }
  let s=raw.replace(/^(PAGO MOVIL EN |COMPRA EN |COMPRA |RECIBO |CARGO |PAGO EN |RETIRADA DE EFECTIVO EN |COMPRA INTERNET EN |DEVOLUCION COMPRA EN )/i,"")
            .replace(/,?\s*(MADRID|BARCELONA|ESPAÑA|ES|TARJ\.?.*|TARJETA\s*\d+.*|CO\b.*|COMISION.*|Vilnius.*|LUXEMBOURG.*)$/i,"")
            .replace(/\s*,\s*[A-Z][a-z].*$/,"")  // strip city, Country suffixes
            .trim();
  return s.slice(0,36)||raw.slice(0,20);
}
export function categorise(desc) {
  if (!desc) return null;
  const d=desc.toLowerCase();
  for (const [cat,kws] of Object.entries(RULES)) if (kws.some(k=>d.includes(k))) return cat;
  return null;
}
