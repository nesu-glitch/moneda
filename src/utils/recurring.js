import { SUB_KW, extractMerchant } from "./categories.js";

export function detectSubscriptions(txns) {
  const found=[],seen=new Set();
  for (const t of txns) {
    if (t.amount>=0) continue;
    const d=t.desc.toLowerCase();
    for (const [key,name] of Object.entries(SUB_KW)) if (d.includes(key)&&!seen.has(key)) { seen.add(key); found.push({key,name,amount:Math.abs(t.amount),day:new Date(t.date).getDate(),date:t.date,txnId:t.id,frequency:"monthly"}); }
  }
  return found;
}
export function detectRecurring(txns,alreadyFound) {
  const skipKeys=new Set(alreadyFound.map(s=>s.key));
  const groups={};
  for(const t of txns){if(t.amount>=0)continue;const m=extractMerchant(t.desc);if(skipKeys.has(m))continue;if(!groups[m])groups[m]=[];groups[m].push(t);}
  const found=[];
  for(const [merchant,group] of Object.entries(groups)){
    if(group.length<2)continue;
    const sorted=[...group].sort((a,b)=>new Date(a.date)-new Date(b.date));
    const amounts=sorted.map(t=>Math.abs(t.amount));
    const avgAmt=amounts.reduce((s,a)=>s+a,0)/amounts.length;
    if(avgAmt<3)continue; // skip tiny amounts
    const allSimilar=amounts.every(a=>Math.abs(a-avgAmt)/avgAmt<0.12);
    if(!allSimilar)continue;
    let allMonthly=true;
    for(let i=1;i<sorted.length;i++){const diff=(new Date(sorted[i].date)-new Date(sorted[i-1].date))/86400000;if(diff<20||diff>40){allMonthly=false;break;}}
    if(!allMonthly)continue;
    found.push({key:merchant,name:merchant,amount:+avgAmt.toFixed(2),day:new Date(sorted[sorted.length-1].date).getDate(),date:sorted[sorted.length-1].date,txnId:sorted[sorted.length-1].id,frequency:"monthly",isRecurring:true});
  }
  return found;
}
