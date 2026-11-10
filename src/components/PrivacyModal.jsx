import { useState } from "react";
import { T } from "../utils/constants.js";
import { useIsMobile } from "../hooks/useIsMobile.js";

// ── Privacy notice (display only — reads nothing, stores nothing) ─────────────
export function PrivacyModal({theme,lang="es",onClose}) {
  const {c,font:f}=theme;
  const isMobile=useIsMobile();
  const [l,setL]=useState(lang==="en"?"en":"es");
  const tr=T[l];
  return <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:700,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?0:"20px",background:c.overlay||"rgba(0,0,0,0.65)"}}>
    <div role="dialog" aria-modal="true" aria-labelledby="privacy-title" onClick={e=>e.stopPropagation()} style={{background:"#ffffff",borderRadius:isMobile?"24px 24px 0 0":"24px",padding:isMobile?"24px 20px":"32px",maxWidth:"560px",width:"100%",maxHeight:isMobile?"90vh":"85vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,0.45)",border:`1.5px solid ${c.border}`,animation:isMobile?"slideUp 0.3s ease":"pop 0.3s cubic-bezier(.34,1.56,.64,1)",fontFamily:f,color:c.text,textAlign:"left"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px",marginBottom:16}}>
        <h2 id="privacy-title" style={{fontSize:"20px",fontWeight:800,color:c.text,fontFamily:f}}>🔒 {tr.privacyNoticeTitle}</h2>
        <div style={{display:"flex",gap:"4px",flexShrink:0}}>
          {["es","en"].map(x=><button key={x} onClick={()=>setL(x)} style={{padding:"4px 10px",borderRadius:"12px",border:"none",cursor:"pointer",fontSize:"11px",fontWeight:700,fontFamily:f,background:l===x?c.p:"transparent",color:l===x?"white":c.muted,boxShadow:l===x?"none":`inset 0 0 0 1.5px ${c.border}`}}>{x.toUpperCase()}</button>)}
        </div>
      </div>
      {tr.privacySections.map(s=><div key={s.h} style={{marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:"14px",color:c.p,marginBottom:4,fontFamily:f}}>{s.h}</div>
        <div style={{fontSize:"13px",lineHeight:1.65,color:c.text}}>
          {s.p}
          {s.link&&<> <a href={s.link.href} target="_blank" rel="noreferrer" style={{color:c.p,fontWeight:700}}>{s.link.label}</a></>}
        </div>
      </div>)}
      <div style={{fontSize:"12px",color:c.muted,marginTop:4,marginBottom:18}}>{tr.privacyUpdated}</div>
      <button onClick={onClose} style={{width:"100%",padding:"12px",borderRadius:"12px",border:"none",background:c.p,color:"white",fontSize:"15px",fontWeight:700,cursor:"pointer",fontFamily:f}}>{tr.privacyClose}</button>
    </div>
  </div>;
}
