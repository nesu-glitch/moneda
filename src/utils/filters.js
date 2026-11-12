import { NOW, toDate } from "./format.js";

const sod=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x;};
const eod=d=>{const x=new Date(d);x.setHours(23,59,59,999);return x;};

// Returns [start,end], both inclusive and aligned to whole days.
export function getRange(f,custom) {
  if (f==="custom"&&custom?.start&&custom?.end) return[sod(toDate(custom.start)),eod(toDate(custom.end))];
  if (f==="all") return [new Date(0),new Date(NOW.getFullYear()+1,0,1)];
  const d=sod(NOW),day=d.getDay(),mo=day===0?-6:1-day;
  if (f==="week")      {const s=new Date(d);s.setDate(d.getDate()+mo);const e=new Date(s);e.setDate(s.getDate()+6);return[s,eod(e)];}
  if (f==="lastWeek")  {const s=new Date(d);s.setDate(d.getDate()+mo-7);const e=new Date(s);e.setDate(s.getDate()+6);return[s,eod(e)];}
  if (f==="month")     return[new Date(d.getFullYear(),d.getMonth(),1),eod(d)];
  if (f==="lastMonth") return[new Date(d.getFullYear(),d.getMonth()-1,1),eod(new Date(d.getFullYear(),d.getMonth(),0))];
  return[new Date(0),eod(d)];
}
export const filterTxns=(txns,f,custom)=>{const[s,e]=getRange(f,custom);return txns.filter(t=>{const x=toDate(t.date);return x>=s&&x<=e;});};
export const compFilterKey=f=>(f==="week"||f==="lastWeek")?"lastWeek":(f==="month"||f==="lastMonth")?"lastMonth":null;
// Number of days a filter actually covers so far (used for the average-per-day insight).
export function daysCovered(f,custom,txns) {
  let[s,e]=getRange(f,custom);
  if(f==="all"||s.getTime()===0){
    if(!txns.length)return 1;
    const ts=txns.map(t=>toDate(t.date).getTime());
    s=new Date(Math.min(...ts));e=eod(new Date(Math.max(...ts)));
  } else if(e>eod(NOW)&&s<=NOW) e=eod(NOW);
  return Math.max(1,Math.round((e-s)/86400000));
}
