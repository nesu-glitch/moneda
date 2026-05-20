import { ReimPanel, TxnRow } from "./Transactions.jsx";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { T, CAT_LABELS, CC } from "../utils/constants.js";
import { extractMerchant } from "../utils/categories.js";
import { fmt, fmtShort, NOW } from "../utils/format.js";
import { getRange, compFilterKey } from "../utils/filters.js";
import { useIsMobile } from "../hooks/useIsMobile.js";

// ── Merchant Breakdown ────────────────────────────────────────────────────────
function MerchantBreakdown({theme,txns,cat,lang="es"}) {
  const {c}=theme;
  const tr=T[lang]||T.en;
  const [hoveredName,setHoveredName]=useState(null);
  const data=Object.entries(txns.filter(t=>t.cat===cat&&t.amount<0).reduce((acc,t)=>{const m=extractMerchant(t.desc);if(!acc[m])acc[m]={total:0,count:0};acc[m].total+=Math.abs(t.amount);acc[m].count++;return acc;},{}))
    .map(([name,{total,count}])=>({name,total:+total.toFixed(2),count})).sort((a,b)=>b.total-a.total).slice(0,15);
  if(!data.length)return null;
  const max=data[0]?.total||1;
  return <div style={{marginTop:18,paddingTop:14,borderTop:`1px solid ${c.border}`}}>
    <div style={{fontWeight:700,color:c.text,marginBottom:10,fontSize:"13px"}}>📍 {tr.byMerchant}</div>
    {data.map(({name,total,count})=>(
      <div key={name} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:7,position:"relative"}}
        onMouseEnter={()=>setHoveredName(name)} onMouseLeave={()=>setHoveredName(null)}>
        <div style={{width:"130px",fontSize:"12px",color:c.text,fontWeight:600,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"default"}}>
          {name}
          {/* Full name tooltip on hover */}
          {hoveredName===name&&name.length>18&&<div style={{position:"absolute",left:0,bottom:"calc(100% + 4px)",background:"#111827",color:"white",fontSize:"11px",fontWeight:600,padding:"5px 10px",borderRadius:"8px",whiteSpace:"nowrap",zIndex:50,boxShadow:"0 4px 12px rgba(0,0,0,0.3)",pointerEvents:"none"}}>
            {name}
            <div style={{position:"absolute",bottom:"-4px",left:"12px",width:"8px",height:"8px",background:"#111827",transform:"rotate(45deg)"}}/>
          </div>}
        </div>
        <div style={{flex:1,height:"9px",borderRadius:"9px",background:c.pl,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${(total/max)*100}%`,borderRadius:"9px",background:CC[cat]||c.p,transition:"width 0.5s"}}/>
        </div>
        <div style={{width:"68px",textAlign:"right",fontSize:"12px",fontWeight:700,color:c.text,flexShrink:0}}>{fmt(total)}</div>
        <div style={{width:"28px",fontSize:"11px",color:c.muted,flexShrink:0}}>{count}×</div>
      </div>
    ))}
  </div>;
}

// ── Compare Panel ─────────────────────────────────────────────────────────────
function ComparePanel({theme,label1,label2,txns1,txns2,lang="es"}) {
  const {c,font:f}=theme;
  const tr=T[lang]||T.en;
  const st=tx=>({inc:tx.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0),exp:tx.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0),net:tx.reduce((s,t)=>s+t.amount,0)});
  const s1=st(txns1),s2=st(txns2);
  const Row=({label,v1,v2,isExp})=>{const d=isExp?Math.abs(v2)-Math.abs(v1):v2-v1;const pct=v1?Math.round(Math.abs(d/v1)*100):0;const better=isExp?d<0:d>0;
    return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:8,alignItems:"center"}}>
      <span style={{fontSize:"12px",color:c.muted,fontWeight:600}}>{label}</span>
      <span style={{textAlign:"center",fontSize:"14px",fontWeight:700,color:c.text}}>{fmt(Math.abs(v1))}</span>
      <div style={{textAlign:"right",display:"flex",alignItems:"center",justifyContent:"flex-end",gap:"5px"}}>
        <span style={{fontSize:"14px",fontWeight:700,color:c.text}}>{fmt(Math.abs(v2))}</span>
        {pct>0&&<span style={{fontSize:"11px",fontWeight:700,padding:"2px 6px",borderRadius:"20px",background:better?"#dcfce7":"#fee2e2",color:better?"#15803d":"#dc2626"}}>{d>0?"↑":"↓"}{pct}%</span>}
      </div>
    </div>;};
  return <div style={{background:c.card,borderRadius:"16px",padding:"20px 24px",border:`1.5px solid ${c.border}`,marginBottom:18}}>
    <div style={{fontWeight:700,color:c.text,marginBottom:14,fontSize:"15px"}}>⚖️ Period comparison</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:12}}>
      <div/><div style={{textAlign:"center",fontSize:"11px",fontWeight:700,color:c.muted,textTransform:"uppercase",letterSpacing:1}}>{label1}</div>
      <div style={{textAlign:"right",fontSize:"11px",fontWeight:700,color:c.p,textTransform:"uppercase",letterSpacing:1}}>{label2}</div>
    </div>
    <Row label={tr.income} v1={s1.inc} v2={s2.inc} isExp={false}/>
    <Row label={tr.expenses} v1={s1.exp} v2={s2.exp} isExp={true}/>
    <Row label={tr.net} v1={s1.net} v2={s2.net} isExp={false}/>
  </div>;
}

// ── Budget Widget (standalone, own period toggle) ─────────────────────────────
function BudgetWidget({theme,budgets,allTransactions,w,lang="es"}) {
  const {c,font:f}=theme;
  const tr=T[lang]||T.en;
  const catLabel=cat=>(CAT_LABELS[lang]||CAT_LABELS.en)[cat]||cat;
  const [period,setPeriod]=useState("month");
  const now=new Date();
  const day=now.getDay(),mo=day===0?-6:1-day;
  const wkStart=new Date(now);wkStart.setDate(now.getDate()+mo);wkStart.setHours(0,0,0,0);
  const wkEnd=new Date(wkStart);wkEnd.setDate(wkStart.getDate()+6);wkEnd.setHours(23,59,59);
  const periodTxns=allTransactions.filter(t=>{
    if(t.amount>=0)return false;
    const d=new Date(t.date);
    return period==="month"
      ? d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()
      : d>=wkStart&&d<=wkEnd;
  });
  const monthLabel=now.toLocaleDateString("es-ES",{month:"long",year:"numeric"});
  const wkLabel=`${wkStart.toLocaleDateString("es-ES",{day:"2-digit",month:"short"})} – ${wkEnd.toLocaleDateString("es-ES",{day:"2-digit",month:"short"})}`;
  const budgetRows=Object.entries(budgets).filter(([,v])=>v>0).map(([cat,monthlyLimit])=>{
    const limit=period==="week"?+(monthlyLimit/4).toFixed(2):monthlyLimit;
    const spent=+(periodTxns.filter(t=>t.cat===cat).reduce((s,t)=>s+Math.abs(t.amount),0)).toFixed(2);
    const pct=+(Math.min(limit?spent/limit*100:0,100)).toFixed(0);
    return{cat,limit,spent,pct,over:limit>0&&spent>limit};
  });
  if(!budgetRows.length)return null;
  return <div style={{background:c.card,borderRadius:"16px",padding:"20px 24px",border:`1.5px solid ${c.border}`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:"8px"}}>
      <div>
        <div style={{fontWeight:700,color:c.text,fontSize:"15px"}}>🎯 {w.budget}</div>
        <div style={{fontSize:"11px",color:c.muted,marginTop:2,textTransform:"capitalize"}}>{period==="month"?monthLabel:wkLabel}</div>
      </div>
      <div style={{display:"flex",gap:"5px"}}>
        {[["month",`📅 ${tr.month}`],["week",`🗓 ${tr.week}`]].map(([p,lbl])=>(
          <button key={p} onClick={()=>setPeriod(p)}
            style={{padding:"5px 12px",borderRadius:"16px",border:"none",cursor:"pointer",fontSize:"11px",fontWeight:700,fontFamily:f,
              background:period===p?c.p:"white",color:period===p?"white":c.muted,
              boxShadow:period===p?`0 2px 8px ${c.p}40`:`inset 0 0 0 1.5px ${c.border}`}}>
            {lbl}
          </button>
        ))}
      </div>
    </div>
    {budgetRows.map(({cat,limit,spent,pct,over})=>(
      <div key={cat} style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
          <div style={{display:"flex",alignItems:"center",gap:"7px"}}><div style={{width:8,height:8,borderRadius:"50%",background:CC[cat]||c.p}}/><span style={{fontSize:"13px",fontWeight:600,color:c.text}}>{catLabel(cat)}</span></div>
          <span style={{fontSize:"12px",color:over?c.danger:pct>=80?"#f59e0b":c.muted}}>{fmt(spent)} / {fmt(limit)} {over?"🔴":pct>=80?"🟡":"🟢"}</span>
        </div>
        <div style={{height:"8px",borderRadius:"8px",background:c.pl,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,borderRadius:"8px",background:over?c.danger:pct>=80?"#f59e0b":CC[cat]||c.p,transition:"width 0.6s"}}/></div>
        {over&&<div style={{fontSize:"11px",color:c.danger,marginTop:3}}>{w.over}</div>}
      </div>
    ))}
  </div>;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export function Dashboard({theme,timeFilter,setTimeFilter,compareMode,setCompareMode,customRange,setCustomRange,filtered,compFiltered,totalInc,totalExp,net,biggestExp,catData,budgetWarnings,paymentsWithCountdown,reminders,setReminders,transactions,comments,onCommentSave,onCatChange,hasData,onAddReminder,allCats,reimbursed,onMarkReimbursed,budgets,widgetConfig,setWidgetConfig,onExport,lang="es",onSplitTx,splitExpenses=[]}) {
  const {c,font:f,w}=theme;
  const tr=T[lang]||T.en;
  const catLabel=cat=>(CAT_LABELS[lang]||CAT_LABELS.en)[cat]||cat;
  const WIDGET_LABEL_KEY={summary:"wSummary",insights:"wInsights",budget:"wBudget",payments:"wPayments",spending:"wSpending",journal:"wJournal",income:"wIncome",subscriptions:"wSubscriptions"};
  const widgetLabel=id=>tr[WIDGET_LABEL_KEY[id]]||id;
  const isMobile=useIsMobile();
  const [catFilter,setCatFilter]=useState("All");
  const [editMode,setEditMode]=useState(false);

  // Widget order/visibility — stored as [{id,visible}]
  const DEFAULT_WIDGETS=[
    {id:"summary",label:"📊 Summary cards",visible:true},
    {id:"insights",label:"💡 Insights",visible:true},
    {id:"budget",label:"🎯 Budget",visible:true},
    {id:"payments",label:"💳 Upcoming charges",visible:true},
    {id:"spending",label:"📊 Spending by category",visible:true},
    {id:"journal",label:"📄 Journal",visible:true},
    {id:"income",label:"💰 Income transactions",visible:true},
    {id:"subscriptions",label:"📦 Subscriptions & Recurring",visible:false},
  ];
  // Preserve user order from widgetConfig; append any new DEFAULT_WIDGETS entries not yet in config
  const widgets = widgetConfig?.length
    ? [...widgetConfig, ...DEFAULT_WIDGETS.filter(dw=>!widgetConfig.find(w=>w.id===dw.id))]
    : DEFAULT_WIDGETS;
  const isVisible = id => widgets.find(w=>w.id===id)?.visible!==false;
  const moveWidget = (id,dir) => {
    const idx=widgets.findIndex(w=>w.id===id);
    const newW=[...widgets];
    const swap=idx+dir;
    if(swap<0||swap>=newW.length)return;
    [newW[idx],newW[swap]]=[newW[swap],newW[idx]];
    setWidgetConfig(newW);
  };
  const toggleWidget = id => setWidgetConfig(widgets.map(w=>w.id===id?{...w,visible:!w.visible}:w));

  // Include ALL cats that appear in filtered expenses (including custom ones)
  const inPeriodCatSet=new Set(filtered.filter(t=>t.amount<0).map(t=>t.cat).filter(Boolean));
  const inPeriodCats=["All",...[...inPeriodCatSet].sort()];

  // Month journal navigation (independent of time filter for browsing)
  const [journalMonth,setJournalMonth]=useState(()=>{const d=new Date(NOW);return{y:d.getFullYear(),m:d.getMonth()};});
  const journalTxns=transactions.filter(t=>{const d=new Date(t.date);return d.getFullYear()===journalMonth.y&&d.getMonth()===journalMonth.m;});
  const prevJM=()=>setJournalMonth(({y,m})=>m===0?{y:y-1,m:11}:{y,m:m-1});
  const nextJM=()=>setJournalMonth(({y,m})=>m===11?{y:y+1,m:0}:{y,m:m+1});
  const journalLabel=new Date(journalMonth.y,journalMonth.m,1).toLocaleDateString("es-ES",{month:"long",year:"numeric"});
  const isCurrentMonth=journalMonth.y===NOW.getFullYear()&&journalMonth.m===NOW.getMonth();

  const compKey=compFilterKey(timeFilter);

  // Period label for "Total spent in X — [period]"
  const periodLabels={"week":tr.thisWeek,"lastWeek":tr.lastWeek,"month":tr.thisMonth,"lastMonth":tr.lastMonth,"all":tr.allTime,"custom":tr.custom};
  const periodLabel=periodLabels[timeFilter]||"";

  // Insights
  const topCat=catData[0];
  const merchantCounts=filtered.filter(t=>t.amount<0).reduce((acc,t)=>{const m=extractMerchant(t.desc);acc[m]=(acc[m]||0)+1;return acc;},{});
  const topMerchant=Object.entries(merchantCounts).sort((a,b)=>b[1]-a[1])[0];
  const avgDaily=filtered.filter(t=>t.amount<0).length?Math.abs(totalExp)/Math.max(1,Math.ceil((getRange(timeFilter,customRange)[1]-getRange(timeFilter,customRange)[0])/86400000)):0;

  const SCard=({label,value,sub,color})=><div style={{background:c.card,borderRadius:"16px",padding:"20px",flex:"0 0 auto",width:isMobile?"160px":"auto",minWidth:isMobile?"160px":"130px",boxShadow:"0 2px 12px rgba(0,0,0,0.05)",border:`1.5px solid ${c.border}`}}>
    <div style={{fontSize:"10px",color:c.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:6,fontFamily:f}}>{label}</div>
    <div style={{fontSize:"22px",fontWeight:800,color,fontFamily:f}}>{value}</div>
    <div style={{fontSize:"12px",color:c.muted,marginTop:5,fontFamily:f}}>{sub}</div>
  </div>;

  return <div style={{display:"flex",flexDirection:"column",gap:"18px",fontFamily:f}}>
    {/* Customize bar */}
    <div style={{display:"flex",justifyContent:"flex-end"}}>
      <button onClick={()=>setEditMode(m=>!m)}
        style={{padding:"6px 14px",borderRadius:"12px",border:`1.5px solid ${editMode?c.p:c.border}`,background:editMode?c.p:"white",color:editMode?"white":c.muted,cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:f,display:"flex",alignItems:"center",gap:"5px"}}>
        ✏️ {editMode?tr.customDone:tr.customise}
      </button>
    </div>
    {editMode&&<div style={{background:c.card,borderRadius:"14px",padding:"16px 20px",border:`1.5px solid ${c.p}30`}}>
      <div style={{fontSize:"12px",fontWeight:700,color:c.text,marginBottom:12}}>{tr.dragReorder}</div>
      {widgets.map((wid,idx)=>(
        <div key={wid.id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 12px",borderRadius:"10px",marginBottom:6,background:wid.visible?"#f9fafb":"#f0f0f0",border:`1.5px solid ${wid.visible?c.border:"#d1d5db"}`}}>
          <div style={{display:"flex",flexDirection:"column",gap:"1px"}}>
            <button onClick={()=>moveWidget(wid.id,-1)} disabled={idx===0} style={{padding:"1px 5px",border:"none",background:"transparent",cursor:idx===0?"default":"pointer",color:idx===0?"#d1d5db":c.muted,fontSize:"10px",lineHeight:1}}>▲</button>
            <button onClick={()=>moveWidget(wid.id,1)} disabled={idx===widgets.length-1} style={{padding:"1px 5px",border:"none",background:"transparent",cursor:idx===widgets.length-1?"default":"pointer",color:idx===widgets.length-1?"#d1d5db":c.muted,fontSize:"10px",lineHeight:1}}>▼</button>
          </div>
          <span style={{flex:1,fontSize:"13px",fontWeight:600,color:wid.visible?c.text:"#9ca3af"}}>{widgetLabel(wid.id)}</span>
          <button onClick={()=>toggleWidget(wid.id)}
            style={{padding:"4px 12px",borderRadius:"16px",border:"none",cursor:"pointer",fontSize:"11px",fontWeight:700,fontFamily:f,background:wid.visible?c.p:"#e5e7eb",color:wid.visible?"white":"#6b7280"}}>
            {wid.visible?tr.visible:tr.hidden}
          </button>
        </div>
      ))}
    </div>}
    {/* Time filters */}
    <div style={{display:"flex",gap:"7px",flexWrap:"wrap",alignItems:"center",overflowX:isMobile?"auto":"visible"}}>
      {[["week",tr.thisWeek],["lastWeek",tr.lastWeek],["month",tr.thisMonth],["lastMonth",tr.lastMonth],["all",tr.allTime]].map(([id,lbl])=>(
        <button key={id} onClick={()=>{setTimeFilter(id);setCompareMode(false);}} style={{padding:"8px 14px",borderRadius:"20px",border:"none",cursor:"pointer",fontFamily:f,fontWeight:600,fontSize:"13px",transition:"all 0.18s",background:timeFilter===id?c.p:c.card,color:timeFilter===id?"white":c.text,boxShadow:timeFilter===id?`0 3px 10px ${c.p}50`:"0 1px 4px rgba(0,0,0,0.07)",whiteSpace:"nowrap",minHeight:"44px"}}>{lbl}</button>
      ))}
      <button onClick={()=>setTimeFilter("custom")} style={{padding:"8px 13px",borderRadius:"20px",border:"none",cursor:"pointer",fontFamily:f,fontWeight:600,fontSize:"13px",background:timeFilter==="custom"?c.p:c.card,color:timeFilter==="custom"?"white":c.text,boxShadow:timeFilter==="custom"?`0 3px 10px ${c.p}50`:"0 1px 4px rgba(0,0,0,0.07)",whiteSpace:"nowrap",minHeight:"44px"}}>📅 {tr.custom}</button>
      {(timeFilter==="week"||timeFilter==="month")&&<button onClick={()=>setCompareMode(m=>!m)} style={{padding:"8px 13px",borderRadius:"20px",border:"none",cursor:"pointer",fontFamily:f,fontWeight:600,fontSize:"13px",background:compareMode?"#f59e0b":c.card,color:compareMode?"white":c.text,boxShadow:compareMode?"0 3px 10px rgba(245,158,11,0.5)":"0 1px 4px rgba(0,0,0,0.07)",whiteSpace:"nowrap",minHeight:"44px"}}>⚖️ {tr.compare}</button>}
    </div>
    {timeFilter==="custom"&&<div style={{background:c.card,borderRadius:"14px",padding:"16px 20px",border:`1.5px solid ${c.border}`,display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap"}}>
      <span style={{fontSize:"13px",fontWeight:600,color:c.text}}>📅 From</span>
      <input type="date" value={customRange.start} onChange={e=>setCustomRange(r=>({...r,start:e.target.value}))} style={{padding:"7px 10px",borderRadius:"9px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,background:"white"}}/>
      <span style={{color:c.muted}}>to</span>
      <input type="date" value={customRange.end} onChange={e=>setCustomRange(r=>({...r,end:e.target.value}))} style={{padding:"7px 10px",borderRadius:"9px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,background:"white"}}/>
    </div>}
    {!hasData&&<div style={{background:c.card,borderRadius:"16px",padding:"32px",textAlign:"center",border:`2px dashed ${c.border}`}}>
      <div style={{fontSize:"42px",marginBottom:10}}>📂</div>
      <div style={{fontWeight:700,color:c.text,fontSize:"17px",marginBottom:6}}>{tr.noData}</div>
      <div style={{color:c.muted,fontSize:"13px"}}>{tr.noDataSub}</div>
    </div>}
    {compareMode&&compFiltered&&compKey&&<ComparePanel theme={theme} label1={timeFilter==="week"?tr.thisWeek:tr.thisMonth} label2={compKey==="lastWeek"?tr.lastWeek:tr.lastMonth} txns1={filtered} txns2={compFiltered} lang={lang}/>}
    {/* Summary cards */}
    {isVisible("summary")&&<div style={{display:"flex",gap:"12px",flexWrap:isMobile?"nowrap":"wrap",overflowX:isMobile?"auto":"visible",paddingBottom:isMobile?"4px":0}}>
      <SCard label={w.inc} value={`+${fmt(totalInc)}`} sub={`${filtered.filter(t=>t.amount>0).length} ${tr.transactions}`} color="#10b981"/>
      <SCard label={tr.expenses} value={`-${fmt(Math.abs(totalExp))}`} sub={`${filtered.filter(t=>t.amount<0).length} ${tr.transactions}`} color={c.danger}/>
      <SCard label={tr.net} value={`${net>=0?"+":""}${fmt(net)}`} sub={net>=0?"Great work! 🎉":"More out than in"} color={net>=0?"#10b981":c.danger}/>
      {biggestExp&&<SCard label={tr.biggestExpense} value={`-${fmt(Math.abs(biggestExp.amount))}`} sub={biggestExp.desc.slice(0,28)+"…"} color={c.danger}/>}
    </div>}
    {/* Insights strip */}
    {isVisible("insights")&&hasData&&(topCat||topMerchant)&&<div style={{background:c.card,borderRadius:"14px",padding:"14px 20px",border:`1.5px solid ${c.border}`,display:"flex",gap:"20px",flexWrap:"wrap"}}>
      <span style={{fontSize:"11px",fontWeight:700,color:c.muted,alignSelf:"center",textTransform:"uppercase",letterSpacing:1}}>💡 {tr.insightsLabel}</span>
      {topCat&&<div style={{display:"flex",alignItems:"center",gap:"7px"}}><div style={{width:9,height:9,borderRadius:"50%",background:CC[topCat.name]||c.p}}/><span style={{fontSize:"12px",color:c.text,fontWeight:600}}>{tr.topSpend}: <strong>{catLabel(topCat.name)}</strong> ({fmt(topCat.value)})</span></div>}
      {topMerchant&&<div style={{fontSize:"12px",color:c.text,fontWeight:600}}>🛒 {tr.mostVisited}: <strong>{topMerchant[0]}</strong> ({topMerchant[1]}×)</div>}
      {avgDaily>0&&<div style={{fontSize:"12px",color:c.text,fontWeight:600}}>📅 {tr.avgDay}: <strong>{fmt(avgDaily)}</strong></div>}
    </div>}
    {/* Budget widget — independent period toggle */}
    {isVisible("budget")&&timeFilter!=="all"&&<BudgetWidget theme={theme} budgets={budgets} allTransactions={transactions} w={w} lang={lang}/>}
    {/* Payments + Reminders */}
    {isVisible("payments")&&<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"16px"}}>
      <div style={{background:c.card,borderRadius:"16px",padding:"20px",border:`1.5px solid ${c.border}`}}>
        <div style={{fontWeight:700,color:c.text,marginBottom:14,fontSize:"15px"}}>💳 {tr.upcomingCharges}</div>
        {(()=>{const monthly=paymentsWithCountdown.filter(p=>p.frequency!=="yearly");return monthly.length===0?<div style={{color:c.muted,fontSize:"13px"}}>{tr.noPayments}</div>:monthly.map(p=><div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,padding:"10px 12px",borderRadius:"10px",background:p.days<=3?`${c.danger}15`:p.days<=7?"#f59e0b18":c.pl}}><div><div style={{fontWeight:600,fontSize:"13px",color:c.text}}>{p.name}</div><div style={{fontSize:"11px",color:c.muted}}>{tr.inDays} {p.days} {p.days!==1?tr.days:tr.day}</div></div><div style={{fontWeight:700,fontSize:"14px",color:p.days<=3?c.danger:c.text}}>-{fmt(p.amount)}</div></div>);})()}
      </div>
      <div style={{background:c.card,borderRadius:"16px",padding:"20px",border:`1.5px solid ${c.border}`}}>
        <div style={{fontWeight:700,color:c.text,marginBottom:14,fontSize:"15px"}}>📋 {tr.remindersTitle}</div>
        {reminders.map(r=><div key={r.id} onClick={()=>setReminders(rs=>rs.map(x=>x.id===r.id?{...x,done:!x.done}:x))}
          style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 10px",borderRadius:"10px",cursor:"pointer",marginBottom:6,opacity:r.done?0.5:1}}>
          <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,border:`2px solid ${r.done?c.p:c.border}`,background:r.done?c.p:"white",display:"flex",alignItems:"center",justifyContent:"center"}}>{r.done&&<span style={{color:"white",fontSize:"11px"}}>✓</span>}</div>
          <div style={{flex:1}}><div style={{fontSize:"13px",fontWeight:600,color:c.text,textDecoration:r.done?"line-through":"none"}}>{r.text}</div><div style={{fontSize:"10px",color:c.muted}}>🔁 {r.repeat}</div></div>
        </div>)}
      </div>
    </div>}
    {/* Spending by category */}
    {isVisible("spending")&&catData.length>0&&<div style={{background:c.card,borderRadius:"16px",padding:"22px 24px",border:`1.5px solid ${c.border}`}}>
      <div style={{fontWeight:700,color:c.text,marginBottom:14,fontSize:"15px"}}>📊 {tr.spendingTitle}</div>
      <div style={{display:"flex",gap:"7px",flexWrap:"wrap",marginBottom:16}}>
        {inPeriodCats.map(cat=><button key={cat} onClick={()=>setCatFilter(cat)} style={{padding:"5px 13px",borderRadius:"20px",border:"none",cursor:"pointer",fontSize:"12px",fontFamily:f,fontWeight:600,transition:"all 0.15s",background:catFilter===cat?(CC[cat]||c.p):"transparent",color:catFilter===cat?"white":c.muted,outline:`1.5px solid ${catFilter===cat?(CC[cat]||c.p):c.border}`}}>{cat==="All"?cat:catLabel(cat)}</button>)}
      </div>
      {catFilter==="All"
        ? <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData} margin={{top:0,right:10,bottom:0,left:0}}>
              <XAxis dataKey="name" tick={{fontSize:11,fill:c.muted}} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip formatter={v=>[`€${(+v).toFixed(2)}`,"Spent"]} contentStyle={{borderRadius:"10px",border:`1px solid ${c.border}`,fontFamily:f,fontSize:"13px"}} cursor={{fill:`${c.pl}80`}}/>
              <Bar dataKey="value" radius={[6,6,0,0]}>{catData.map(e=><Cell key={e.name} fill={CC[e.name]||c.p}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        : <>
            {/* Total header replaces bar chart */}
            <div style={{background:c.pl,borderRadius:"14px",padding:"18px 22px",marginBottom:4,display:"flex",alignItems:"center",gap:"14px",border:`1.5px solid ${CC[catFilter]||c.p}40`}}>
              <div style={{width:16,height:16,borderRadius:"50%",background:CC[catFilter]||c.p,flexShrink:0}}/>
              <div>
                <div style={{fontSize:"12px",color:c.muted,marginBottom:2,fontFamily:f}}>{tr.totalSpentIn} <strong>{catLabel(catFilter)}</strong> — {periodLabel}</div>
                <div style={{fontSize:"28px",fontWeight:800,color:CC[catFilter]||c.p,fontFamily:f}}>
                  {fmt(filtered.filter(t=>t.cat===catFilter&&t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0))}
                </div>
                <div style={{fontSize:"11px",color:c.muted,marginTop:2}}>{filtered.filter(t=>t.cat===catFilter&&t.amount<0).length} {tr.transactions}</div>
              </div>
            </div>
            <MerchantBreakdown theme={theme} txns={filtered} cat={catFilter} lang={lang}/>
          </>
      }
    </div>}
    {/* ── Journal (month-nav) ── */}
    {isVisible("journal")&&<div style={{background:c.card,borderRadius:"16px",padding:"22px 24px",border:`1.5px solid ${c.border}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:"10px"}}>
        <div style={{fontWeight:700,color:c.text,fontSize:"15px"}}>📄 {w.txn}</div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <button onClick={prevJM} style={{padding:"6px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,background:"white",color:c.p,cursor:"pointer",fontSize:"14px",fontWeight:700}}>←</button>
          <span style={{fontSize:"13px",fontWeight:700,color:c.text,minWidth:"130px",textAlign:"center",textTransform:"capitalize"}}>{journalLabel}</span>
          <button onClick={nextJM} disabled={isCurrentMonth} style={{padding:"6px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,background:isCurrentMonth?"#f0f0f0":"white",color:isCurrentMonth?c.muted:c.p,cursor:isCurrentMonth?"default":"pointer",fontSize:"14px",fontWeight:700}}>→</button>
          {transactions.length>0&&<button onClick={onExport} style={{padding:"6px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,background:"transparent",color:c.p,cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:f}}>📥 Export</button>}
        </div>
      </div>
      {journalTxns.length===0
        ?<div style={{color:c.muted,fontSize:"13px",textAlign:"center",padding:"20px"}}>{tr.noTxns} — {lang==="es"?"usa ← para volver":"use ← to go back"}</div>
        :<div style={{overflowX:"auto"}}>
          <div style={{fontSize:"12px",color:c.muted,marginBottom:8}}>{journalTxns.length} {tr.transactions} · {journalTxns.filter(t=>t.amount<0).length} {tr.expenses2} · {fmt(Math.abs(journalTxns.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0)))} {tr.spent}</div>
          {isMobile
            ?<div style={{borderRadius:"12px",border:`1px solid ${c.border}`,overflow:"hidden"}}>
                {journalTxns.map(t=><TxnRow key={t.id} t={t} theme={theme} onCatChange={onCatChange} onAddReminder={onAddReminder} comment={comments[t.id]} onCommentSave={onCommentSave} allCats={allCats} reimbursed={reimbursed[t.id]} onMarkReimbursed={onMarkReimbursed} allTransactions={transactions} lang={lang} onSplitTx={onSplitTx} splitExpenses={splitExpenses}/>)}
              </div>
            :<table style={{width:"100%",borderCollapse:"collapse",fontFamily:f}}>
                <thead><tr style={{borderBottom:`2px solid ${c.border}`}}>{["Date","Description","Category","Amount",""].map(h=><th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:"10px",color:c.muted,textTransform:"uppercase",letterSpacing:1.2,fontWeight:700}}>{h}</th>)}</tr></thead>
                <tbody>{journalTxns.map(t=><TxnRow key={t.id} t={t} theme={theme} onCatChange={onCatChange} onAddReminder={onAddReminder} comment={comments[t.id]} onCommentSave={onCommentSave} allCats={allCats} reimbursed={reimbursed[t.id]} onMarkReimbursed={onMarkReimbursed} allTransactions={transactions} lang={lang} onSplitTx={onSplitTx} splitExpenses={splitExpenses}/>)}</tbody>
              </table>}
        </div>}
    </div>}
    {/* ── Income transactions widget ── */}
    {isVisible("income")&&hasData&&<div style={{background:c.card,borderRadius:"16px",padding:"22px 24px",border:`1.5px solid ${c.border}`}}>
      <div style={{fontWeight:700,color:c.text,fontSize:"15px",marginBottom:14}}>💰 {w.inc} — {periodLabel}</div>
      {filtered.filter(t=>t.amount>0).length===0
        ?<div style={{color:c.muted,fontSize:"13px",textAlign:"center",padding:"20px"}}>{lang==="es"?"Sin ingresos en este período":"No income in this period"}</div>
        :<>
          <div style={{fontSize:"12px",color:c.muted,marginBottom:10}}>
            {filtered.filter(t=>t.amount>0).length} {tr.transactions} · <span style={{color:"#10b981",fontWeight:700}}>+{fmt(totalInc)} total</span>
          </div>
          <div style={{overflowX:"auto",borderRadius:"12px",border:`1.5px solid ${c.border}`}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontFamily:f}}>
              <thead><tr style={{borderBottom:`2px solid ${c.border}`,background:c.pl}}>{(isMobile?["Date","Amount"]:["Date","From","Amount"]).map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:"10px",color:c.muted,textTransform:"uppercase",letterSpacing:1.2,fontWeight:700}}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.filter(t=>t.amount>0).map(t=>(
                  <tr key={t.id} style={{borderBottom:`1px solid ${c.border}`}}
                    onMouseEnter={e=>e.currentTarget.style.background=c.pl}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"9px 12px",fontSize:"12px",color:c.muted,whiteSpace:"nowrap"}}>{fmtShort(t.date)}</td>
                    {!isMobile&&<td style={{padding:"9px 12px",fontSize:"13px",color:c.text,maxWidth:"260px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{extractMerchant(t.desc)}</td>}
                    <td style={{padding:"9px 12px",fontSize:"13px",fontWeight:700,color:"#10b981",textAlign:"right",whiteSpace:"nowrap"}}>+{fmt(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>}
    </div>}
    {/* ── Subscriptions & Recurring widget ── */}
    {isVisible("subscriptions")&&<div style={{background:c.card,borderRadius:"16px",padding:"22px 24px",border:`1.5px solid ${c.border}`}}>
      <div style={{fontWeight:700,color:c.text,fontSize:"15px",marginBottom:14}}>📦 Subscriptions & Recurring</div>
      {paymentsWithCountdown.length===0
        ?<div style={{color:c.muted,fontSize:"13px",textAlign:"center",padding:"20px"}}>No auto payments set — add them in <strong>Auto Pay</strong></div>
        :<>
          <div style={{borderRadius:"12px",border:`1.5px solid ${c.border}`,overflow:"hidden",marginBottom:10}}>
            {paymentsWithCountdown.map((p,i)=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:"12px",padding:"13px 18px",borderBottom:i<paymentsWithCountdown.length-1?`1px solid ${c.border}`:"none"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:CC.Subscriptions||"#9c27b0",flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:"14px",color:c.text}}>{p.name}</div>
                  <div style={{fontSize:"11px",color:c.muted,marginTop:1}}>
                    {p.frequency==="yearly"
                      ?`yearly · ${p.month?`month ${p.month}, `:``}day ${p.day}`
                      :`monthly · day ${p.day}`}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontWeight:700,fontSize:"14px",color:c.danger}}>
                    -{fmt(p.amount)}{p.frequency==="yearly"?"/yr":"/mo"}
                  </div>
                  {p.frequency==="yearly"&&<div style={{fontSize:"10px",color:c.muted}}>{fmt(+(p.amount/12).toFixed(2))}/mo equiv.</div>}
                </div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",fontSize:"12px",fontWeight:700,color:c.muted}}>
            Monthly total: <span style={{color:c.danger,marginLeft:5}}>-{fmt(paymentsWithCountdown.reduce((s,p)=>s+(p.frequency==="yearly"?+(p.amount/12).toFixed(2):p.amount),0))}/mo</span>
          </div>
        </>}
    </div>}
  </div>;
}
