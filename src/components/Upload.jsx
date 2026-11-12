import { say } from "../utils/i18n.js";
import { ReimPanel, TxnRow, FullLedger } from "./Transactions.jsx";
import { useState, useCallback, useMemo } from "react";
import { T, CAT_LABELS, CC } from "../utils/constants.js";
import { extractMerchant } from "../utils/categories.js";
import { parseBankExport } from "../utils/parsers/index.js";
import { fmt, fmtShort } from "../utils/format.js";
import { useIsMobile } from "../hooks/useIsMobile.js";
import { splitDuplicates } from "../utils/dedupe.js";

// ── Duplicate Warning Modal ───────────────────────────────────────────────────
function DuplicateWarning({theme,duplicates,onSkip,onInclude,lang="es"}) {
  const {c,font:f}=theme;
  const isMobile=useIsMobile();
  return <div style={{position:"fixed",inset:0,zIndex:600,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?0:"20px",background:"rgba(0,0,0,0.72)"}}>
    <div style={{background:"#ffffff",borderRadius:isMobile?"24px 24px 0 0":"20px",padding:isMobile?"24px 20px":"28px 32px",maxWidth:"540px",width:"100%",maxHeight:isMobile?"95vh":"85vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.5)",animation:isMobile?"slideUp 0.3s ease":"none"}}>
      <div style={{fontSize:"22px",fontWeight:800,color:"#b45309",marginBottom:6,fontFamily:f}}>⚠️ {say(lang,"Posibles duplicados","Possible duplicates detected")}</div>
      <div style={{fontSize:"13px",color:"#374151",marginBottom:16,lineHeight:1.6}}>{say(lang,"Estos movimientos ya están cargados. Puede que hayas subido el mismo extracto dos veces.","The following transactions already exist. They may be from the same bank account uploaded twice.")}</div>
      <div style={{flex:1,overflowY:"auto",borderRadius:"10px",border:"1.5px solid #e5e7eb",marginBottom:16}}>
        {duplicates.map((t,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 14px",borderBottom:"1px solid #f3f4f6",fontSize:"12px"}}>
            <span style={{color:"#374151",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.date} · {t.desc}</span>
            <span style={{fontWeight:700,color:t.amount>=0?"#10b981":"#ef4444",marginLeft:12,flexShrink:0}}>{t.amount>=0?"+":"-"}{fmt(t.amount)}</span>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:"10px"}}>
        <button onClick={onSkip} style={{flex:1,padding:"12px",borderRadius:"10px",border:"none",background:c.p,color:"white",cursor:"pointer",fontSize:"14px",fontWeight:700,fontFamily:f}}>{say(lang,"Omitir duplicados ✓","Skip duplicates ✓")}</button>
        <button onClick={onInclude} style={{flex:1,padding:"12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,background:"white",color:c.text,cursor:"pointer",fontSize:"13px",fontWeight:600,fontFamily:f}}>{say(lang,"Incluir igualmente","Include anyway")}</button>
      </div>
    </div>
  </div>;
}

// ── Column picker: shown when Moneda can't recognise a file's columns ────────
function ColumnMapper({theme,lang,item,onConfirm,onSkip}) {
  const {c,font:f}=theme;
  const isMobile=useIsMobile();
  const {columns,guess}=item.preview;
  const[mode,setMode]=useState(guess&&guess.debit>=0&&guess.credit>=0?"pair":"single");
  const[map,setMap]=useState({date:guess?.date??-1,desc:guess?.desc??-1,amount:guess?.amount??-1,debit:guess?.debit??-1,credit:guess?.credit??-1});
  const[invert,setInvert]=useState(false);
  const mapping=mode==="pair"?{date:map.date,desc:map.desc,debit:map.debit,credit:map.credit,invert}:{date:map.date,desc:map.desc,amount:map.amount,invert};
  const ready=map.date>=0&&(mode==="pair"?map.debit>=0&&map.credit>=0:map.amount>=0);
  // Live preview: parse with the current choice so the user sees immediately whether it works
  const key=JSON.stringify(mapping);
  const result=useMemo(()=>{if(!ready)return null;try{return parseBankExport(item.data,{mapping:JSON.parse(key)});}catch{return null;}},[ready,item.data,key]);
  const found=result?.txns||[];
  const sel=(key,label)=><label style={{display:"flex",flexDirection:"column",gap:4,flex:"1 1 150px"}}>
    <span style={{fontSize:"11px",fontWeight:700,color:c.muted,textTransform:"uppercase",letterSpacing:0.8}}>{label}</span>
    <select value={map[key]} onChange={e=>setMap(m=>({...m,[key]:+e.target.value}))}
      style={{padding:"9px 10px",borderRadius:"10px",border:`1.5px solid ${map[key]>=0?c.p:c.border}`,fontSize:"13px",fontFamily:f,color:c.text,background:"white"}}>
      <option value={-1}>—</option>
      {columns.map(col=><option key={col.index} value={col.index}>{col.label}{col.sample[0]?` · ${col.sample[0].slice(0,24)}`:""}</option>)}
    </select>
  </label>;
  return <div style={{position:"fixed",inset:0,zIndex:650,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?0:"20px",background:"rgba(0,0,0,0.72)"}}>
    <div role="dialog" aria-modal="true" style={{background:"#ffffff",borderRadius:isMobile?"24px 24px 0 0":"20px",padding:isMobile?"22px 18px":"28px 32px",maxWidth:"600px",width:"100%",maxHeight:isMobile?"95vh":"88vh",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,0.5)",fontFamily:f}}>
      <div style={{fontSize:"20px",fontWeight:800,color:c.text,marginBottom:6}}>🧭 {say(lang,"Ayúdanos a leer este archivo","Help us read this file")}</div>
      <div style={{fontSize:"13px",color:c.muted,marginBottom:4,wordBreak:"break-all"}}>📄 {item.name}</div>
      <div style={{fontSize:"13px",color:"#374151",marginBottom:16,lineHeight:1.6}}>{say(lang,"No reconocemos las columnas de este extracto. Dinos cuál es cuál — solo hace falta una vez por formato.","We don't recognise this export's columns. Tell us which is which — you only need to do it once per format.")}</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"10px",marginBottom:12}}>
        {sel("date",say(lang,"Fecha","Date"))}
        {sel("desc",say(lang,"Descripción","Description"))}
      </div>
      <div style={{display:"flex",gap:"6px",marginBottom:10}}>
        {[["single",say(lang,"Una columna de importe","One amount column")],["pair",say(lang,"Cargos y abonos separados","Separate money out / in")]].map(([id,lbl])=>
          <button key={id} onClick={()=>setMode(id)} style={{flex:1,padding:"8px",borderRadius:"10px",border:`1.5px solid ${mode===id?c.p:c.border}`,background:mode===id?c.pl:"white",color:c.text,fontSize:"12px",fontWeight:700,cursor:"pointer",fontFamily:f}}>{lbl}</button>)}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"10px",marginBottom:10}}>
        {mode==="single"?sel("amount",say(lang,"Importe","Amount")):<>{sel("debit",say(lang,"Cargos (sale dinero)","Money out"))}{sel("credit",say(lang,"Abonos (entra dinero)","Money in"))}</>}
      </div>
      {mode==="single"&&<label style={{display:"flex",alignItems:"center",gap:8,fontSize:"12px",color:c.text,marginBottom:14,cursor:"pointer"}}>
        <input type="checkbox" checked={invert} onChange={e=>setInvert(e.target.checked)}/>
        {say(lang,"Mis gastos aparecen en positivo (p. ej. extractos de tarjeta de crédito)","My spending shows as positive numbers (e.g. credit card statements)")}
      </label>}
      <div style={{borderRadius:"12px",border:`1.5px solid ${found.length?"#bbf7d0":c.border}`,background:found.length?"#f0fdf4":"#f9fafb",padding:"12px 14px",marginBottom:16,minHeight:56}}>
        {!ready&&<div style={{fontSize:"13px",color:c.muted}}>{say(lang,"Elige al menos la fecha y el importe.","Pick at least the date and the amount.")}</div>}
        {ready&&!found.length&&<div style={{fontSize:"13px",color:"#b45309",fontWeight:600}}>{say(lang,"Con estas columnas no sale ningún movimiento. Prueba otra combinación.","No transactions come out with these columns. Try another combination.")}</div>}
        {found.length>0&&<>
          <div style={{fontSize:"13px",color:"#15803d",fontWeight:700,marginBottom:8}}>✓ {say(lang,"{n} movimientos encontrados","{n} transactions found",{n:found.length})}</div>
          {found.slice(0,3).map(t=><div key={t.id} style={{display:"flex",justifyContent:"space-between",gap:10,fontSize:"12px",color:"#374151",padding:"3px 0"}}>
            <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.date} · {t.desc||"—"}</span>
            <span style={{fontWeight:700,color:t.amount>=0?"#10b981":"#ef4444",flexShrink:0}}>{t.amount>=0?"+":"-"}{fmt(t.amount)}</span>
          </div>)}
        </>}
      </div>
      <div style={{display:"flex",gap:"10px"}}>
        <button disabled={!found.length} onClick={()=>onConfirm(result)} style={{flex:2,padding:"12px",borderRadius:"10px",border:"none",background:found.length?c.p:"#d1d5db",color:"white",cursor:found.length?"pointer":"not-allowed",fontSize:"14px",fontWeight:700,fontFamily:f}}>{say(lang,"Usar estas columnas ✓","Use these columns ✓")}</button>
        <button onClick={onSkip} style={{flex:1,padding:"12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,background:"white",color:c.text,cursor:"pointer",fontSize:"13px",fontWeight:600,fontFamily:f}}>{say(lang,"Saltar archivo","Skip file")}</button>
      </div>
    </div>
  </div>;
}

// ── Data Page ─────────────────────────────────────────────────────────────────
export function DataPage({theme,transactions,onUpload,onCatChange,comments,onCommentSave,onAddReminder,allCats,reimbursed,onMarkReimbursed,merchantMemory,onClearMemory,onExport,lang="es",onSplitTx,splitExpenses=[]}) {
  const {c,font:f,w}=theme;
  const tr=T[lang]||T.en;
  const[dragging,setDragging]=useState(false),[showLedger,setShowLedger]=useState(false),[showMemory,setShowMemory]=useState(false);
  const[dupWarning,setDupWarning]=useState(null); // {duplicates, parsedMerged}
  const[fileTypeError,setFileTypeError]=useState(null);
  const[mapping,setMapping]=useState(null); // {results, queue:[{name,data,preview}]}
  const nextMapped=parsed=>{
    const results=parsed?[...mapping.results,parsed]:mapping.results,queue=mapping.queue.slice(1);
    if(queue.length)setMapping({results,queue});
    else{setMapping(null);mergeAndUpload(results);}
  };

  const handleFiles=useCallback(files=>{
    if(!files||!files.length)return;
    const fileList=[...files].filter(f=>/\.(xlsx|xls|csv)$/i.test(f.name));
    if(!fileList.length){setFileTypeError(say(lang,"Solo se admiten archivos .xlsx, .xls o .csv","Only .xlsx, .xls or .csv files are supported"));setTimeout(()=>setFileTypeError(null),4000);return;}
    // Parse all files
    const results=[],unreadable=[],failures=[];
    let remaining=fileList.length;
    fileList.forEach(file=>{
      const reader=new FileReader();
      reader.onload=e=>{
        try{
          const data=new Uint8Array(e.target.result);
          const parsed=parseBankExport(data);
          if(parsed.needsMapping)unreadable.push({name:file.name,data,preview:parsed.preview});
          else if(parsed.txns&&parsed.txns.length>0)results.push(parsed);
        }catch(err){console.error('Moneda: could not read',file.name,err);failures.push(`${file.name}: ${err?.message||err}`);}
        remaining--;
        if(remaining===0){
          // Nothing readable at all: say why, instead of failing silently
          if(!results.length&&!unreadable.length&&failures.length){onUpload(null,say(lang,"No se pudo leer el archivo. ","The file could not be read. ")+failures.join(" · "));return;}
          // Files we couldn't read go through the column picker one by one, then everything is merged
          if(unreadable.length)setMapping({results,queue:unreadable});
          else mergeAndUpload(results);
        }
      };
      reader.onerror=()=>{failures.push(`${file.name}: read error`);remaining--;if(remaining===0)onUpload(null,say(lang,"No se pudo leer el archivo.","The file could not be read."));};
      reader.readAsArrayBuffer(file);
    });
  },[onUpload,transactions,lang]);

  function mergeAndUpload(results){
    if(!results.length){onUpload(null,say(lang,"No se encontraron movimientos válidos en el archivo.","No valid transactions found in the uploaded file(s)."));return;}
    // Moneda exports first: their rows carry categories, so they win over the same row in a bank file
    results.sort((a,b)=>(b.isMonedaExport?1:0)-(a.isMonedaExport?1:0));
    // Merge all parsed results
    const merged={txns:[],comments:{},isMonedaExport:results.every(r=>r.isMonedaExport),hasMonedaExport:results.some(r=>r.isMonedaExport),
      savedAutoPayments:[],savedReminders:[],savedBudgets:{},savedCustomCats:[],
      // Single-value fields: take the first result that has them (Moneda re-upload is always one file)
      savedWidgetConfig:results.find(r=>r.savedWidgetConfig?.length)?.savedWidgetConfig||[],
      savedProfile:results.find(r=>r.savedProfile)?.savedProfile||null,
      savedSplits:results.find(r=>r.savedSplits)?.savedSplits||null};
    for(const r of results){
      // Rows repeated across files (overlapping statements) are merged; identical rows
      // inside one file are real separate purchases and are all kept.
      merged.txns.push(...splitDuplicates(merged.txns,r.txns).fresh);
      Object.assign(merged.comments,r.comments);
      if(r.savedAutoPayments)merged.savedAutoPayments.push(...r.savedAutoPayments);
      if(r.savedReminders)merged.savedReminders.push(...r.savedReminders);
      if(r.savedBudgets)Object.assign(merged.savedBudgets,r.savedBudgets);
      if(r.savedCustomCats)merged.savedCustomCats.push(...r.savedCustomCats);
    }
    // Detect duplicates against existing transactions
    const {fresh,dupes:duplicates}=splitDuplicates(transactions,merged.txns);
    if(duplicates.length>0){
      setDupWarning({duplicates,parsedSkip:{...merged,txns:fresh},parsedAll:{...merged,allowDuplicates:true}});
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
    {mapping&&<ColumnMapper key={mapping.queue[0].name+mapping.queue.length} theme={theme} lang={lang} item={mapping.queue[0]} onConfirm={nextMapped} onSkip={()=>nextMapped(null)}/>}
    {dupWarning&&<DuplicateWarning theme={theme} lang={lang} duplicates={dupWarning.duplicates}
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
        <div style={{fontSize:"11px",color:"#a16207",marginTop:"6px"}}>{say(lang,"Solo tendrás que subir la primera fila de cabecera de tu extracto y describir qué falló. Sin registro.","You'll be asked to upload only the header row of your export and describe what went wrong. No account needed.")}</div>
      </div>
    </div>
    <div onDrop={e=>{e.preventDefault();setDragging(false);handleFiles(e.dataTransfer.files);}} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
      style={{background:dragging?c.pl:c.card,borderRadius:"20px",padding:"44px",textAlign:"center",transition:"all 0.2s",border:`2.5px dashed ${dragging?c.p:c.border}`,boxShadow:dragging?`0 0 0 4px ${c.p}25`:"none",marginBottom:18}}>
      <div style={{fontSize:"48px",marginBottom:12}}>📊</div>
      <div style={{fontWeight:700,color:c.text,fontSize:"17px",marginBottom:8}}>{dragging?tr.dropIt:tr.dropHere}</div>
      <div style={{color:c.muted,fontSize:"13px",marginBottom:22,lineHeight:1.6}}>{say(lang,"Uno o varios extractos .xlsx, .xls o .csv · ","One or more .xlsx, .xls or .csv bank exports · ")}<span style={{fontSize:"12px"}}>{say(lang,"100% en tu dispositivo 🔒","stays 100% on your device 🔒")}</span></div>
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
        <button onClick={onExport} style={{padding:"8px 14px",borderRadius:"10px",border:`1.5px solid ${c.border}`,background:"white",color:c.p,cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:f}}>📥 {say(lang,"Exportar","Export")}</button>
      </div>
      <button onClick={()=>setShowLedger(s=>!s)}
        style={{width:"100%",padding:"14px",borderRadius:"14px",border:`2px solid ${c.p}`,background:showLedger?c.p:"transparent",color:showLedger?"white":c.p,cursor:"pointer",fontWeight:700,fontSize:"14px",fontFamily:f,marginBottom:showLedger?12:0,transition:"all 0.2s"}}>
        {showLedger?(say(lang,"▲ Ocultar","▲ Hide")):`📜 ${tr.viewLedger}`} {w.txn} ({transactions.length} {tr.transactions}{say(lang,", reclasifica si quieres",", re-classify any")})
      </button>
      {showLedger&&<FullLedger theme={theme} transactions={transactions} onCatChange={onCatChange} comments={comments} onCommentSave={onCommentSave} onAddReminder={onAddReminder} allCats={allCats} reimbursed={reimbursed} onMarkReimbursed={onMarkReimbursed} onExport={onExport} lang={lang} onSplitTx={onSplitTx} splitExpenses={splitExpenses}/>}
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

