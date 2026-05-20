import { useEffect } from "react";
import { useIsMobile } from "../hooks/useIsMobile.js";

export function Toast({msg,type,onClose}) {
  const isMobile=useIsMobile();
  useEffect(()=>{const t=setTimeout(onClose,4500);return()=>clearTimeout(t);},[]);
  return <div style={{position:"fixed",bottom:isMobile?72:28,left:isMobile?"50%":"auto",right:isMobile?"auto":28,transform:isMobile?"translateX(-50%)":"none",zIndex:9999,background:type==="success"?"#22c55e":type==="error"?"#ef4444":"#3b82f6",color:"white",borderRadius:"14px",padding:"14px 20px",fontSize:"14px",fontWeight:600,boxShadow:"0 8px 32px rgba(0,0,0,0.22)",animation:"fadeUp 0.3s ease",display:"flex",alignItems:"center",gap:"10px",whiteSpace:"nowrap",maxWidth:"90vw"}}>
    <span style={{fontSize:"20px"}}>{type==="success"?"✅":type==="error"?"❌":"ℹ️"}</span>{msg}
    <span onClick={onClose} style={{cursor:"pointer",opacity:0.7,marginLeft:4}}>✕</span>
  </div>;
}
