import { say } from "../utils/i18n.js";
const STEP_ES={"📦 Subscriptions":"📦 Suscripciones","🤔 Classify":"🤔 Clasificar","🎯 Budgets":"🎯 Presupuestos"};
export function StepProgress({steps,current,theme,lang="es"}) {
  const {c,font:f}=theme;
  return <div style={{display:"flex",gap:"0px",marginBottom:"20px",borderRadius:"12px",overflow:"hidden",border:`1.5px solid ${c.border}`}}>
    {steps.map((s,i)=>(
      <div key={i} style={{flex:1,padding:"10px 8px",textAlign:"center",fontSize:"11px",fontWeight:700,fontFamily:f,
        background:i<current?`${c.p}30`:i===current?c.p:"white",
        color:i===current?"white":i<current?c.p:c.muted,
        borderRight:i<steps.length-1?`1px solid ${c.border}`:"none",
        transition:"all 0.3s"}}>
        {i<current&&<span style={{marginRight:"4px"}}>✓</span>}{STEP_ES[s]?say(lang,STEP_ES[s],s):s}
      </div>
    ))}
  </div>;
}
