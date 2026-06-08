import { ReimPanel, TxnRow, FullLedger } from "./Transactions.jsx";
import { useState, useCallback } from "react";
import { T, CAT_LABELS, CC } from "../utils/constants.js";
import { extractMerchant } from "../utils/categories.js";
import { parseBankExport } from "../utils/parsers/index.js";
import { fmt, fmtShort } from "../utils/format.js";
import { useIsMobile } from "../hooks/useIsMobile.js";

// ── Duplicate Warning Modal ───────────────────────────────────────────────────
function DuplicateWarning({theme,duplicates,onSkip,onInclude}) {
  const {c,font:f}=theme;
  const isMobile=useIsMobile();
  return <div style={{position:"fixed",inset:0,zIndex:600,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?0:"20px",background:"rgba(0,0,0,0.72)"}}>
    <div style={{background:"#ffffff",borderRadius:isMobile?"24px 24px 0 0":"20px",padding:isMobile?"24px 20px":"28px 32px",maxWidth:"540px",width:"100%",maxHeight:isMobile?"95vh":"85vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.5)",animation:isMobile?"slideUp 0.3s ease":"none"}}>
      <div style={{fontSize:"22px",fontWeight:800,color:"#b45309",marginBottom:6,fontFamily:f}}>⚠️ Possible duplicates detected</div>
      <div style={{fontSize:"13px",color:"#374151",marginBottom:16,lineHeight:1.6}}>The following transactions already exist. They may be from the same bank account uploaded twice.</div>
      <div style={{flex:1,overflowY:"auto",borderRadius:"10px",border:"1.5px solid #e5e7eb",marginBottom:16}}>
        {duplicates.map((t,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",borderBottom:"1px solid #f3f4f6",fontSize:"12px"}}>
            <span style={{color:"#374151",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.date} · {t.desc}</span>
            <span style={{fontWeight:700,color:"#ef4444",marginLeft:12,flexShrink:0}}>{fmt(t.amount)}</span>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:"10px"}}>
        <button onClick={onSkip} style={{flex:1,padding:"12px",borderRadius:"10px",border:"none",background:c.p,color:"white",cursor:"pointer",fontSize:"14px",fontWeight:700,fontFamily:f}}>Skip duplicates ✓</button>
        <button onClick={onInclude} style={{flex:1,padding:"12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,background:"white",color:c.text,cursor:"pointer",fontSize:"13px",fontWeight:600,fontFamily:f}}>Include anyway</button>
      </div>
    </div>
  </div>;
}

// ── Data Page ─────────────────────────────────────────────────────────────────
export function DataPage({theme,transactions,onUpload,onCatChange,comments,onCommentSave,onAddReminder,allCats,reimbursed,onMarkReimbursed,merchantMemory,onClearMemory,onExport,lang="es"}) {
  const {c,font:f,w}=theme;
  const tr=T[lang]||T.en;
  const[dragging,setDragging]=useState(false),[showLedger,setShowLedger]=useState(false),[showMemory,setShowMemory]=useState(false);
  const[dupWarning,setDupWarning]=useState(null); // {duplicates, parsedMerged}
  const[fileTypeError,setFileTypeError]=useState(null);

  const handleFiles=useCallback(files=>{
    if(!files||!files.length)return;
    const fileList=[...files].filter(f=>/\.(xlsx|xls|csv)$/i.test(f.name));
    if(!fileList.length){setFileTypeError(lang==="es"?"Solo se admiten archivos .xlsx, .xls o .csv":"Only .xlsx, .xls or .csv files are supported");setTimeout(()=>setFileTypeError(null),4000);return;}
    // Parse all files
    const results=[];
    let remaining=fileList.length;
    fileList.forEach(file=>{
      const reader=new FileReader();
      reader.onload=e=>{
        try{
          const data=new Uint8Array(e.target.result);
          const parsed=parseBankExport(data);
          if(parsed.txns&&parsed.txns.length>0)results.push(parsed);
        }catch(_){}
        remaining--;
        if(remaining===0) mergeAndUpload(results);
      };
      reader.readAsArrayBuffer(file);
    });
  },[onUpload,transactions]);

  function mergeAndUpload(results){
    if(!results.length){onUpload(null,"No valid transactions found in the uploaded file(s).");return;}
    // Merge all parsed results
    const merged={txns:[],comments:{},isMonedaExport:results.every(r=>r.isMonedaExport),hasMonedaExport:results.some(r=>r.isMonedaExport),
      savedAutoPayments:[],savedReminders:[],savedBudgets:{},savedCustomCats:[],
      // Single-value fields: take the first result that has them (Moneda re-upload is always one file)
      savedWidgetConfig:results.find(r=>r.savedWidgetConfig?.length)?.savedWidgetConfig||[],
      savedProfile:results.find(r=>r.savedProfile)?.savedProfile||null,
      savedSplits:results.find(r=>r.savedSplits)?.savedSplits||null};
    for(const r of results){
      merged.txns.push(...r.txns);
      Object.assign(merged.comments,r.comments);
      if(r.savedAutoPayments)merged.savedAutoPayments.push(...r.savedAutoPayments);
      if(r.savedReminders)merged.savedReminders.push(...r.savedReminders);
      if(r.savedBudgets)Object.assign(merged.savedBudgets,r.savedBudgets);
      if(r.savedCustomCats)merged.savedCustomCats.push(...r.savedCustomCats);
    }
    // Detect duplicates against existing transactions
    const existingKeys=new Set(transactions.map(t=>`${t.date}|${t.desc}|${t.amount}`));
    const duplicates=merged.txns.filter(t=>existingKeys.has(`${t.date}|${t.desc}|${t.amount}`));
    // Also dedup within merged set itself
    const seen=new Set();
    merged.txns=merged.txns.filter(t=>{const k=`${t.date}|${t.desc}|${t.amount}`;if(seen.has(k))return false;seen.add(k);return true;});
    if(duplicates.length>0){
      setDupWarning({duplicates,parsedSkip:{...merged,txns:merged.txns.filter(t=>!existingKeys.has(`${t.date}|${t.desc}|${t.amount}`))},parsedAll:merged});
    }else{
      onUpload(merged,null,"merged");
    }
  }

  const handleFile=useCallback(file=>{handleFiles([file]);},[handleFiles]);
  const memoryCount=Object.keys(merchantMemory||{}).length;
  return <div style={{maxWidth:"700px",fontFamily:f}}>
    <h2 style={{color:c.text,marginBottom:6,fontSize:"22px",fontWeight:800}}>📂 {tr.dataTitle}</h2>
    <p style={{color:c.muted,fontSize:"14px",marginBottom:22}}>{tr.dataSub}</p>
    {/* Merchant memory status */}
    {memoryCount>0&&<div style={{background:"#f0fdf4",borderRadius:"14px",padding:"14px 18px",marginBottom:14,border:"1.5px solid #bbf7d0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
        <span style={{fontSize:"20px"}}>🧠</span>
        <div>
          <div style={{fontWeight:700,color:"#15803d",fontSize:"13px"}}>{tr.memoryActive}</div>
          <div style={{fontSize:"12px",color:"#166534"}}>{memoryCount} {tr.memoryBody}</div>
        </div>
      </div>
      <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
        <button onClick={()=>setShowMemory(s=>!s)} style={{padding:"5px 10px",borderRadius:"8px",border:"1.5px solid #bbf7d0",background:"white",color:"#15803d",cursor:"pointer",fontSize:"11px",fontWeight:700,fontFamily:f}}>{showMemory?tr.hideMemory:tr.viewMemory}</button>
        <button onClick={onClearMemory} style={{padding:"5px 10px",borderRadius:"8px",border:"1.5px solid #fca5a5",background:"white",color:"#ef4444",cursor:"pointer",fontSize:"11px",fontWeight:700,fontFamily:f}}>{tr.clearMemory}</button>
      </div>
    </div>}
    {showMemory&&memoryCount>0&&<div style={{background:c.card,borderRadius:"14px",padding:"14px 18px",marginBottom:14,border:`1.5px solid ${c.border}`,maxHeight:"220px",overflowY:"auto"}}>
      <div style={{fontSize:"11px",fontWeight:700,color:c.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>{tr.rememberedMerchants}</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
        {Object.entries(merchantMemory).sort((a,b)=>a[0].localeCompare(b[0])).map(([merchant,cat])=>(
          <div key={merchant} style={{display:"flex",alignItems:"center",gap:"5px",padding:"3px 10px 3px 8px",borderRadius:"20px",background:"white",border:`1.5px solid ${CC[cat]||c.border}50`}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:CC[cat]||c.p,flexShrink:0}}/>
            <span style={{fontSize:"11px",fontWeight:600,color:c.text,maxWidth:"110px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{merchant}</span>
            <span style={{fontSize:"10px",color:CC[cat]||c.p,fontWeight:700}}>→ {cat}</span>
          </div>
        ))}
      </div>
    </div>}
    {dupWarning&&<DuplicateWarning theme={theme} duplicates={dupWarning.duplicates}
      onSkip={()=>{onUpload(dupWarning.parsedSkip,null,"merged");setDupWarning(null);}}
      onInclude={()=>{onUpload(dupWarning.parsedAll,null,"merged");setDupWarning(null);}}/>}
    {/* Supported banks chips */}
    <div style={{marginBottom:14}}>
      <div style={{fontSize:"11px",fontWeight:700,color:c.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{tr.supportedBanks}</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
        {["Santander","BBVA","CaixaBank","Bankinter","Sabadell","ING","Unicaja","Kutxabank","Openbank","Revolut","N26","Wise"].map(bank=>(
          <span key={bank} style={{padding:"3px 10px",borderRadius:"20px",background:c.pl,border:`1.5px solid ${c.border}`,fontSize:"11px",fontWeight:600,color:c.text}}>{bank}</span>
        ))}
      </div>
    </div>
    {/* Help us support more banks */}
    <div style={{background:"#fffbeb",borderRadius:"14px",padding:"16px 20px",border:"1.5px solid #fde68a",display:"flex",gap:"12px",alignItems:"flex-start",marginBottom:14}}>
      <div style={{fontSize:"24px",flexShrink:0}}>🏦</div>
      <div>
        <div style={{fontWeight:700,fontSize:"14px",color:"#92400e",marginBottom:4}}>{tr.helpBanks}</div>
        <div style={{fontSize:"12px",color:"#78350f",lineHeight:1.7}}>{tr.helpBanksSub}</div>
        <div style={{background:"#fef3c7",borderRadius:"8px",padding:"8px 12px",marginTop:"8px",fontSize:"11px",color:"#92400e",fontWeight:600}}>
          {tr.warning}
        </div>
        <a href="https://forms.gle/B5YN41kHL4qfHf3Y7" target="_blank" rel="noreferrer"
          style={{display:"inline-block",marginTop:"10px",padding:"7px 16px",borderRadius:"20px",background:"#f59e0b",color:"white",fontSize:"12px",fontWeight:700,textDecoration:"none",cursor:"pointer"}}>
          {tr.shareBtn}
        </a>
        <div style={{fontSize:"11px",color:"#a16207",marginTop:"6px"}}>{lang==="es"?"Solo tendrás que subir la primera fila de cabecera de tu extracto y describir qué falló. Sin registro.":"You'll be asked to upload only the header row of your export and describe what went wrong. No account needed."}</div>
      </div>
    </div>
    <div onDrop={e=>{e.preventDefault();setDragging(false);handleFiles(e.dataTransfer.files);}} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
      style={{background:dragging?c.pl:c.card,borderRadius:"20px",padding:"44px",textAlign:"center",transition:"all 0.2s",border:`2.5px dashed ${dragging?c.p:c.border}`,boxShadow:dragging?`0 0 0 4px ${c.p}25`:"none",marginBottom:18}}>
      <div style={{fontSize:"48px",marginBottom:12}}>📊</div>
      <div style={{fontWeight:700,color:c.text,fontSize:"17px",marginBottom:8}}>{dragging?tr.dropIt:tr.dropHere}</div>
      <div style={{color:c.muted,fontSize:"13px",marginBottom:22,lineHeight:1.6}}>{lang==="es"?"Uno o varios extractos bancarios .xlsx · ":"One or multiple bank .xlsx exports · "}<span style={{fontSize:"12px"}}>{lang==="es"?"100% en tu dispositivo 🔒":"stays 100% on your device 🔒"}</span></div>
      <button onClick={async()=>{
        if(typeof window.showOpenFilePicker==="function"){
          try{
            const handles=await window.showOpenFilePicker({multiple:true,excludeAcceptAllOption:false,types:[{description:"Spreadsheet",accept:{"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":[".xlsx"],"application/vnd.ms-excel":[".xls",".csv"],"text/csv":[".csv"],"text/plain":[".csv"],"application/octet-stream":[".csv"],"application/csv":[".csv"]}}]});
            const files=await Promise.all(handles.map(h=>h.getFile()));
            handleFiles(files);return;
          }catch(err){if(err.name==="AbortError")return;}
        }
        const i=document.createElement('input');
        i.type='file';i.multiple=true;i.accept='*/*';
        i.style.cssText='position:fixed;top:-999px;left:-999px;opacity:0;';
        document.body.appendChild(i);
        i.onchange=e=>{handleFiles(e.target.files);document.body.removeChild(i);};
        i.click();
        setTimeout(()=>{if(document.body.contains(i))document.body.removeChild(i);},30000);
      }}
        style={{padding:"12px 28px",borderRadius:"12px",border:"none",background:c.p,color:"white",cursor:"pointer",fontWeight:700,fontSize:"15px",fontFamily:f,boxShadow:`0 4px 14px ${c.p}40`}}>
        {tr.chooseFile}
      </button>
      {fileTypeError&&<div style={{marginTop:12,padding:"10px 16px",borderRadius:"10px",background:"#fef2f2",border:"1.5px solid #fca5a5",color:"#dc2626",fontSize:"13px",fontWeight:600}}>{fileTypeError}</div>}
    </div>
    {transactions.length>0&&<>
      <div style={{background:`${c.p}14`,borderRadius:"14px",padding:"16px 20px",border:`1.5px solid ${c.p}30`,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontWeight:700,color:c.text,fontSize:"14px",marginBottom:4}}>✅ {tr.dataLoaded}</div><div style={{fontSize:"13px",color:c.muted}}>{transactions.length} {tr.transactions} · {transactions[transactions.length-1]?.date} → {transactions[0]?.date}</div></div>
        <button onClick={onExport} style={{padding:"8px 14px",borderRadius:"10px",border:`1.5px solid ${c.border}`,background:"white",color:c.p,cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:f}}>📥 Export</button>
      </div>
      <button onClick={()=>setShowLedger(s=>!s)}
        style={{width:"100%",padding:"14px",borderRadius:"14px",border:`2px solid ${c.p}`,background:showLedger?c.p:"transparent",color:showLedger?"white":c.p,cursor:"pointer",fontWeight:700,fontSize:"14px",fontFamily:f,marginBottom:showLedger?12:0,transition:"all 0.2s"}}>
        {showLedger?"▲ Hide":`📜 ${tr.viewLedger}`} {w.txn} ({transactions.length} {tr.transactions}{lang==="es"?", reclasifica si quieres":", re-classify any"})
      </button>
      {showLedger&&<FullLedger theme={theme} transactions={transactions} onCatChange={onCatChange} comments={comments} onCommentSave={onCommentSave} onAddReminder={onAddReminder} allCats={allCats} reimbursed={reimbursed} onMarkReimbursed={onMarkReimbursed} onExport={onExport} lang={lang}/>}
    </>}
    <div style={{background:"#f0fdf4",borderRadius:"14px",padding:"16px 20px",border:"1.5px solid #bbf7d0",display:"flex",gap:"12px",alignItems:"flex-start",marginTop:14}}>
      <div style={{fontSize:"22px"}}>🔒</div>
      <div><div style={{fontWeight:700,color:"#15803d",fontSize:"14px",marginBottom:4}}>{tr.privacyTitle}</div><div style={{fontSize:"12px",color:"#166534",lineHeight:1.7}}>{tr.privacyBody}</div></div>
    </div>
    <div style={{textAlign:"center",marginTop:10,fontSize:"12px",color:c.muted}}>
      <a href="https://github.com/nesu-glitch/moneda/issues/new" target="_blank" rel="noreferrer" style={{color:c.muted,textDecoration:"none"}}>{tr.feedbackLink}</a>
    </div>
    {/* Save session banner */}
    {transactions.length>0&&<div style={{background:"linear-gradient(135deg,#1e40af,#7c3aed)",borderRadius:"16px",padding:"22px 24px",marginTop:14,display:"flex",gap:"16px",alignItems:"center",flexWrap:"wrap"}}>
      <div style={{fontSize:"36px",flexShrink:0}}>💾</div>
      <div style={{flex:1,minWidth:"200px"}}>
        <div style={{fontWeight:800,color:"white",fontSize:"16px",marginBottom:4}}>{tr.saveSession}</div>
        <div style={{fontSize:"13px",color:"rgba(255,255,255,0.8)",lineHeight:1.6}}>{tr.saveSessionBody}</div>
      </div>
      <button onClick={onExport}
        style={{padding:"12px 22px",borderRadius:"12px",border:"2px solid rgba(255,255,255,0.4)",background:"rgba(255,255,255,0.15)",color:"white",cursor:"pointer",fontWeight:800,fontSize:"14px",fontFamily:f,whiteSpace:"nowrap",backdropFilter:"blur(4px)"}}>
        📥 {tr.exportBtn}
      </button>
    </div>}
  </div>;
}
