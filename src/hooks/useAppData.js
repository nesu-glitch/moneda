import { ALL_CATS } from "../utils/allCats.js";
import { filterTxns, compFilterKey } from "../utils/filters.js";
import { NOW } from "../utils/format.js";

// Next occurrence of a day-of-month, clamped so "day 31" lands on the 30th/28th in short months.
const dueDate=(y,m,day)=>new Date(y,m,Math.min(day,new Date(y,m+1,0).getDate()));

export function useAppData({ transactions, reimbursed, autoPayments, budgets, timeFilter, customRange, customCats, modalSteps }) {
  const txnCatsInUse=transactions.filter(t=>t.cat&&t.cat!=="Income").map(t=>t.cat);
  const allCats=[...new Set([...ALL_CATS,...customCats,...txnCatsInUse])].filter(c=>c!=="Income");
  const uncategorizedCount=transactions.filter(t=>t.amount<0&&!t.cat).length;
  const filtered    = filterTxns(transactions,timeFilter,customRange);
  const compKey     = compFilterKey(timeFilter);
  const compFiltered= compKey?filterTxns(transactions,compKey,null):null;
  const effAmt=t=>{const r=reimbursed[t.id];if(!r)return Math.abs(t.amount);if(r.paidBack!==undefined)return Math.max(0,+(Math.abs(t.amount)-r.paidBack).toFixed(2));return 0;};
  const expenses    = filtered.filter(t=>t.amount<0&&!(reimbursed[t.id]&&reimbursed[t.id].paidBack===undefined));
  const incomeT     = filtered.filter(t=>t.amount>0);
  const totalExp    = -expenses.reduce((s,t)=>s+effAmt(t),0);
  const totalInc    = incomeT.reduce((s,t)=>s+t.amount,0);
  const net         = totalInc+totalExp;
  const biggestExp  = expenses.length?expenses.reduce((m,t)=>effAmt(t)>effAmt(m)?t:m):null;
  const catData     = Object.entries(expenses.reduce((acc,t)=>({...acc,[t.cat]:(acc[t.cat]||0)+effAmt(t)}),{})).map(([name,value])=>({name,value:+value.toFixed(2)})).sort((a,b)=>b.value-a.value);
  const today=new Date(NOW.getFullYear(),NOW.getMonth(),NOW.getDate());
  const paymentsWithCountdown=autoPayments.map(p=>{
    let n;
    // A charge due today counts as 0 days away, not a month (or a year) away.
    if(p.frequency==="yearly"&&p.month){
      n=dueDate(today.getFullYear(),p.month-1,p.day);
      if(n<today)n=dueDate(today.getFullYear()+1,p.month-1,p.day);
    } else {
      n=dueDate(today.getFullYear(),today.getMonth(),p.day);
      if(n<today)n=dueDate(today.getFullYear(),today.getMonth()+1,p.day);
    }
    return{...p,days:Math.round((n-today)/86400000)};
  }).sort((a,b)=>a.days-b.days);
  const isWeekFilter = timeFilter==="week"||timeFilter==="lastWeek";
  const budgetWarnings=Object.entries(budgets).map(([cat,monthlyLimit])=>{
    const limit=isWeekFilter?+(monthlyLimit/4).toFixed(2):monthlyLimit;
    const spent=expenses.filter(t=>t.cat===cat).reduce((s,t)=>s+effAmt(t),0);
    return{cat,limit,spent:+spent.toFixed(2),pct:+(Math.min(limit?spent/limit*100:0,100)).toFixed(0),over:limit>0&&spent>limit};
  });
  const subStepIdx  = modalSteps.indexOf("📦 Subscriptions");
  const catStepIdx  = modalSteps.indexOf("🤔 Classify");
  const budStepIdx  = modalSteps.indexOf("🎯 Budgets");
  return { allCats, uncategorizedCount, filtered, compFiltered, totalInc, totalExp, net, biggestExp, catData, paymentsWithCountdown, budgetWarnings, subStepIdx, catStepIdx, budStepIdx };
}
