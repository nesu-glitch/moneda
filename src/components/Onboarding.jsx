import { useState, useEffect } from "react";
import { THEMES, THEMES_TR, GOALS, GOALS_TR, T } from "../utils/constants.js";
import { useIsMobile } from "../hooks/useIsMobile.js";

function Dialog({theme,lines,onDone}) {
  const [li,setLi]=useState(0),[ci,setCi]=useState(0);
  const line=lines[li]||"",shown=line.slice(0,ci),typing=ci<line.length;
  useEffect(()=>{if(!typing)return;const t=setTimeout(()=>setCi(c=>c+1),26);return()=>clearTimeout(t);},[ci,typing]);
  const go=()=>{if(typing){setCi(line.length);return;}if(li<lines.length-1){setLi(l=>l+1);setCi(0);}else onDone();};
  return <div onClick={go} style={{position:"fixed",bottom:0,left:0,right:0,padding:"16px 20px",cursor:"pointer",userSelect:"none",zIndex:200}}>
    <div style={{maxWidth:"640px",margin:"0 auto",background:"rgba(16,16,32,0.94)",borderRadius:"20px",border:"2.5px solid rgba(255,255,255,0.15)",padding:"18px 22px",display:"flex",gap:"16px",alignItems:"flex-start",boxShadow:"0 12px 40px rgba(0,0,0,0.45)",animation:"fadeUp 0.3s ease"}}>
      <div style={{fontSize:"46px",flexShrink:0,marginTop:2,animation:"bob 1.6s ease-in-out infinite"}}>{theme.npc}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:"10px",color:"rgba(255,255,255,0.35)",marginBottom:5,letterSpacing:2,textTransform:"uppercase",fontFamily:theme.font}}>{theme.npcName}</div>
        <div style={{color:"white",fontSize:"17px",lineHeight:1.65,fontFamily:theme.font,minHeight:"52px"}}>{shown}{typing&&<span style={{animation:"blink 0.7s step-start infinite"}}>▌</span>}</div>
        {!typing&&<div style={{color:"rgba(255,255,255,0.35)",fontSize:"12px",marginTop:8,textAlign:"right",animation:"blink 1.3s step-start infinite"}}>{li<lines.length-1?"▶  Click to continue":"▶  Let's go!"}</div>}
      </div>
    </div>
  </div>;
}

