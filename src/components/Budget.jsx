import { useState } from "react";
import { T, CAT_LABELS, CC } from "../utils/constants.js";
import { ALL_CATS } from "../utils/allCats.js";
import { fmt } from "../utils/format.js";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { StepProgress } from "./StepProgress.jsx";

export function BudgetWizard({theme,steps,stepIndex,onDone,lang="es"}) {
  const {c,font:f}=theme;
  const tr=T[lang]||T.en;
  const catLabel=cat=>(CAT_LABELS[lang]||CAT_LABELS.en)[cat]||cat;
  const isMobile=useIsMobile();
  const [step,setStep]=useState(1),[income,setIncome]=useState("");
  const [limits,setLimits]=useState({Groceries:150,Restaurants:120,Transport:80,Shopping:200,Subscriptions:50,Health:60,Entertainment:50});
  const suggest=inc=>{const i=+inc||1500;setLimits({Groceries:Math.round(i*0.12),Restaurants:Math.round(i*0.10),Transport:Math.round(i*0.07),Shopping:Math.round(i*0.10),Subscriptions:Math.round(i*0.04),Health:Math.round(i*0.05),Entertainment:Math.round(i*0.04)});};
  return <div style={{position:"fixed",inset:0,zIndex:600,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?0:"20px",background:c.overlay||"rgba(0,0,0,0.65)"}}>
    <div style={{background:"#ffffff",borderRadius:isMobile?"24px 24px 0 0":"24px",padding:isMobile?"24px 20px":"32px",maxWidth:"500px",width:"100%",maxHeight:isMobile?"95vh":"none",overflowY:isMobile?"auto":"visible",boxShadow:"0 24px 60px rgba(0,0,0,0.45)",border:`1.5px solid ${c.border}`,animation:isMobile?"slideUp 0.3s ease":"none"}}>
      <StepProgress steps={steps} current={stepIndex} theme={theme}/>
      {step===1&&<>
        <div style={{fontSize:"40px",marginBottom:12,textAlign:"center"}}>🎯</div>
        <h2 style={{fontSize:"22px",fontWeight:800,color:c.text,marginBottom:8,textAlign:"center",fontFamily:f}}>{tr.budgetWizardTitle}</h2>
        <p style={{color:c.muted,fontSize:"13px",textAlign:"center",marginBottom:24}}>{tr.budgetWizardSub}</p>
        <input value={income} onChange={e=>setIncome(e.target.value)} type="number" placeholder="e.g. 1800"
          style={{width:"100%",padding:"14px",borderRadius:"12px",border:`2px solid ${income?c.p:c.border}`,fontSize:"18px",outline:"none",textAlign:"center",fontFamily:f,color:c.text,marginBottom:16,background:"white"}}/>
        <button onClick={()=>{suggest(income);setStep(2);}}
          style={{width:"100%",padding:"14px",borderRadius:"12px",border:"none",background:c.p,color:"white",fontSize:"16px",fontWeight:700,cursor:"pointer",fontFamily:f}}>
          {income?tr.suggestLimits:tr.skipManual}
        </button>
      </>}
      {step===2&&<>
        <h2 style={{fontSize:"20px",fontWeight:800,color:c.text,marginBottom:4,fontFamily:f}}>{tr.adjustTitle}</h2>
        <p style={{color:c.muted,fontSize:"13px",marginBottom:18}}>{tr.adjustSub}</p>
        <div style={{display:"flex",flexDirection:"column",gap:"10px",maxHeight:"340px",overflowY:"auto",marginBottom:20}}>
          {Object.entries(limits).map(([cat,val])=>(
            <div key={cat} style={{display:"flex",alignItems:"center",gap:"12px"}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:CC[cat]||c.p,flexShrink:0}}/>
              <span style={{flex:1,fontWeight:600,fontSize:"14px",color:c.text,fontFamily:f}}>{catLabel(cat)}</span>
              <span style={{fontSize:"13px",color:c.muted}}>€</span>
              <input type="number" value={val} onChange={e=>setLimits(l=>({...l,[cat]:+e.target.value}))}
                style={{width:"80px",padding:"6px 10px",borderRadius:"8px",border:`1.5px solid ${c.border}`,fontSize:"14px",outline:"none",fontFamily:f,color:c.text,textAlign:"right",background:"white"}}/>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:"10px"}}>
          <button onClick={()=>setStep(1)} style={{flex:1,padding:"12px",borderRadius:"12px",border:`1.5px solid ${c.border}`,background:"transparent",color:c.muted,fontSize:"14px",cursor:"pointer",fontFamily:f}}>{tr.back}</button>
          <button onClick={()=>onDone(limits)} style={{flex:2,padding:"12px",borderRadius:"12px",border:"none",background:c.p,color:"white",fontSize:"15px",fontWeight:700,cursor:"pointer",fontFamily:f}}>{tr.saveBudgets}</button>
        </div>
      </>}
    </div>
  </div>;
}

