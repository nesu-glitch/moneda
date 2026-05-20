import { NOW } from "./format.js";

export function getRange(f,custom) {
  if (f==="custom"&&custom?.start&&custom?.end){const e=new Date(custom.end);e.setHours(23,59,59);return[new Date(custom.start),e];}
  if (f==="all") return [new Date(0),new Date(NOW.getFullYear()+1,0,1)];
  const d=new Date(NOW),day=d.getDay(),mo=day===0?-6:1-day;
  if (f==="week")      {const s=new Date(d);s.setDate(d.getDate()+mo);const e=new Date(s);e.setDate(s.getDate()+6);return[s,e];}
  if (f==="lastWeek")  {const s=new Date(d);s.setDate(d.getDate()+mo-7);const e=new Date(s);e.setDate(s.getDate()+6);return[s,e];}
  if (f==="month")     return[new Date(d.getFullYear(),d.getMonth(),1),d];
  if (f==="lastMonth") {const s=new Date(d.getFullYear(),d.getMonth()-1,1),e=new Date(d.getFullYear(),d.getMonth(),0);return[s,e];}
  return[new Date(0),d];
}
export const filterTxns=(txns,f,custom)=>{const[s,e]=getRange(f,custom);return txns.filter(t=>{const x=new Date(t.date);return x>=s&&x<=e;});};
export const compFilterKey=f=>(f==="week"||f==="lastWeek")?"lastWeek":(f==="month"||f==="lastMonth")?"lastMonth":null;
