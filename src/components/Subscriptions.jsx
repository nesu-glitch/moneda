import { useState } from "react";
import { T } from "../utils/constants.js";
import { fmt, fmtD } from "../utils/format.js";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { StepProgress } from "./StepProgress.jsx";

export function SubscriptionVerify({theme,subs,steps,stepIndex,onDone,lang="es"}) {
  const {c,font:f}=theme;
  const tr=T[lang]||T.en;
  const isMobile=useIsMobile();
  const [items,setItems]=useState(subs.map(s=>({...s,checked:true,frequency:"monthly"})));
  const toggle=key=>setItems(is=>is.map(i=>i.key===key?{...i,checked:!i.checked}:i));
  const setFreq=(key,freq)=>setItems(is=>is.map(i=>i.key===key?{...i,frequency:freq}:i));
  return <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?0:"20px",background:"rgba(0,0,0,0.75)"}}>
    <div style={{background:"#ffffff",borderRadius:isMobile?"24px 24px 0 0":"20px",padding:isMobile?"24px 20px":"28px 32px",maxWidth:"540px",width:"100%",maxHeight:isMobile?"95vh":"88vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.5)",border:`2px solid ${c.border}`,animation:isMobile?"slideUp 0.3s ease":"none"}}>
      <StepProgress steps={steps} current={stepIndex} theme={theme}/>
      <div style={{fontSize:"22px",fontWeight:800,color:c.text,marginBottom:6,fontFamily:f}}>📦 {tr.subsDetected}</div>
      <div style={{fontSize:"13px",color:"#374151",fontWeight:500,marginBottom:16,background:"#f3f4f6",borderRadius:"10px",padding:"10px 14px"}}>
        {tr.subsSub}
      </div>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"10px"}}>
        {items.map(s=>(
          <div key={s.key} style={{borderRadius:"14px",border:`2px solid ${s.checked?c.p:"#d1d5db"}`,background:s.checked?"#eff6ff":"#f9fafb",transition:"all 0.15s"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"14px 16px 10px",cursor:"pointer"}} onClick={()=>toggle(s.key)}>
              <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,border:`2px solid ${s.checked?c.p:"#d1d5db"}`,background:s.checked?c.p:"#ffffff",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                {s.checked&&<span style={{color:"white",fontSize:"12px",lineHeight:1}}>✓</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:"15px",color:"#111827",fontFamily:f}}>{s.name}</div>
                <div style={{fontSize:"11px",color:"#6b7280",marginTop:2}}>{s.isRecurring?"🔄 Recurring pattern":"📦 Subscription"} · {tr.detected} {fmtD(s.date)} · {tr.renewsDay} {s.day}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontWeight:700,fontSize:"15px",color:c.danger}}>-{fmt(s.amount)}</div>
                <div style={{fontSize:"11px",color:"#6b7280"}}>{s.frequency==="yearly"?tr.perYear:tr.perMonth}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:"6px",alignItems:"center",padding:"0 16px 12px"}}>
              <span style={{fontSize:"11px",color:"#374151",fontWeight:700,marginRight:4}}>{tr.billing}</span>
              {[["monthly",tr.billingMonthly],["yearly",tr.billingYearly]].map(([freq,label])=>(
                <button key={freq} onClick={e=>{e.stopPropagation();setFreq(s.key,freq);}}
                  style={{padding:"5px 14px",borderRadius:"20px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:f,
                    background:s.frequency===freq?c.p:"#ffffff",
                    color:s.frequency===freq?"#ffffff":"#6b7280",
                    boxShadow:s.frequency===freq?`0 2px 8px ${c.p}50`:"inset 0 0 0 1.5px #d1d5db",
                    transition:"all 0.15s"}}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={()=>onDone(items.filter(i=>i.checked))}
        style={{marginTop:18,padding:"14px",borderRadius:"12px",border:"none",background:c.p,color:"white",fontSize:"15px",fontWeight:700,cursor:"pointer",fontFamily:f,boxShadow:`0 4px 14px ${c.p}40`}}>
        {tr.confirmAutoPay}
      </button>
    </div>
  </div>;
}

export function AutoPayPage({theme,autoPayments,setAutoPayments,paymentsWithCountdown,lang="es"}) {
  const {c,font:f}=theme;
  const tr=T[lang]||T.en;
  const[name,setName]=useState(""),[amt,setAmt]=useState(""),[day,setDay]=useState(""),[month,setMonth]=useState(""),[freq,setFreq]=useState("monthly");
  const add=()=>{
    if(!name||!amt||!day)return;
    if(freq==="yearly"&&!month)return;
    setAutoPayments(ps=>[...ps,{id:Date.now(),name,amount:+amt,day:+day,month:freq==="yearly"?+month:undefined,frequency:freq}]);
    setName("");setAmt("");setDay("");setMonth("");
  };
  return <div style={{maxWidth:"580px",fontFamily:f}}>
    <h2 style={{color:c.text,marginBottom:6,fontSize:"22px",fontWeight:800}}>💳 {tr.autoPayTitle}</h2>
    <p style={{color:c.muted,fontSize:"14px",marginBottom:20}}>{tr.autoPaySub}</p>
    <div style={{background:`${c.p}14`,borderRadius:"14px",padding:"16px 22px",marginBottom:20,border:`1.5px solid ${c.p}30`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontSize:"11px",color:c.muted,textTransform:"uppercase",letterSpacing:1}}>{tr.monthlyCommitments}</div><div style={{fontSize:"28px",fontWeight:800,color:c.p}}>-€{autoPayments.reduce((s,p)=>s+(p.frequency==="yearly"?p.amount/12:p.amount),0).toFixed(2)}/mo</div></div>
      <div style={{fontSize:"12px",color:c.muted}}>{autoPayments.length} {tr.charges}</div>
    </div>
    {paymentsWithCountdown.map(p=><div key={p.id} style={{background:c.card,borderRadius:"14px",padding:"14px 18px",marginBottom:10,border:`1.5px solid ${p.days<=3?c.danger:p.days<=7?"#f59e0b":c.border}`,display:"flex",alignItems:"center",gap:"14px"}}>
      <div style={{width:50,height:50,borderRadius:"12px",flexShrink:0,background:p.days<=3?`${c.danger}20`:p.days<=7?"#f59e0b20":c.pl,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:"20px",fontWeight:800,lineHeight:1,color:p.days<=3?c.danger:p.days<=7?"#d97706":c.p}}>{p.days}</div>
        <div style={{fontSize:"9px",color:c.muted}}>days</div>
      </div>
      <div style={{flex:1}}><div style={{fontWeight:700,color:c.text,fontSize:"15px"}}>{p.name}</div><div style={{fontSize:"12px",color:c.muted}}>{p.frequency==="yearly"?`${tr.everyYear}${p.month?`, ${lang==="es"?"mes":"month"} ${p.month}`:""}, ${lang==="es"?"día":"day"} ${p.day}`:`${tr.everyMonth}, ${lang==="es"?"día":"day"} ${p.day}`}</div></div>
      <div style={{textAlign:"right"}}><div style={{fontWeight:700,fontSize:"15px",color:c.text}}>-€{p.amount.toFixed(2)}{p.frequency==="yearly"?" /yr":"/mo"}</div><button onClick={()=>setAutoPayments(ps=>ps.filter(x=>x.id!==p.id))} style={{fontSize:"11px",color:c.muted,background:"transparent",border:"none",cursor:"pointer",fontFamily:f}}>{tr.remove}</button></div>
    </div>)}
    <div style={{background:c.card,borderRadius:"16px",padding:"20px",marginTop:16,border:`1.5px dashed ${c.border}`}}>
      <div style={{fontSize:"13px",fontWeight:700,color:c.text,marginBottom:12}}>+ {tr.addPayment}</div>
      <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:10}}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder={tr.name} style={{flex:"2 1 160px",padding:"9px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white"}}/>
        <input value={amt} onChange={e=>setAmt(e.target.value)} placeholder={tr.amount} type="number" style={{flex:"1 1 90px",padding:"9px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white"}}/>
        {freq==="yearly"&&<input value={month} onChange={e=>setMonth(e.target.value)} placeholder={lang==="es"?"Mes (1-12)":"Month (1-12)"} type="number" min="1" max="12" style={{flex:"1 1 90px",padding:"9px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white"}}/>}
        <input value={day} onChange={e=>setDay(e.target.value)} placeholder={`${tr.dayOfMonth} (1-31)`} type="number" min="1" max="31" style={{flex:"1 1 80px",padding:"9px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white"}}/>
      </div>
      <div style={{display:"flex",gap:"6px",marginBottom:12}}>{["monthly","yearly"].map(fr=><button key={fr} onClick={()=>{setFreq(fr);setMonth("");setDay("");}} style={{padding:"5px 13px",borderRadius:"16px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:f,background:freq===fr?c.p:"transparent",color:freq===fr?"white":c.muted,outline:`1.5px solid ${freq===fr?c.p:c.border}`}}>{fr==="monthly"?tr.everyMonth:tr.everyYear}</button>)}</div>
      <button onClick={add} style={{padding:"10px 20px",borderRadius:"10px",border:"none",background:c.p,color:"white",cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:f}}>{tr.addPayment}</button>
    </div>
  </div>;
}