export function BudgetsPage({theme,budgets,setBudgets,catGroups,setCatGroups,allTransactions,allCats,lang="es"}) {
  const {c,font:f}=theme;
  const tr=T[lang]||T.en;
  const catLabel=cat=>(CAT_LABELS[lang]||CAT_LABELS.en)[cat]||cat;
  const [editing,setEditing]=useState(null),[val,setVal]=useState("");
  const [showNewGroup,setShowNewGroup]=useState(false),[groupName,setGroupName]=useState(""),[groupCats,setGroupCats]=useState([]);
  const [period,setPeriod]=useState("month"); // "month" or "week"
  const [addCat,setAddCat]=useState(""),[addVal,setAddVal]=useState(""),[showAdd,setShowAdd]=useState(false);

  // Filter transactions to current month or week
  const now=new Date();
  const periodTxns=allTransactions.filter(t=>{
    const d=new Date(t.date);
    if(period==="month") return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();
    // current week
    const day=now.getDay(),mo=day===0?-6:1-day;
    const wkStart=new Date(now);wkStart.setDate(now.getDate()+mo);wkStart.setHours(0,0,0,0);
    const wkEnd=new Date(wkStart);wkEnd.setDate(wkStart.getDate()+6);wkEnd.setHours(23,59,59);
    return d>=wkStart&&d<=wkEnd;
  });
  const periodSpent=Object.entries(periodTxns.filter(t=>t.amount<0).reduce((acc,t)=>({...acc,[t.cat]:(acc[t.cat]||0)+Math.abs(t.amount)}),{})).reduce((o,[k,v])=>({...o,[k]:+v.toFixed(2)}),{});
  // For budget limits: monthly is stored, weekly = monthly÷4
  const effectiveLimit=cat=>period==="week"?+((budgets[cat]||0)/4).toFixed(2):(budgets[cat]||0);
  const periodLabel=period==="month"?now.toLocaleDateString("es-ES",{month:"long",year:"numeric"}):"this week";

  return <div style={{maxWidth:"640px",fontFamily:f}}>
    <h2 style={{color:c.text,marginBottom:6,fontSize:"22px",fontWeight:800}}>🎯 {theme.w.budget}</h2>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:"8px"}}>
      <p style={{color:c.muted,fontSize:"14px"}}>{tr.budgetSub||"Limits vs actual spending"} — <strong>{periodLabel}</strong></p>
      <div style={{display:"flex",gap:"6px"}}>
        {[["month",`📅 ${tr.month}`],["week",`🗓 ${tr.week}`]].map(([p,lbl])=>(
          <button key={p} onClick={()=>setPeriod(p)} style={{padding:"5px 13px",borderRadius:"16px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:f,background:period===p?c.p:"white",color:period===p?"white":c.muted,boxShadow:period===p?`0 2px 8px ${c.p}40`:`inset 0 0 0 1.5px ${c.border}`}}>{lbl}</button>
        ))}
      </div>
    </div>
    {/* Category groups */}
    {catGroups.length>0&&<div style={{marginBottom:20}}>
      <div style={{fontSize:"13px",fontWeight:700,color:c.text,marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>🗂 {tr.categoryGroups}</div>
      {catGroups.map(g=>{
        const total=g.cats.reduce((s,cat)=>s+(periodSpent[cat]||0),0);
        const limit=g.cats.reduce((s,cat)=>s+(budgets[cat]||0),0);
        const pct=limit?Math.min(total/limit*100,100):0;
        return <div key={g.id} style={{background:c.card,borderRadius:"14px",padding:"16px 20px",marginBottom:8,border:`1.5px solid ${c.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div><div style={{fontWeight:700,color:c.text,fontSize:"15px"}}>{g.name}</div><div style={{fontSize:"11px",color:c.muted,marginTop:2}}>{g.cats.join(" + ")}</div></div>
            <div style={{textAlign:"right"}}>
              <div style={{fontWeight:700,fontSize:"14px",color:c.text}}>{fmt(total)}{limit?` / ${fmt(limit)}`:""}</div>
              <button onClick={()=>setCatGroups(gs=>gs.filter(x=>x.id!==g.id))} style={{fontSize:"11px",color:c.muted,background:"transparent",border:"none",cursor:"pointer",fontFamily:f}}>{tr.removeGroup}</button>
            </div>
          </div>
          {limit>0&&<div style={{height:"7px",borderRadius:"7px",background:c.pl,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,borderRadius:"7px",background:pct>=100?c.danger:pct>=80?"#f59e0b":c.p,transition:"width 0.5s"}}/></div>}
        </div>;
      })}
    </div>}
    {/* New group form */}
    <div style={{background:c.card,borderRadius:"14px",padding:"18px 20px",marginBottom:20,border:`1.5px dashed ${c.border}`}}>
      {!showNewGroup?<button onClick={()=>setShowNewGroup(true)} style={{background:"transparent",border:"none",color:c.p,cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:f}}>{tr.createGroup}</button>
        :<div>
          <div style={{fontSize:"13px",fontWeight:700,color:c.text,marginBottom:10}}>{tr.newGroup}</div>
          <input value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder={tr.groupName} style={{width:"100%",padding:"9px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white",marginBottom:10}}/>
          <div style={{fontSize:"12px",color:c.muted,marginBottom:8}}>{tr.selectCategories}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:12}}>
            {ALL_CATS.map(cat=><button key={cat} onClick={()=>setGroupCats(cs=>cs.includes(cat)?cs.filter(x=>x!==cat):[...cs,cat])}
              style={{padding:"4px 11px",borderRadius:"20px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:600,background:groupCats.includes(cat)?(CC[cat]||c.p):"transparent",color:groupCats.includes(cat)?"white":c.muted,outline:`1.5px solid ${groupCats.includes(cat)?(CC[cat]||c.p):c.border}`}}>{catLabel(cat)}</button>)}
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={()=>{if(groupName.trim()&&groupCats.length>0){setCatGroups(gs=>[...gs,{id:Date.now(),name:groupName.trim(),cats:groupCats}]);setGroupName("");setGroupCats([]);setShowNewGroup(false);}}} style={{padding:"8px 16px",borderRadius:"10px",border:"none",background:c.p,color:"white",cursor:"pointer",fontSize:"13px",fontWeight:700,fontFamily:f}}>{tr.createGroupBtn}</button>
            <button onClick={()=>{setShowNewGroup(false);setGroupName("");setGroupCats([]);}} style={{padding:"8px 14px",borderRadius:"10px",border:`1.5px solid ${c.border}`,background:"transparent",color:c.muted,cursor:"pointer",fontSize:"13px",fontFamily:f}}>{tr.cancel}</button>
          </div>
        </div>}
    </div>
    {/* Individual budgets — only categories with a limit set */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{fontSize:"13px",fontWeight:700,color:c.text,textTransform:"uppercase",letterSpacing:1}}>{tr.individualLimits} {period==="week"&&<span style={{fontWeight:400,color:c.muted,fontSize:"11px",textTransform:"none"}}>({tr.weeklyNote})</span>}</div>
      <button onClick={()=>{const u=allCats.filter(cat=>!(budgets[cat]>0));setAddCat(u[0]||"");setShowAdd(s=>!s);}}
        style={{padding:"5px 12px",borderRadius:"16px",border:"none",background:c.p,color:"white",cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:f}}>+ Add</button>
    </div>
    {showAdd&&<div style={{background:"#f9fafb",borderRadius:"12px",padding:"14px 18px",marginBottom:12,border:`1.5px dashed ${c.p}`,display:"flex",gap:"10px",alignItems:"center",flexWrap:"wrap"}}>
      <select value={addCat} onChange={e=>setAddCat(e.target.value)}
        style={{padding:"7px 10px",borderRadius:"9px",border:`1.5px solid ${c.border}`,fontSize:"13px",background:"white",color:c.text,fontFamily:f,outline:"none"}}>
        {allCats.filter(cat=>!(budgets[cat]>0)).map(cat=><option key={cat} value={cat}>{cat}</option>)}
      </select>
      <input value={addVal} onChange={e=>setAddVal(e.target.value)} type="number" placeholder="€/month" min="1"
        style={{width:"110px",padding:"7px 10px",borderRadius:"9px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,background:"white"}}/>
      <button onClick={()=>{if(addCat&&+addVal>0){setBudgets(b=>({...b,[addCat]:+addVal}));setAddVal("");setShowAdd(false);}}}
        style={{padding:"7px 14px",borderRadius:"9px",border:"none",background:c.p,color:"white",cursor:"pointer",fontSize:"13px",fontWeight:700,fontFamily:f}}>Save</button>
      <button onClick={()=>setShowAdd(false)} style={{padding:"7px 10px",borderRadius:"9px",border:`1.5px solid ${c.border}`,background:"white",color:c.muted,cursor:"pointer",fontSize:"13px"}}>Cancel</button>
    </div>}
    {allCats.filter(cat=>budgets[cat]>0).length===0&&!showAdd&&<div style={{color:c.muted,fontSize:"13px",textAlign:"center",padding:"20px 0"}}>No budgets set yet — click <strong>+ Add</strong> to create one</div>}
    {allCats.filter(cat=>budgets[cat]>0).map(cat=>{
      const monthlyLimit=budgets[cat];
      const limit=effectiveLimit(cat);
      const spent=periodSpent[cat]||0;
      const pct=limit?+(Math.min(spent/limit*100,100)).toFixed(0):0;
      return <div key={cat} style={{background:c.card,borderRadius:"14px",padding:"18px 22px",marginBottom:10,border:`1.5px solid ${c.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}><div style={{width:10,height:10,borderRadius:"50%",background:CC[cat]||c.p}}/><span style={{fontWeight:700,color:c.text,fontSize:"15px"}}>{catLabel(cat)}</span></div>
          {editing===cat?<div style={{display:"flex",gap:"6px"}}>
            <input value={val} onChange={e=>setVal(e.target.value)} type="number" autoFocus onKeyDown={e=>{if(e.key==="Enter"){setBudgets(b=>({...b,[cat]:+val}));setEditing(null);}}} style={{width:"80px",padding:"6px 8px",borderRadius:"8px",border:`2px solid ${c.p}`,fontSize:"14px",outline:"none",fontFamily:f,background:"white"}}/>
            <span style={{fontSize:"11px",color:c.muted,alignSelf:"center"}}>/mo</span>
            <button onClick={()=>{setBudgets(b=>({...b,[cat]:+val}));setEditing(null);}} style={{padding:"6px 12px",borderRadius:"8px",border:"none",background:c.p,color:"white",cursor:"pointer",fontSize:"12px",fontWeight:700}}>Set</button>
            <button onClick={()=>setEditing(null)} style={{padding:"6px 10px",borderRadius:"8px",border:`1.5px solid ${c.border}`,background:"transparent",cursor:"pointer",fontSize:"13px",color:c.muted}}>✕</button>
          </div>:<div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{color:c.muted,fontSize:"12px"}}>{fmt(spent)} / {fmt(limit)}{period==="week"?" /wk":" /mo"}</span>
            {period==="week"&&<span style={{fontSize:"10px",color:c.muted}}>(€{monthlyLimit}/mo)</span>}
            <button onClick={()=>{setEditing(cat);setVal(monthlyLimit);}} style={{padding:"4px 10px",borderRadius:"8px",border:`1.5px solid ${c.border}`,background:"transparent",color:c.p,cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:f}}>{tr.edit}</button>
            <button onClick={()=>setBudgets(b=>{const n={...b};delete n[cat];return n;})} title="Remove budget" style={{padding:"4px 8px",borderRadius:"8px",border:"none",background:"transparent",color:c.muted,cursor:"pointer",fontSize:"14px",lineHeight:1}}>✕</button>
          </div>}
        </div>
        <div style={{height:"7px",borderRadius:"7px",background:c.pl,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,borderRadius:"7px",background:pct>=100?c.danger:pct>=80?"#f59e0b":CC[cat]||c.p,transition:"width 0.5s"}}/></div>
        {pct>=100&&<div style={{fontSize:"11px",color:c.danger,marginTop:3}}>{theme.w.over}</div>}
      </div>;
    })}
  </div>;
}
