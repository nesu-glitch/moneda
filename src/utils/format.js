export const fmt  = n=>`€${Math.abs(+n).toFixed(2)}`;
export const fmtD = d=>new Date(d).toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric"});
export const fmtShort = d=>new Date(d).toLocaleDateString("es-ES",{day:"2-digit",month:"short"});
export const NOW  = new Date();
