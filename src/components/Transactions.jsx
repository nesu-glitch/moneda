import { useState } from "react";
import { T, CAT_LABELS, CC } from "../utils/constants.js";
import { extractMerchant } from "../utils/categories.js";
import { fmt, fmtShort } from "../utils/format.js";
import { useIsMobile } from "../hooks/useIsMobile.js";

// ── Reimbursement expand panel (shared by mobile+desktop) ────────────────────
export function ReimPanel({t,theme,reimbursed,onMarkReimbursed,setShowReim,allTransactions}) {
  const {c,font:f}=theme;
  const isReimbursed=!!reimbursed;
  const isPartial=reimbursed?.paidBack!==undefined;
  const netAmount=isPartial?+(Math.abs(t.amount)-reimbursed.paidBack).toFixed(2):null;
  const linkedTxn=reimbursed?.linkedTxnId&&allTransactions?.find(x=>x.id===reimbursed.linkedTxnId);
  const [reimReason,setReimReason]=useState(""),[reimSearch,setReimSearch]=useState(""),[linkedId,setLinkedId]=useState("");
  const [reimType,setReimType]=useState("full"),[reimPaidBack,setReimPaidBack]=useState("");
  const searchResults=(reimSearch.length>1&&allTransactions)
    ? allTransactions.filter(x=>x.id!==t.id&&(x.desc.toLowerCase().includes(reimSearch.toLowerCase())||extractMerchant(x.desc).toLowerCase().includes(reimSearch.toLowerCase()))).slice(0,6)
    : [];
  return isReimbursed
    ?<div style={{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}}>
        <span style={{fontSize:"12px",color:"#15803d",fontWeight:600}}>{isPartial?`↩ Partial: -${fmt(reimbursed.paidBack)} paid back`:(`↩ ${reimbursed.reason}`)}</span>
        {linkedTxn&&<span style={{fontSize:"11px",color:"#6b7280",background:"#f3f4f6",borderRadius:"6px",padding:"2px 8px"}}>🔗 {fmtShort(linkedTxn.date)} {extractMerchant(linkedTxn.desc)} ({linkedTxn.amount>=0?"+":""}{fmt(linkedTxn.amount)})</span>}
        {isPartial&&<span style={{fontSize:"11px",color:"#92400e",background:"#fef9c3",borderRadius:"6px",padding:"2px 8px",fontWeight:700}}>net {fmt(netAmount)}</span>}
        <button onClick={()=>{onMarkReimbursed(t.id,null);setShowReim(false);}} style={{padding:"5px 12px",borderRadius:"8px",border:"1.5px solid #d1d5db",background:"white",color:"#6b7280",cursor:"pointer",fontSize:"12px",fontFamily:f}}>Remove</button>
      </div>
    :<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
        <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
          <span style={{fontSize:"12px",color:"#15803d",fontWeight:700,flexShrink:0}}>Type:</span>
          {[["full","↩ Full refund"],["partial","↩ Partial refund"]].map(([type,lbl])=>(
            <button key={type} onClick={()=>setReimType(type)} style={{padding:"4px 12px",borderRadius:"16px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:f,background:reimType===type?"#15803d":"white",color:reimType===type?"white":"#6b7280",boxShadow:reimType===type?"none":`inset 0 0 0 1.5px #d1d5db`}}>{lbl}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:"12px",color:"#15803d",fontWeight:700,flexShrink:0}}>Reason:</span>
          <input value={reimReason} onChange={e=>setReimReason(e.target.value)} placeholder={reimType==="partial"?"e.g. Phoebe paid back for drinks":"e.g. Friend fully covered this"}
            style={{flex:1,minWidth:"180px",padding:"6px 10px",borderRadius:"8px",border:"1.5px solid #bbf7d0",fontSize:"13px",outline:"none",fontFamily:f,background:"white"}}/>
        </div>
        {reimType==="partial"&&<div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:"12px",color:"#15803d",fontWeight:700,flexShrink:0}}>Paid back:</span>
          <input value={reimPaidBack} onChange={e=>setReimPaidBack(e.target.value)} placeholder={`e.g. ${fmt(Math.abs(t.amount)/2)}`} type="number" step="0.01" min="0" max={Math.abs(t.amount)}
            style={{width:"100px",padding:"6px 10px",borderRadius:"8px",border:"1.5px solid #bbf7d0",fontSize:"13px",outline:"none",fontFamily:f,background:"white"}}/>
          <span style={{fontSize:"11px",color:"#6b7280"}}>of {fmt(Math.abs(t.amount))} → net {fmt(Math.max(0,Math.abs(t.amount)-(+reimPaidBack||0)))}</span>
        </div>}
        <div style={{display:"flex",gap:"8px",alignItems:"flex-start",flexWrap:"wrap"}}>
          <span style={{fontSize:"12px",color:"#15803d",fontWeight:700,flexShrink:0,paddingTop:"6px"}}>🔗 Link:</span>
          <div style={{flex:1,minWidth:"180px"}}>
            <input value={reimSearch} onChange={e=>{setReimSearch(e.target.value);setLinkedId("");}} placeholder="Search income transaction to link…"
              style={{width:"100%",padding:"6px 10px",borderRadius:"8px",border:"1.5px solid #bbf7d0",fontSize:"13px",outline:"none",fontFamily:f,background:"white",marginBottom:searchResults.length?"4px":0}}/>
            {searchResults.map(x=>(
              <div key={x.id} onClick={()=>{setLinkedId(x.id);setReimSearch(extractMerchant(x.desc)+` ${fmt(x.amount)}`);if(reimType==="partial"&&!reimPaidBack)setReimPaidBack(String(Math.abs(x.amount)));}}
                style={{padding:"6px 10px",borderRadius:"8px",background:linkedId===x.id?"#dcfce7":"white",border:`1px solid ${linkedId===x.id?"#15803d":"#e5e7eb"}`,cursor:"pointer",fontSize:"12px",marginBottom:"2px",display:"flex",justifyContent:"space-between"}}>
                <span style={{color:"#111827",fontWeight:600}}>{fmtShort(x.date)} {extractMerchant(x.desc)}</span>
                <span style={{color:x.amount>=0?"#15803d":"#ef4444",fontWeight:700}}>{x.amount>=0?"+":""}{fmt(x.amount)}</span>
              </div>
            ))}
            {linkedId&&!searchResults.length&&<div style={{fontSize:"11px",color:"#15803d",padding:"4px 0"}}>✓ Linked</div>}
          </div>
        </div>
        <div style={{display:"flex",gap:"8px"}}>
          <button onClick={()=>{if(!reimReason.trim())return;const data={reason:reimReason.trim(),linkedTxnId:linkedId||null};if(reimType==="partial"&&+reimPaidBack>0)data.paidBack=+parseFloat(reimPaidBack).toFixed(2);onMarkReimbursed(t.id,data);setShowReim(false);}} style={{padding:"7px 16px",borderRadius:"8px",border:"none",background:"#15803d",color:"white",cursor:"pointer",fontSize:"12px",fontWeight:700}}>Confirm ✓</button>
          <button onClick={()=>setShowReim(false)} style={{padding:"7px 10px",borderRadius:"8px",border:"1.5px solid #d1d5db",background:"white",color:"#6b7280",cursor:"pointer",fontSize:"12px"}}>✕</button>
        </div>
      </div>;
}

// ── Transaction Row ───────────────────────────────────────────────────────────
export function TxnRow({t,theme,onCatChange,onAddReminder,comment,onCommentSave,allCats,reimbursed,onMarkReimbursed,allTransactions,lang="es",onSplitTx,splitExpenses=[]}) {
  const {c,font:f}=theme;
  const tr=T[lang]||T.en;
  const catLabel=cat=>(CAT_LABELS[lang]||CAT_LABELS.en)[cat]||cat;
  const isMobile=useIsMobile();
  const [editCat,setEditCat]=useState(false),[showCom,setShowCom]=useState(false),[showRem,setShowRem]=useState(false),[showReim,setShowReim]=useState(false);
  const isSplit=splitExpenses.some(e=>e.linkedTxId===t.id);
  const [cText,setCText]=useState(comment||""),[rText,setRText]=useState(extractMerchant(t.desc)),[rRepeat,setRRepeat]=useState("once");
  const isReimbursed=!!reimbursed;
  const isPartial=reimbursed?.paidBack!==undefined;
  const netAmount=isPartial?+(Math.abs(t.amount)-reimbursed.paidBack).toFixed(2):null;

  const catBadge=editCat
    ?<select autoFocus value={t.cat} onBlur={()=>setEditCat(false)} onChange={e=>{onCatChange(t.id,e.target.value);setEditCat(false);}}
        style={{padding:"3px 7px",borderRadius:"8px",border:`1.5px solid ${c.p}`,fontSize:"11px",background:"white",color:c.text,fontFamily:f,outline:"none"}}>
        {allCats.map(cat=><option key={cat} value={cat}>{catLabel(cat)}</option>)}
      </select>
    :<span onClick={()=>setEditCat(true)} title={tr.editCat} style={{padding:"3px 9px",borderRadius:"20px",fontSize:"11px",fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:"4px",background:`${CC[t.cat]||c.p}22`,color:CC[t.cat]||c.p}}>
        {catLabel(t.cat)}<span style={{opacity:0.5,fontSize:"9px"}}>✏️</span>
      </span>;

  const actionBtns=(mobile)=><>
    <button onClick={()=>{setShowCom(s=>!s);setShowRem(false);setShowReim(false);}} title="Comment" style={{background:"transparent",border:"none",cursor:"pointer",fontSize:mobile?"16px":"14px",padding:mobile?"4px 7px":"3px 5px",opacity:comment?1:0.4,minHeight:mobile?36:undefined,minWidth:mobile?36:undefined,display:mobile?"flex":"inline",alignItems:"center",justifyContent:"center"}}>💬{comment&&<span style={{fontSize:"9px",color:c.p,fontWeight:800,verticalAlign:"top"}}>●</span>}</button>
    <button onClick={()=>{setShowRem(s=>!s);setShowCom(false);setShowReim(false);}} title="Reminder" style={{background:"transparent",border:"none",cursor:"pointer",fontSize:mobile?"16px":"14px",padding:mobile?"4px 7px":"3px 5px",opacity:0.45,minHeight:mobile?36:undefined,minWidth:mobile?36:undefined,display:mobile?"flex":"inline",alignItems:"center",justifyContent:"center"}}>🔔</button>
    {t.amount<0&&<button onClick={()=>{setShowReim(s=>!s);setShowCom(false);setShowRem(false);}} title={isReimbursed?"Remove reimbursement":"Mark as reimbursed"} style={{background:"transparent",border:"none",cursor:"pointer",fontSize:mobile?"16px":"14px",padding:mobile?"4px 7px":"3px 5px",opacity:isReimbursed?1:0.4,minHeight:mobile?36:undefined,minWidth:mobile?36:undefined,display:mobile?"flex":"inline",alignItems:"center",justifyContent:"center"}}>↩</button>}
    {t.amount<0&&onSplitTx&&<button onClick={()=>onSplitTx(t)} title="Split expense" style={{background:"transparent",border:"none",cursor:"pointer",fontSize:mobile?"16px":"14px",padding:mobile?"4px 7px":"3px 5px",opacity:isSplit?1:0.4,minHeight:mobile?36:undefined,minWidth:mobile?36:undefined,display:mobile?"flex":"inline",alignItems:"center",justifyContent:"center"}}>✂️{isSplit&&<span style={{fontSize:"9px",color:c.p,fontWeight:800,verticalAlign:"top"}}>●</span>}</button>}
  </>;

  const commentPanel=<div style={{display:"flex",gap:"8px",alignItems:"flex-start"}}>
    <textarea value={cText} onChange={e=>setCText(e.target.value)} placeholder={tr.addComment}
      style={{flex:1,padding:"8px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"13px",resize:"none",height:"48px",outline:"none",fontFamily:f,color:c.text,background:"white"}}/>
    <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
      <button onClick={()=>{onCommentSave(t.id,cText);setShowCom(false);}} style={{padding:"5px 12px",borderRadius:"8px",border:"none",background:c.p,color:"white",cursor:"pointer",fontSize:"12px",fontWeight:700}}>{tr.saveComment}</button>
      <button onClick={()=>setShowCom(false)} style={{padding:"5px 10px",borderRadius:"8px",border:`1px solid ${c.border}`,background:"white",color:c.muted,cursor:"pointer",fontSize:"12px"}}>✕</button>
    </div>
  </div>;

  const reminderPanel=<div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
    <span style={{fontSize:"12px",color:c.muted,fontWeight:600,flexShrink:0}}>🔔 {tr.addReminder}:</span>
    <input value={rText} onChange={e=>setRText(e.target.value)} style={{flex:1,minWidth:"140px",padding:"6px 10px",borderRadius:"8px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,background:"white"}}/>
    {["once","weekly","monthly"].map(r=><button key={r} onClick={()=>setRRepeat(r)} style={{padding:"4px 10px",borderRadius:"16px",border:"none",cursor:"pointer",fontSize:"11px",fontWeight:600,background:rRepeat===r?c.p:"transparent",color:rRepeat===r?"white":c.muted,outline:`1px solid ${rRepeat===r?c.p:c.border}`}}>{r==="once"?tr.once:r==="weekly"?tr.weekly:tr.monthly}</button>)}
    <button onClick={()=>{onAddReminder({id:Date.now(),text:`${rText} (${fmt(t.amount)})`,done:false,repeat:rRepeat});setShowRem(false);}} style={{padding:"6px 12px",borderRadius:"8px",border:"none",background:c.p,color:"white",cursor:"pointer",fontSize:"12px",fontWeight:700}}>{tr.add} ✓</button>
    <button onClick={()=>setShowRem(false)} style={{padding:"6px 8px",borderRadius:"8px",border:`1px solid ${c.border}`,background:"white",color:c.muted,cursor:"pointer",fontSize:"12px"}}>✕</button>
  </div>;

  // ── Mobile card layout ─────────────────────────────────────────────────────
  if(isMobile) return <>
    <div style={{padding:"12px 14px",borderBottom:`1px solid ${c.border}`,opacity:(isReimbursed&&!isPartial)?0.55:1}}>
      {/* Row 1: date · category badge · amount */}
      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px"}}>
        <span style={{fontSize:"12px",color:c.muted,flexShrink:0,whiteSpace:"nowrap"}}>{fmtShort(t.date)}</span>
        <div style={{flex:1,display:"flex",justifyContent:"center"}}>{catBadge}</div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:"13px",fontWeight:700,color:t.amount>=0?"#10b981":(isReimbursed&&!isPartial)?"#9ca3af":c.danger,textDecoration:(isReimbursed&&!isPartial)?"line-through":"none"}}>
            {t.amount>=0?"+":""}{fmt(t.amount)}
          </div>
          {isPartial&&<div style={{fontSize:"10px",color:"#92400e",fontWeight:700}}>net {fmt(netAmount)}</div>}
        </div>
      </div>
      {/* Row 2: description */}
      <div style={{fontSize:"11px",color:c.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:"6px"}}>
        {isPartial&&<span style={{fontSize:"10px",background:"#fef9c3",color:"#92400e",borderRadius:"4px",padding:"1px 5px",marginRight:5,fontWeight:700}}>↩ -{fmt(reimbursed.paidBack)}</span>}
        {isReimbursed&&!isPartial&&<span style={{fontSize:"10px",background:"#dcfce7",color:"#15803d",borderRadius:"4px",padding:"1px 5px",marginRight:5,fontWeight:700}}>↩ reimbursed</span>}
        <span style={{textDecoration:(isReimbursed&&!isPartial)?"line-through":"none"}}>{t.desc}</span>
      </div>
      {/* Row 3: action buttons (right-aligned) */}
      <div style={{display:"flex",justifyContent:"flex-end",gap:"2px"}}>{actionBtns(true)}</div>
    </div>
    {showCom&&<div style={{background:c.pl,padding:"8px 14px",borderBottom:`1px solid ${c.border}`}}>{commentPanel}</div>}
    {showRem&&<div style={{background:c.pl,padding:"10px 14px",borderBottom:`1px solid ${c.border}`}}>{reminderPanel}</div>}
    {showReim&&<div style={{background:"#f0fdf4",padding:"12px 14px",borderBottom:`1px solid ${c.border}`}}>
      <ReimPanel t={t} theme={theme} reimbursed={reimbursed} onMarkReimbursed={onMarkReimbursed} setShowReim={setShowReim} allTransactions={allTransactions}/>
    </div>}
  </>;

  // ── Desktop table row layout ───────────────────────────────────────────────
  return <>
    <tr style={{borderBottom:`1px solid ${c.border}`,opacity:(isReimbursed&&!isPartial)?0.55:1}}
      onMouseEnter={e=>e.currentTarget.style.background=c.pl}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <td style={{padding:"10px 12px",fontSize:"12px",color:c.muted,whiteSpace:"nowrap"}}>{fmtShort(t.date)}</td>
      <td style={{padding:"10px 12px",fontSize:"13px",color:c.text,maxWidth:"200px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        {isPartial&&<span style={{fontSize:"10px",background:"#fef9c3",color:"#92400e",borderRadius:"4px",padding:"1px 5px",marginRight:5,fontWeight:700}}>↩ -{fmt(reimbursed.paidBack)}</span>}
        {isReimbursed&&!isPartial&&<span style={{fontSize:"10px",background:"#dcfce7",color:"#15803d",borderRadius:"4px",padding:"1px 5px",marginRight:5,fontWeight:700}}>↩ reimbursed</span>}
        <span style={{textDecoration:(isReimbursed&&!isPartial)?"line-through":"none"}}>{t.desc}</span>
      </td>
      <td style={{padding:"10px 12px"}}>{catBadge}</td>
      <td style={{padding:"10px 12px",fontSize:"13px",fontWeight:700,textAlign:"right",whiteSpace:"nowrap",color:t.amount>=0?"#10b981":(isReimbursed&&!isPartial)?"#9ca3af":c.danger,textDecoration:(isReimbursed&&!isPartial)?"line-through":"none"}}>
        {t.amount>=0?"+":""}{fmt(t.amount)}
        {isPartial&&<div style={{fontSize:"10px",color:"#92400e",fontWeight:700}}>net {fmt(netAmount)}</div>}
      </td>
      <td style={{padding:"10px 8px",whiteSpace:"nowrap",textAlign:"right"}}>{actionBtns(false)}</td>
    </tr>
    {showCom&&<tr style={{borderBottom:`1px solid ${c.border}`,background:c.pl}}><td colSpan={5} style={{padding:"8px 16px"}}>{commentPanel}</td></tr>}
    {showRem&&<tr style={{borderBottom:`1px solid ${c.border}`,background:c.pl}}><td colSpan={5} style={{padding:"10px 16px"}}>{reminderPanel}</td></tr>}
    {showReim&&<tr style={{borderBottom:`1px solid ${c.border}`,background:"#f0fdf4"}}><td colSpan={5} style={{padding:"12px 16px"}}>
      <ReimPanel t={t} theme={theme} reimbursed={reimbursed} onMarkReimbursed={onMarkReimbursed} setShowReim={setShowReim} allTransactions={allTransactions}/>
    </td></tr>}
  </>;
}

// ── Full Ledger (used in Data page) ──────────────────────────────────────────
export function FullLedger({theme,transactions,onCatChange,comments,onCommentSave,onAddReminder,allCats,reimbursed,onMarkReimbursed,onExport,lang="es"}) {
  const {c,font:f}=theme;
  const tr=T[lang]||T.en;
  const catLabel=cat=>(CAT_LABELS[lang]||CAT_LABELS.en)[cat]||cat;
  const isMobile=useIsMobile();
  const [search,setSearch]=useState(""),[catF,setCatF]=useState("All"),[limit,setLimit]=useState(50);
  const visible=transactions.filter(t=>{
    if(catF!=="All"&&t.cat!==catF)return false;
    if(search&&!t.desc.toLowerCase().includes(search.toLowerCase())&&!(t.cat||"").toLowerCase().includes(search.toLowerCase()))return false;
    return true;
  });
  const cats=["All",...[...new Set(transactions.map(t=>t.cat).filter(Boolean))]];
  return <div style={{marginTop:24}}>
    <div style={{display:"flex",gap:"10px",flexWrap:"wrap",marginBottom:14,alignItems:"center"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search transactions…"
        style={{flex:1,minWidth:"180px",padding:"8px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white"}}/>
      <select value={catF} onChange={e=>setCatF(e.target.value)}
        style={{padding:"8px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"13px",background:"white",color:c.text,fontFamily:f,outline:"none"}}>
        {cats.map(cat=><option key={cat} value={cat}>{catLabel(cat)}</option>)}
      </select>
      <button onClick={onExport} style={{padding:"8px 14px",borderRadius:"10px",border:`1.5px solid ${c.border}`,background:"transparent",color:c.p,cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:f}}>📥 Export</button>
    </div>
    <div style={{fontSize:"12px",color:c.muted,marginBottom:10}}>{visible.length} {tr.transactions}</div>
    {isMobile
      ?<div style={{borderRadius:"14px",border:`1.5px solid ${c.border}`,background:c.card,overflow:"hidden"}}>
          {visible.slice(0,limit).map(t=><TxnRow key={t.id} t={t} theme={theme} onCatChange={onCatChange} onAddReminder={onAddReminder} comment={comments[t.id]} onCommentSave={onCommentSave} allCats={allCats} reimbursed={reimbursed?.[t.id]} onMarkReimbursed={onMarkReimbursed} lang={lang} onSplitTx={onSplitTx} splitExpenses={splitExpenses}/>)}
        </div>
      :<div style={{overflowX:"auto",borderRadius:"14px",border:`1.5px solid ${c.border}`,background:c.card}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:f}}>
            <thead><tr style={{borderBottom:`2px solid ${c.border}`,background:c.pl}}>
              {["Date","Description","Category","Amount",""].map(h=><th key={h} style={{padding:"9px 12px",textAlign:"left",fontSize:"10px",color:c.muted,textTransform:"uppercase",letterSpacing:1.2,fontWeight:700}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {visible.slice(0,limit).map(t=><TxnRow key={t.id} t={t} theme={theme} onCatChange={onCatChange} onAddReminder={onAddReminder} comment={comments[t.id]} onCommentSave={onCommentSave} allCats={allCats} reimbursed={reimbursed?.[t.id]} onMarkReimbursed={onMarkReimbursed} lang={lang} onSplitTx={onSplitTx} splitExpenses={splitExpenses}/>)}
            </tbody>
          </table>
        </div>}
    {visible.length>limit&&<div style={{textAlign:"center",marginTop:12}}>
      <button onClick={()=>setLimit(l=>l+50)} style={{padding:"8px 20px",borderRadius:"10px",border:`1.5px solid ${c.border}`,background:"transparent",color:c.p,cursor:"pointer",fontSize:"13px",fontWeight:600,fontFamily:f}}>Load more ({visible.length-limit} remaining)</button>
    </div>}
  </div>;
}
