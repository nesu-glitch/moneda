import { useState } from "react";
import { T, CAT_LABELS, CC } from "../utils/constants.js";
import { ALL_CATS } from "../utils/allCats.js";
import { extractMerchant } from "../utils/categories.js";
import { fmt } from "../utils/format.js";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { StepProgress } from "./StepProgress.jsx";

export function CategoryReview({theme,unknowns,customCats,steps,stepIndex,onDone,lang="es"}) {
  const {c,font:f}=theme;
  const tr=T[lang]||T.en;
  const catLabel=cat=>(CAT_LABELS[lang]||CAT_LABELS.en)[cat]||cat;
  const isMobile=useIsMobile();
  const isTouch=typeof window!=="undefined"&&window.matchMedia("(hover: none)").matches;
  const groups=Object.entries(
    unknowns.reduce((acc,t)=>{const m=extractMerchant(t.desc);if(!acc[m])acc[m]=[];acc[m].push(t);return acc;},{})
  ).map(([merchant,txns])=>({merchant,txns,total:txns.reduce((s,t)=>s+Math.abs(t.amount),0),count:txns.length}));

  const [assignments,setAssignments]=useState({});
  const [dragging,setDragging]=useState(null);
  const [hovered,setHovered]=useState(null);
  const [selected,setSelected]=useState(null);
  const [localCats,setLocalCats]=useState([...ALL_CATS,...customCats]);
  const [newCat,setNewCat]=useState("");
  const [cardPage,setCardPage]=useState(0);
  const PAGE_SIZE=5;

  const assign=(merchant,cat)=>{
    setAssignments(a=>({...a,[merchant]:cat}));
    setSelected(null);setDragging(null);setHovered(null);
  };
  const unassign=merchant=>{setAssignments(a=>{const n={...a};delete n[merchant];return n;});};
  const addCat=()=>{const n=newCat.trim();if(!n||localCats.includes(n))return;setLocalCats(c=>[...c,n]);setNewCat("");};

  const unassignedGroups=groups.filter(g=>!assignments[g.merchant]);
  const done=unassignedGroups.length===0;
  const progress=groups.length-unassignedGroups.length;
  // Clamp page so it never goes past available pages
  const maxPage=Math.max(0,Math.ceil(unassignedGroups.length/PAGE_SIZE)-1);
  const safePage=Math.min(cardPage,maxPage);
  const pageCards=unassignedGroups.slice(safePage*PAGE_SIZE,(safePage+1)*PAGE_SIZE);
  const totalPages=Math.ceil(unassignedGroups.length/PAGE_SIZE)||1;

  const buildResult=()=>{
    const result={};
    for(const {merchant,txns} of groups){txns.forEach(t=>{result[t.id]=assignments[merchant]||"Other";});}
    return result;
  };

  // Solid background helper for category tiles
  const tileBg=(cat,isHovered,isActive)=>{
    if(isHovered) return `${CC[cat]||c.p}35`;
    if(isActive)  return `${CC[cat]||c.p}15`;
    return "white";
  };

  return <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?0:"16px",background:"rgba(0,0,0,0.78)"}}>
    <div style={{background:"#ffffff",borderRadius:isMobile?"24px 24px 0 0":"20px",padding:isMobile?"20px 16px":"24px 28px",maxWidth:"640px",width:"100%",maxHeight:isMobile?"95vh":"90vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.5)",border:"2px solid #e5e7eb",animation:isMobile?"slideUp 0.3s ease":"none"}}>
      <StepProgress steps={steps} current={stepIndex} theme={theme}/>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <div style={{fontSize:"20px",fontWeight:800,color:c.text,fontFamily:f}}>🤔 {tr.classifyTitle}</div>
        <div style={{fontSize:"12px",color:c.muted,fontWeight:600}}>{progress}/{groups.length} done</div>
      </div>
      <div style={{height:"7px",borderRadius:"7px",background:c.pl,marginBottom:14,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${groups.length?progress/groups.length*100:0}%`,borderRadius:"7px",background:c.p,transition:"width 0.4s"}}/>
      </div>

      {selected&&<div style={{background:c.pl,borderRadius:"10px",padding:"9px 14px",marginBottom:10,fontSize:"12px",fontWeight:700,color:c.p,fontFamily:f,textAlign:"center",border:`1.5px solid ${c.p}40`}}>
        ✦ {tr.classifyActive} <strong>{selected}</strong>
      </div>}

      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"12px"}}>
        {/* Merchant cards — paginated 5 at a time */}
        {unassignedGroups.length>0&&<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:"11px",color:c.muted,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>
              {dragging||selected?tr.classifyDrop:tr.classifyInstruction}
            </div>
            {totalPages>1&&<div style={{fontSize:"11px",color:c.muted,fontWeight:600}}>Group {safePage+1}/{totalPages}</div>}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:8}}>
            {pageCards.map(g=>(
              <div key={g.merchant}
                draggable={!isTouch}
                onDragStart={isTouch?undefined:()=>{setDragging(g.merchant);setSelected(null);}}
                onDragEnd={isTouch?undefined:()=>setDragging(null)}
                onClick={()=>setSelected(selected===g.merchant?null:g.merchant)}
                style={{padding:"12px 14px",borderRadius:"12px",cursor:isTouch?"pointer":"grab",userSelect:"none",flexShrink:0,minHeight:44,
                  border:`2px solid ${selected===g.merchant?c.p:dragging===g.merchant?"#f59e0b":"#d1d5db"}`,
                  background:selected===g.merchant?"#eff6ff":dragging===g.merchant?"#fffbeb":"#ffffff",
                  boxShadow:selected===g.merchant||dragging===g.merchant?"0 6px 18px rgba(0,0,0,0.18)":"0 2px 6px rgba(0,0,0,0.06)",
                  transform:selected===g.merchant?"scale(1.05)":dragging===g.merchant?"scale(1.04) rotate(1.5deg)":"scale(1)",
                  transition:"all 0.15s"}}>
                <div style={{fontWeight:700,fontSize:"13px",color:c.text,fontFamily:f,maxWidth:"150px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.merchant}</div>
                <div style={{fontSize:"11px",color:c.muted,marginTop:2}}>{g.count}× · -{fmt(g.total)}</div>
              </div>
            ))}
          </div>
          {/* Pagination controls */}
          {totalPages>1&&<div style={{display:"flex",gap:"8px",justifyContent:"center",marginBottom:4}}>
            <button onClick={()=>setCardPage(p=>Math.max(0,p-1))} disabled={safePage===0}
              style={{padding:"5px 14px",borderRadius:"20px",border:`1.5px solid ${c.border}`,background:safePage===0?"#f0f0f0":"white",color:safePage===0?c.muted:c.p,cursor:safePage===0?"default":"pointer",fontSize:"12px",fontWeight:700,fontFamily:f}}>← Prev</button>
            {Array.from({length:totalPages}).map((_,i)=>(
              <button key={i} onClick={()=>setCardPage(i)}
                style={{width:28,height:28,borderRadius:"50%",border:"none",background:safePage===i?c.p:"white",color:safePage===i?"white":c.muted,cursor:"pointer",fontSize:"11px",fontWeight:700,boxShadow:safePage===i?`0 2px 8px ${c.p}50`:`inset 0 0 0 1.5px ${c.border}`}}>{i+1}</button>
            ))}
            <button onClick={()=>setCardPage(p=>Math.min(maxPage,p+1))} disabled={safePage>=maxPage}
              style={{padding:"5px 14px",borderRadius:"20px",border:`1.5px solid ${c.border}`,background:safePage>=maxPage?"#f0f0f0":"white",color:safePage>=maxPage?c.muted:c.p,cursor:safePage>=maxPage?"default":"pointer",fontSize:"12px",fontWeight:700,fontFamily:f}}>Next →</button>
          </div>}
        </div>}

        {/* Category drop targets — solid backgrounds, deletable */}
        <div>
          <div style={{fontSize:"11px",color:"#6b7280",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>
            {tr.categories} <span style={{fontWeight:400,fontSize:"10px",color:"#9ca3af"}}>{tr.removeUnneeded}</span>
          </div>
          {/* Add new category */}
          <div style={{display:"flex",gap:"8px",marginBottom:12}}>
            <input value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCat()} placeholder={tr.createCategory}
              style={{flex:1,padding:"8px 12px",borderRadius:"9px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white"}}/>
            <button onClick={addCat} style={{padding:"8px 14px",borderRadius:"9px",border:"none",background:c.p,color:"white",cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:f}}>{tr.add}</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:"8px"}}>
            {localCats.map(cat=>{
              const isHov=hovered===cat;
              const isActive=!!(dragging||selected);
              // Solid background colours — no alpha
              const tileBg=isHov?"#374151":isActive?"#f8fafc":"#ffffff";
              const tileColor=isHov?"#ffffff":(CC[cat]||c.p);
              const tileBorder=isHov?(CC[cat]||c.p):isActive?`${CC[cat]||c.p}`:"#d1d5db";
              return <div key={cat} style={{position:"relative",borderRadius:"12px",border:`2px solid ${tileBorder}`,background:tileBg,
                  transition:"all 0.15s",cursor:isActive?"pointer":"default",transform:isHov?"scale(1.07)":"scale(1)",
                  boxShadow:isHov?`0 4px 12px rgba(0,0,0,0.2)`:"none"}}
                onDragOver={e=>{e.preventDefault();setHovered(cat);}}
                onDragLeave={()=>setHovered(null)}
                onDrop={()=>{if(dragging)assign(dragging,cat);setHovered(null);}}
                onClick={()=>{if(selected)assign(selected,cat);}}>
                <div style={{padding:"10px 8px",textAlign:"center",fontSize:"12px",fontWeight:700,fontFamily:f,color:tileColor}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:CC[cat]||c.p,margin:"0 auto 5px"}}/>
                  <div style={{lineHeight:1.3}}>{catLabel(cat)}</div>
                </div>
                {/* Delete button — top-right corner */}
                <button onClick={e=>{e.stopPropagation();setLocalCats(cs=>cs.filter(x=>x!==cat));if(selected===cat)setSelected(null);}}
                  title={`Remove ${cat} from options`}
                  style={{position:"absolute",top:"3px",right:"3px",width:16,height:16,borderRadius:"50%",border:"none",background:"#e5e7eb",color:"#6b7280",cursor:"pointer",fontSize:"9px",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1,padding:0,opacity:0.7}}>
                  ✕
                </button>
              </div>;
            })}
          </div>
        </div>

        {/* Assigned summary — compact tags */}
        {Object.keys(assignments).length>0&&<div>
          <div style={{fontSize:"11px",color:c.muted,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>{tr.assigned}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"5px"}}>
            {Object.entries(assignments).map(([merchant,cat])=>(
              <div key={merchant} style={{display:"flex",alignItems:"center",gap:"5px",padding:"4px 10px 4px 8px",borderRadius:"20px",background:"white",border:`1.5px solid ${CC[cat]||c.p}60`}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:CC[cat]||c.p,flexShrink:0}}/>
                <span style={{fontSize:"11px",fontWeight:600,color:c.text,maxWidth:"100px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{merchant}</span>
                <span style={{fontSize:"10px",color:CC[cat]||c.p,fontWeight:700}}>→ {catLabel(cat)}</span>
                <span onClick={()=>unassign(merchant)} style={{cursor:"pointer",color:c.muted,fontSize:"12px",marginLeft:2,lineHeight:1}}>✕</span>
              </div>
            ))}
          </div>
        </div>}
      </div>

      <button onClick={()=>onDone(buildResult(),localCats.filter(x=>!ALL_CATS.includes(x)))}
        disabled={!done}
        style={{marginTop:16,padding:"14px",borderRadius:"12px",border:"none",background:done?c.p:"#d1d5db",color:done?"white":"#9ca3af",fontSize:"15px",fontWeight:700,cursor:done?"pointer":"default",fontFamily:f,transition:"all 0.2s",boxShadow:done?`0 4px 14px ${c.p}40`:"none"}}>
        {done?tr.doneBtn:`${unassignedGroups.length} ${tr.leftToClassify}`}
      </button>
    </div>
  </div>;
}
