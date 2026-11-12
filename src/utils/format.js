export const fmt  = n=>`€${Math.abs(+n).toFixed(2)}`;
// Transaction dates are stored as "YYYY-MM-DD". new Date("YYYY-MM-DD") parses as UTC midnight,
// which lands on the wrong local day/month depending on the timezone — always parse as local.
export const toDate = d=>{
  if(d instanceof Date)return d;
  const m=/^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(d||""));
  return m?new Date(+m[1],+m[2]-1,+m[3]):new Date(d);
};
export const fmtD = d=>toDate(d).toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric"});
export const fmtShort = d=>toDate(d).toLocaleDateString("es-ES",{day:"2-digit",month:"short"});
export const NOW  = new Date();