export function Onboarding({onDone}) {
  const [stage,setStage]=useState("lang"),[u,setU]=useState({name:"",themeId:"nature",avatar:"🦔",goal:"",lang:"es"});
  const theme=THEMES[u.themeId];const{c,font:f}=theme;
  const isMobile=useIsMobile();
  const card=(e={})=>({background:"white",borderRadius:"24px",padding:isMobile?"28px 20px":"40px",maxWidth:"480px",width:"100%",boxShadow:"0 12px 48px rgba(0,0,0,0.09)",animation:"pop 0.3s cubic-bezier(.34,1.56,.64,1)",textAlign:"center",...e});
  if(stage==="lang"){const tl=T[u.lang]||T.es;return <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#f0f0f0,#fafafa)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:'"Inter",sans-serif',padding:"20px",gap:"36px"}}>
    <div style={{textAlign:"center",animation:"fadeUp 0.4s ease"}}>
      <div style={{fontSize:"52px",marginBottom:12}}>💸</div>
      <h1 style={{fontSize:"32px",fontWeight:800,color:"#111",marginBottom:8}}>Moneda</h1>
      <p style={{color:"#888",fontSize:"15px"}}>{tl.pickLang}</p>
    </div>
    <div style={{display:"flex",gap:"16px",flexWrap:"wrap",justifyContent:"center"}}>
      {[["es","🇪🇸","Español"],["en","🇬🇧","English"]].map(([l,flag,label])=>(
        <button key={l} onClick={()=>{setU({...u,lang:l});setStage("theme");}}
          style={{padding:isMobile?"20px 32px":"24px 48px",borderRadius:"20px",border:`3px solid ${u.lang===l?"#4a7c59":"#e5e7eb"}`,background:u.lang===l?"#e2f0db":"white",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"10px",transition:"all 0.18s",transform:u.lang===l?"scale(1.05)":"scale(1)",boxShadow:u.lang===l?"0 8px 24px rgba(74,124,89,0.3)":"0 2px 8px rgba(0,0,0,0.06)"}}>
          <span style={{fontSize:"42px"}}>{flag}</span>
          <span style={{fontSize:"17px",fontWeight:700,color:"#111"}}>{label}</span>
        </button>
      ))}
    </div>
  </div>;}
  if(stage==="theme"){const tl=T[u.lang]||T.es;return <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#f0f0f0,#fafafa)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:'"Inter",sans-serif',padding:"20px"}}>
    <div style={{textAlign:"center",marginBottom:28,animation:"fadeUp 0.4s ease"}}><div style={{fontSize:"44px",marginBottom:10}}>💸</div><h1 style={{fontSize:"30px",fontWeight:800,color:"#111",marginBottom:6}}>{tl.welcomeTitle}</h1><p style={{color:"#888",fontSize:"15px"}}>{tl.pickWorld}</p></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",maxWidth:"580px",width:"100%",padding:isMobile?"0 4px":0}}>
      {Object.values(THEMES).map(t=><div key={t.id} onClick={()=>setU({...u,themeId:t.id})} style={{background:u.themeId===t.id?t.c.pl:"white",borderRadius:"20px",padding:isMobile?"16px 12px":"24px",border:`3px solid ${u.themeId===t.id?t.c.p:"#e5e7eb"}`,cursor:"pointer",transition:"all 0.18s",transform:u.themeId===t.id?"scale(1.03)":"scale(1)",boxShadow:u.themeId===t.id?`0 8px 24px ${t.c.p}35`:"0 2px 8px rgba(0,0,0,0.05)",fontFamily:t.font}}>
        <div style={{fontSize:isMobile?"26px":"32px",marginBottom:8}}>{t.emoji}</div><div style={{fontWeight:700,fontSize:isMobile?"14px":"17px",color:t.c.text}}>{(THEMES_TR[t.id]?.[u.lang]||THEMES_TR[t.id]?.en||{}).name||t.name}</div><div style={{fontSize:"11px",color:t.c.muted,marginTop:4,lineHeight:1.4}}>{(THEMES_TR[t.id]?.[u.lang]||THEMES_TR[t.id]?.en||{}).tagline||t.tagline}</div>
        {u.themeId===t.id&&<div style={{fontSize:"11px",color:t.c.p,fontWeight:700,marginTop:6}}>{tl.selected}</div>}
      </div>)}
    </div>
    <div style={{marginTop:24,display:"flex",flexDirection:"column",alignItems:"center",gap:"12px"}}>
      <button onClick={()=>setStage("welcome")} style={{padding:"14px 52px",borderRadius:"14px",border:"none",background:THEMES[u.themeId].c.p,color:"white",fontSize:"16px",fontWeight:700,cursor:"pointer",fontFamily:THEMES[u.themeId].font,boxShadow:`0 4px 16px ${THEMES[u.themeId].c.p}50`}}>{tl.enterWorld}</button>
      <button onClick={()=>onDone({...u,name:'Usuario',avatar:THEMES[u.themeId].avatars[0],goal:'know',quickStart:true})} style={{padding:"10px 32px",borderRadius:"14px",border:"2px solid #d1d5db",background:"white",color:"#6b7280",fontSize:"14px",fontWeight:600,cursor:"pointer",fontFamily:'"Inter",sans-serif'}}>{tl.quickStart}</button>
    </div>
  </div>;}
  if(stage==="quickname"){
    const t=THEMES[u.themeId];const qc=t.c;const qf=t.font;const tl=T[u.lang]||T.es;
    return <div style={{minHeight:"100vh",background:t.grad,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:qf,padding:"20px"}}>
      <div style={card()}>
        <div style={{fontSize:"48px",marginBottom:6}}>{t.emoji}</div>
        <div style={{fontSize:"16px",fontWeight:800,color:qc.p,marginBottom:2,fontFamily:qf}}>{(THEMES_TR[t.id]?.[u.lang]||THEMES_TR[t.id]?.en||{}).name||t.name}</div>
        <div style={{fontSize:"12px",color:qc.muted,marginBottom:24}}>{(THEMES_TR[t.id]?.[u.lang]||THEMES_TR[t.id]?.en||{}).tagline||t.tagline}</div>
        <h2 style={{fontSize:"24px",color:qc.text,marginBottom:8,fontWeight:800,fontFamily:qf}}>{tl.whatsYourName}</h2>
        <p style={{color:qc.muted,fontSize:"13px",marginBottom:20}}>{tl.nameForDashboard}</p>
        <input value={u.name} onChange={e=>setU({...u,name:e.target.value})}
          onKeyDown={e=>e.key==="Enter"&&u.name.trim()&&onDone({...u,avatar:t.avatars[0],goal:"know",quickStart:true})}
          placeholder={tl.namePlaceholder} autoFocus
          style={{width:"100%",padding:"14px 18px",borderRadius:"12px",border:`2px solid ${u.name.trim()?qc.p:qc.border}`,fontSize:"18px",outline:"none",textAlign:"center",fontFamily:qf,color:qc.text,background:"white",marginBottom:14}}/>
        <button onClick={()=>u.name.trim()&&onDone({...u,avatar:t.avatars[0],goal:"know",quickStart:true})}
          style={{width:"100%",padding:"14px",borderRadius:"12px",border:"none",background:u.name.trim()?qc.p:"#ddd",color:"white",fontSize:"16px",fontWeight:700,cursor:u.name.trim()?"pointer":"default",fontFamily:qf,boxShadow:u.name.trim()?`0 4px 14px ${qc.p}40`:"none"}}>
          {tl.letsGo}
        </button>
        <button onClick={()=>setStage("theme")} style={{marginTop:12,background:"transparent",border:"none",color:qc.muted,cursor:"pointer",fontSize:"13px",fontFamily:qf}}>{tl.back}</button>
      </div>
    </div>;
  }
  if(stage==="welcome")return <div style={{minHeight:"100vh",background:theme.grad,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:f,position:"relative"}}>
    <div style={{textAlign:"center",padding:"0 24px 200px",animation:"fadeUp 0.5s ease"}}>
      <div style={{fontSize:"80px",animation:"bob 2s ease-in-out infinite",marginBottom:20}}>{theme.npc}</div>
      <div style={{fontSize:"13px",color:c.muted,letterSpacing:3,textTransform:"uppercase",marginBottom:10}}>Personal Finance</div>
      <div style={{fontSize:"44px",fontWeight:800,color:c.p,lineHeight:1.1}}>Moneda 💸</div>
      <div style={{fontSize:"16px",color:c.muted,marginTop:12}}>{(THEMES_TR[theme.id]?.[u.lang]||THEMES_TR[theme.id]?.en||{}).tagline||theme.tagline}</div>
    </div>
    <Dialog theme={theme} lines={(THEMES_TR[theme.id]?.[u.lang]||THEMES_TR[theme.id]?.en||{}).chat||theme.chat} onDone={()=>setStage("name")}/>
  </div>;
  if(stage==="name"){const tl=T[u.lang]||T.es;return <div style={{minHeight:"100vh",background:theme.grad,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:f,padding:"20px"}}>
    <div style={card()}>
      <div style={{fontSize:"52px",marginBottom:16}}>{theme.npc}</div>
      <h2 style={{fontSize:"26px",color:c.text,marginBottom:8,fontWeight:800,fontFamily:f}}>{tl.whatsYourName}</h2>
      <p style={{color:c.muted,fontSize:"14px",marginBottom:28}}>{tl.nameForDashboard}</p>
      <input value={u.name} onChange={e=>setU({...u,name:e.target.value})} onKeyDown={e=>e.key==="Enter"&&u.name.trim()&&setStage("avatar")} placeholder={tl.namePlaceholder} autoFocus
        style={{width:"100%",padding:"14px 18px",borderRadius:"12px",border:`2px solid ${u.name.trim()?c.p:c.border}`,fontSize:"18px",outline:"none",textAlign:"center",fontFamily:f,color:c.text,background:"white"}}/>
      <button onClick={()=>u.name.trim()&&setStage("avatar")} style={{marginTop:16,width:"100%",padding:"14px",borderRadius:"12px",border:"none",background:u.name.trim()?c.p:"#ddd",color:"white",fontSize:"16px",fontWeight:700,cursor:u.name.trim()?"pointer":"default",fontFamily:f}}>{tl.continueBtn}</button>
    </div>
  </div>;}
  if(stage==="avatar"){const tl=T[u.lang]||T.es;return <div style={{minHeight:"100vh",background:theme.grad,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:f,padding:"20px"}}>
    <div style={card()}>
      <h2 style={{fontSize:"26px",fontWeight:800,color:c.text,marginBottom:6,fontFamily:f}}>{tl.pickCompanion}</h2>
      <p style={{color:c.muted,fontSize:"14px",marginBottom:24}}>{tl.whoJoins}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"10px",marginBottom:24}}>
        {theme.avatars.map(av=><button key={av} onClick={()=>setU({...u,avatar:av})} style={{fontSize:"38px",padding:"14px",borderRadius:"16px",border:`3px solid ${u.avatar===av?c.p:c.border}`,background:u.avatar===av?c.pl:"white",cursor:"pointer",transition:"all 0.15s",transform:u.avatar===av?"scale(1.12)":"scale(1)"}}>{av}</button>)}
      </div>
      <div style={{fontSize:"48px",marginBottom:4}}>{u.avatar}</div>
      <div style={{fontSize:"13px",color:c.muted,marginBottom:20}}>{tl.thisIsYou}</div>
      <button onClick={()=>setStage("goal")} style={{width:"100%",padding:"14px",borderRadius:"12px",border:"none",background:c.p,color:"white",fontSize:"16px",fontWeight:700,cursor:"pointer",fontFamily:f}}>{tl.perfect}</button>
    </div>
  </div>;}
  if(stage==="goal"){const tl=T[u.lang]||T.es;const gl=(GOALS_TR[u.lang]||GOALS_TR.es);return <div style={{minHeight:"100vh",background:theme.grad,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:f,padding:"20px"}}>
    <div style={{textAlign:"center",marginBottom:24}}><div style={{fontSize:"40px",marginBottom:8}}>{u.avatar}</div><h2 style={{fontSize:"26px",fontWeight:800,color:c.text,fontFamily:f}}>{tl.whyHere}</h2><p style={{color:c.muted,fontSize:"14px",marginTop:4}}>{tl.noWrongAnswers}</p></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",maxWidth:"480px",width:"100%",marginBottom:20}}>
      {GOALS.map(g=><div key={g.id} onClick={()=>setU({...u,goal:g.id})} style={{background:u.goal===g.id?c.pl:"white",borderRadius:"18px",padding:"22px 16px",border:`2.5px solid ${u.goal===g.id?c.p:c.border}`,cursor:"pointer",transition:"all 0.17s",transform:u.goal===g.id?"scale(1.03)":"scale(1)",textAlign:"center"}}>
        <div style={{fontSize:"30px",marginBottom:8}}>{g.e}</div><div style={{fontWeight:700,fontSize:"13px",color:c.text}}>{gl[g.id]?.label||g.label}</div><div style={{fontSize:"11px",color:c.muted,marginTop:4}}>{gl[g.id]?.sub||g.sub}</div>
      </div>)}
    </div>
    <button onClick={()=>u.goal&&setStage("tutorial")} style={{padding:"14px 56px",borderRadius:"14px",border:"none",background:u.goal?c.p:"#ddd",color:"white",fontSize:"16px",fontWeight:700,cursor:u.goal?"pointer":"default",fontFamily:f,boxShadow:u.goal?`0 4px 16px ${c.p}50`:"none"}}>
      {u.goal?tl.startJourney:tl.pickOption}
    </button>
  </div>;}
  if(stage==="tutorial"){const tl=T[u.lang||"es"]||T.es;return <div style={{minHeight:"100vh",background:theme.grad,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:f,padding:"20px"}}>
    <div style={{background:"white",borderRadius:"24px",padding:isMobile?"24px 18px":"36px 40px",maxWidth:"520px",width:"100%",boxShadow:"0 12px 48px rgba(0,0,0,0.09)",animation:"pop 0.3s cubic-bezier(.34,1.56,.64,1)",overflowY:"auto",maxHeight:"90vh"}}>
      <div style={{fontSize:"13px",color:c.muted,textAlign:"center",marginBottom:20}}>{tl.tutorialTitle}</div>
      <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
        {[
          {n:1,title:tl.step1Title,sub:tl.step1Sub,highlight:false},
          {n:2,title:tl.step2Title,sub:tl.step2Sub,highlight:false},
          {n:3,title:tl.step3Title,sub:tl.step3Sub,highlight:false},
          {n:4,title:tl.step4Title,sub:tl.step4Sub,highlight:true},
        ].map(({n,title,sub,highlight})=>(
          <div key={n} style={{display:"flex",gap:"14px",alignItems:"flex-start",background:highlight?"#fffbeb":"transparent",border:highlight?"1.5px solid #fde68a":"none",borderRadius:highlight?"12px":"0",padding:highlight?"14px":"0"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:highlight?"#f59e0b":c.p,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:"14px",flexShrink:0}}>{n}</div>
            <div>
              <div style={{fontWeight:700,fontSize:"13px",color:c.text,marginBottom:3}}>{title}</div>
              <div style={{fontSize:"12px",color:c.muted,lineHeight:1.7}}>{sub}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:"10px",marginTop:"24px"}}>
        <button onClick={()=>setStage("goal")} style={{flex:1,padding:"12px",borderRadius:"12px",border:`1.5px solid ${c.border}`,background:"transparent",color:c.text,fontSize:"14px",fontWeight:600,cursor:"pointer",fontFamily:f}}>{tl.back}</button>
        <button onClick={()=>onDone(u)} style={{flex:2,padding:"12px",borderRadius:"12px",border:"none",background:c.p,color:"white",fontSize:"15px",fontWeight:800,cursor:"pointer",fontFamily:f,boxShadow:`0 4px 16px ${c.p}40`}}>{tl.gotIt}</button>
      </div>
    </div>
  </div>;}
  return null;
}
