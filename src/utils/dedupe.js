export const txKey=t=>`${t.date}|${t.desc}|${t.amount}`;

// Splits `incoming` into rows that are new and rows already present in `existing`.
// Counts occurrences instead of using a set, so two genuinely identical purchases
// (same day, same shop, same amount) inside one statement are both kept, while a
// statement that overlaps one already loaded is still recognised as a duplicate.
export function splitDuplicates(existing,incoming) {
  const counts=new Map();
  for(const t of existing){const k=txKey(t);counts.set(k,(counts.get(k)||0)+1);}
  const fresh=[],dupes=[];
  for(const t of incoming){
    const k=txKey(t),n=counts.get(k)||0;
    if(n>0){counts.set(k,n-1);dupes.push(t);}else fresh.push(t);
  }
  return{fresh,dupes};
}
export const byDateDesc=(a,b)=>a.date<b.date?1:a.date>b.date?-1:0;
