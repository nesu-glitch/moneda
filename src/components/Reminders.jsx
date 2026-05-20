import { useState } from "react";
import { T } from "../utils/constants.js";

export function RemindersPage({theme,reminders,setReminders,lang="es"}) {
  const {c,font:f}=theme;
  const tr=T[lang]||T.en;
  const[text,setText]=useState(""),[repeat,setRepeat]=useState("once");
  const add=()=>{if(!text.trim())return;setReminders(rs=>[...rs,{id:Date.now(),text:text.trim(),done:false,repeat}]);setText("");};
  return <div style={{maxWidth:"520px",fontFamily:f}}>
    <h2 style={{color:c.text,marginBottom:6,fontSize:"22px",fontWeight:800}}>📋 {tr.remindersTitle}</h2>
    <p style={{color:c.muted,fontSize:"14px",marginBottom:22}}>{tr.remindersSub}</p>
    <div style={{background:c.card,borderRadius:"16px",padding:"20px",marginBottom:18,border:`1.5px solid ${c.border}`}}>
      <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder={tr.placeholder} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"14px",outline:"none",fontFamily:f,color:c.text,marginBottom:10,background:"white"}}/>
      <div style={{display:"flex",gap:"7px",marginBottom:12}}>{["once","weekly","monthly"].map(r=><button key={r} onClick={()=>setRepeat(r)} style={{padding:"5px 14px",borderRadius:"20px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:f,background:repeat===r?c.p:"transparent",color:repeat===r?"white":c.muted,outline:`1.5px solid ${repeat===r?c.p:c.border}`}}>{r==="once"?tr.once:r==="weekly"?tr.weekly:tr.monthly}</button>)}</div>
      <button onClick={add} style={{padding:"9px 20px",borderRadius:"10px",border:"none",background:c.p,color:"white",cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:f}}>{tr.addReminderBtn}</button>
    </div>
    {reminders.map(r=><div key={r.id} style={{background:c.card,borderRadius:"12px",padding:"14px 18px",marginBottom:8,border:`1.5px solid ${r.done?c.pl:c.border}`,display:"flex",alignItems:"center",gap:"12px",opacity:r.done?0.55:1}}>
      <div onClick={()=>setReminders(rs=>rs.map(x=>x.id===r.id?{...x,done:!x.done}:x))} style={{width:24,height:24,borderRadius:"50%",flexShrink:0,cursor:"pointer",border:`2px solid ${r.done?c.p:c.border}`,background:r.done?c.p:"white",display:"flex",alignItems:"center",justifyContent:"center"}}>{r.done&&<span style={{color:"white",fontSize:"13px"}}>✓</span>}</div>
      <div style={{flex:1}}><div style={{fontSize:"14px",fontWeight:600,color:c.text,textDecoration:r.done?"line-through":"none"}}>{r.text}</div><div style={{fontSize:"11px",color:c.muted,marginTop:2}}>🔁 {r.repeat}</div></div>
      <button onClick={()=>setReminders(rs=>rs.filter(x=>x.id!==r.id))} style={{background:"transparent",border:"none",color:c.muted,cursor:"pointer",fontSize:"18px",padding:"4px 6px"}}>✕</button>
    </div>)}
  </div>;
}
