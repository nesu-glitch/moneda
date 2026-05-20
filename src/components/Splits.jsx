import { useState, useMemo } from "react";
import { extractMerchant } from "../utils/categories.js";
import { fmt, fmtShort } from "../utils/format.js";
import { useIsMobile } from "../hooks/useIsMobile.js";

function computeMinSettlements(participants,expenses){
  const bal={};
  participants.forEach(p=>bal[p]=0);
  expenses.forEach(exp=>{
    bal[exp.paidBy]=(bal[exp.paidBy]||0)+exp.amount;
    Object.entries(exp.splits||{}).forEach(([p,s])=>{bal[p]=(bal[p]||0)-s;});
  });
  const pos=[],neg=[];
  Object.entries(bal).forEach(([p,b])=>{
    if(b>0.005)pos.push({p,b:+b.toFixed(2)});
    else if(b<-0.005)neg.push({p,b:+(-b).toFixed(2)});
  });
  pos.sort((a,b)=>b.b-a.b);neg.sort((a,b)=>b.b-a.b);
  const transfers=[];let i=0,j=0;
  while(i<pos.length&&j<neg.length){
    const amt=+Math.min(pos[i].b,neg[j].b).toFixed(2);
    if(amt>0.005)transfers.push({from:neg[j].p,to:pos[i].p,amount:amt});
    pos[i].b=+(pos[i].b-amt).toFixed(2);neg[j].b=+(neg[j].b-amt).toFixed(2);
    if(pos[i].b<0.005)i++;if(neg[j].b<0.005)j++;
  }
  return transfers;
}
function buildEqualSplits(participants,amount){
  if(!participants.length)return{};
  const base=+(amount/participants.length).toFixed(2);
  const splits={};
  participants.forEach((p,i)=>splits[p]=i===participants.length-1?+(amount-base*(participants.length-1)).toFixed(2):base);
  return splits;
}

function SplitExpenseForm({theme,lang,group,prefill={},splitExpenses,onSave,onCancel}){
  const{c,font:f}=theme;const isMobile=useIsMobile();
  const[desc,setDesc]=useState(prefill.description||"");
  const[amt,setAmt]=useState(prefill.amount!=null?String(prefill.amount):"");
  const[paidBy,setPaidBy]=useState(prefill.paidBy||group.participants[0]||"");
  const[method,setMethod]=useState("equal");
  const[rawSplits,setRawSplits]=useState({});
  const[err,setErr]=useState("");
  const amount=parseFloat(amt)||0;
  const participants=group.participants;
  const splits=useMemo(()=>{
    if(!amount||!participants.length)return{};
    if(method==="equal")return buildEqualSplits(participants,amount);
    if(method==="percent"){const s={};participants.forEach(p=>s[p]=+((+(rawSplits[p]||0)/100*amount).toFixed(2)));return s;}
    if(method==="shares"){const tot=participants.reduce((s,p)=>s+(+(rawSplits[p]||1)),0)||1;const s={};participants.forEach(p=>s[p]=+((+(rawSplits[p]||1)/tot*amount).toFixed(2)));return s;}
    const s={};participants.forEach(p=>s[p]=+(+(rawSplits[p]||0)).toFixed(2));return s;
  },[method,rawSplits,participants,amount]);
  const splitSum=+Object.values(splits).reduce((a,b)=>a+b,0).toFixed(2);
  const validate=()=>{
    if(!desc.trim())return lang==="es"?"Añade una descripción":"Add a description";
    if(amount<=0)return lang==="es"?"Introduce un importe":"Enter a valid amount";
    if(!paidBy)return lang==="es"?"Elige quién pagó":"Select who paid";
    if(method!=="equal"&&Math.abs(splitSum-amount)>0.02)return lang==="es"?`Las partes suman €${splitSum.toFixed(2)}, necesitas €${amount.toFixed(2)}`:`Splits sum to €${splitSum.toFixed(2)}, need €${amount.toFixed(2)}`;
    return"";
  };
  const save=()=>{const e=validate();if(e){setErr(e);return;}
    onSave({id:Date.now()+Math.random(),groupId:group.id,description:desc.trim(),amount,currency:"EUR",paidBy,splitMethod:method,splits,date:prefill.date||new Date().toISOString().split("T")[0],linkedTxId:prefill.linkedTxId||null});
  };
  const mLabels={equal:lang==="es"?"Iguales":"Equal",percent:"%",exact:"€ exacto",shares:lang==="es"?"Partes":"Shares"};
  return<div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
    <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder={lang==="es"?"Descripción (ej: Cena)":"Description (e.g. Dinner)"}
      style={{padding:"9px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white"}}/>
    <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
      <input value={amt} onChange={e=>setAmt(e.target.value)} placeholder="€ 0.00" type="number"
        style={{flex:"1 1 100px",padding:"9px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white"}}/>
      <select value={paidBy} onChange={e=>setPaidBy(e.target.value)}
        style={{flex:"1 1 100px",padding:"9px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white"}}>
        {participants.map(p=><option key={p} value={p}>{p}</option>)}
      </select>
    </div>
    <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
      {["equal","percent","exact","shares"].map(m=><button key={m} onClick={()=>setMethod(m)}
        style={{padding:"4px 12px",borderRadius:"16px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:f,
          background:method===m?c.p:"transparent",color:method===m?"white":c.muted,outline:`1.5px solid ${method===m?c.p:c.border}`}}>{mLabels[m]}</button>)}
    </div>
    {method!=="equal"&&<div style={{background:c.pl,borderRadius:"10px",padding:"10px 14px"}}>
      <div style={{fontSize:"11px",color:c.muted,marginBottom:8,fontWeight:600}}>
        {method==="percent"?`${lang==="es"?"Porcentaje":"Percentage"} (${lang==="es"?"suma":"sum"}: ${participants.reduce((s,p)=>s+(+(rawSplits[p]||0)),0).toFixed(0)}%)`:
         method==="shares"?`${lang==="es"?"Partes":"Shares"}`:
         `${lang==="es"?"Importe exacto":"Exact amount"} (${lang==="es"?"suma":"sum"}: €${splitSum.toFixed(2)})`}
      </div>
      {participants.map(p=><div key={p} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:6}}>
        <span style={{flex:1,fontSize:"13px",color:c.text,fontWeight:600}}>{p}</span>
        <input type="number" value={rawSplits[p]||""} onChange={e=>setRawSplits(s=>({...s,[p]:e.target.value}))}
          placeholder={method==="shares"?"1":"0"}
          style={{width:"80px",padding:"5px 9px",borderRadius:"8px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white"}}/>
        <span style={{fontSize:"12px",color:c.muted,width:"52px",textAlign:"right"}}>€{(splits[p]||0).toFixed(2)}</span>
      </div>)}
    </div>}
    {method==="equal"&&amount>0&&<div style={{fontSize:"12px",color:c.muted,background:c.pl,borderRadius:"8px",padding:"6px 12px"}}>
      {participants.map(p=><span key={p} style={{marginRight:10}}>{p}: <strong>€{(splits[p]||0).toFixed(2)}</strong></span>)}
    </div>}
    {err&&<div style={{color:c.danger,fontSize:"12px",fontWeight:600}}>{err}</div>}
    <div style={{display:"flex",gap:"8px"}}>
      <button onClick={save} style={{flex:2,padding:"10px",borderRadius:"10px",border:"none",background:c.p,color:"white",cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:f}}>
        {lang==="es"?"Guardar ✓":"Save ✓"}
      </button>
      <button onClick={onCancel} style={{flex:1,padding:"10px",borderRadius:"10px",border:`1.5px solid ${c.border}`,background:"white",color:c.muted,cursor:"pointer",fontSize:"13px",fontFamily:f}}>
        {lang==="es"?"Cancelar":"Cancel"}
      </button>
    </div>
  </div>;
}

export function SplitModal({theme,lang,tx,splitGroups,splitExpenses,onSave,onClose}){
  const{c,font:f}=theme;const isMobile=useIsMobile();
  const[groupId,setGroupId]=useState(splitGroups[0]?.id||"");
  const group=splitGroups.find(g=>g.id===groupId);
  const alreadyLinked=splitExpenses.find(e=>e.linkedTxId===tx.id);
  if(!splitGroups.length)return<div style={{position:"fixed",inset:0,zIndex:700,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",background:"rgba(0,0,0,0.6)"}}>
    <div style={{background:"white",borderRadius:isMobile?"24px 24px 0 0":"20px",padding:"32px",maxWidth:"420px",width:"100%",textAlign:"center",animation:isMobile?"slideUp 0.3s ease":"none"}}>
      <div style={{fontSize:"40px",marginBottom:12}}>✂️</div>
      <div style={{fontWeight:700,color:c.text,fontSize:"16px",marginBottom:8}}>{lang==="es"?"Crea un grupo primero":"Create a group first"}</div>
      <div style={{color:c.muted,fontSize:"13px",marginBottom:20}}>{lang==="es"?"Ve a la pestaña Splits y crea un grupo con participantes.":"Go to the Splits tab and create a group with participants."}</div>
      <button onClick={onClose} style={{padding:"10px 24px",borderRadius:"10px",border:"none",background:c.p,color:"white",cursor:"pointer",fontWeight:700,fontFamily:f}}>{lang==="es"?"Entendido":"Got it"}</button>
    </div>
  </div>;
  return<div style={{position:"fixed",inset:0,zIndex:700,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?0:"20px",background:"rgba(0,0,0,0.6)"}}>
    <div style={{background:"white",borderRadius:isMobile?"24px 24px 0 0":"20px",padding:isMobile?"20px 16px":"28px",maxWidth:"480px",width:"100%",maxHeight:isMobile?"90vh":"none",overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,0.45)",animation:isMobile?"slideUp 0.3s ease":"none"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontWeight:800,fontSize:"17px",color:c.text,fontFamily:f}}>✂️ {lang==="es"?"Dividir gasto":"Split expense"}</div>
        <button onClick={onClose} style={{background:"transparent",border:"none",fontSize:"20px",cursor:"pointer",color:c.muted}}>✕</button>
      </div>
      {alreadyLinked&&<div style={{background:"#fef3c7",borderRadius:"10px",padding:"8px 12px",marginBottom:12,fontSize:"12px",color:"#92400e",fontWeight:600}}>
        ⚠️ {lang==="es"?"Este gasto ya está vinculado a un split.":"This transaction is already linked to a split."}
      </div>}
      <div style={{background:c.pl,borderRadius:"10px",padding:"10px 14px",marginBottom:16}}>
        <div style={{fontSize:"11px",color:c.muted}}>{fmtShort(tx.date)}</div>
        <div style={{fontWeight:700,color:c.text,fontSize:"14px"}}>{extractMerchant(tx.desc)}</div>
        <div style={{fontWeight:800,color:c.danger,fontSize:"16px"}}>-{fmt(Math.abs(tx.amount))}</div>
      </div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:"11px",color:c.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>{lang==="es"?"Grupo":"Group"}</div>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
          {splitGroups.map(g=><button key={g.id} onClick={()=>setGroupId(g.id)}
            style={{padding:"5px 14px",borderRadius:"16px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:f,
              background:groupId===g.id?c.p:"transparent",color:groupId===g.id?"white":c.muted,outline:`1.5px solid ${groupId===g.id?c.p:c.border}`}}>{g.name}</button>)}
        </div>
      </div>
      {group&&<SplitExpenseForm theme={theme} lang={lang} group={group} splitExpenses={splitExpenses}
        prefill={{description:extractMerchant(tx.desc),amount:Math.abs(tx.amount),date:tx.date,linkedTxId:tx.id}}
        onSave={exp=>{onSave(exp);onClose();}} onCancel={onClose}/>}
    </div>
  </div>;
}

export function SplitsPage({theme,lang,splitGroups,setSplitGroups,splitExpenses,setSplitExpenses,settlements,setSettlements,transactions,onMarkReimbursed,showToastFn}){
  const{c,font:f}=theme;const isMobile=useIsMobile();
  const[subView,setSubView]=useState("groups");
  const[activeGroupId,setActiveGroupId]=useState(()=>splitGroups[0]?.id||null);
  const[newGroupName,setNewGroupName]=useState("");
  const[newParticipant,setNewParticipant]=useState({});
  const[showAddExp,setShowAddExp]=useState(false);
  const[showTxPicker,setShowTxPicker]=useState(false);
  const[txSearch,setTxSearch]=useState("");
  const[txPrefill,setTxPrefill]=useState(null);

  const activeGroup=splitGroups.find(g=>g.id===activeGroupId)||splitGroups[0]||null;
  const groupExps=activeGroup?splitExpenses.filter(e=>e.groupId===activeGroup.id):[];
  const groupSettlements=activeGroup?settlements.filter(s=>s.groupId===activeGroup.id):[];

  const pendingTransfers=useMemo(()=>activeGroup?computeMinSettlements(activeGroup.participants,groupExps):[]
    ,[activeGroup,groupExps]);

  const netBalances=useMemo(()=>{
    if(!activeGroup)return{};
    const bal={};activeGroup.participants.forEach(p=>bal[p]=0);
    groupExps.forEach(exp=>{
      bal[exp.paidBy]=(bal[exp.paidBy]||0)+exp.amount;
      Object.entries(exp.splits||{}).forEach(([p,s])=>{bal[p]=(bal[p]||0)-s;});
    });
    return bal;
  },[activeGroup,groupExps]);

  const addGroup=()=>{if(!newGroupName.trim())return;
    const g={id:Date.now()+Math.random(),name:newGroupName.trim(),participants:[]};
    setSplitGroups(gs=>[...gs,g]);setActiveGroupId(g.id);setNewGroupName("");
  };
  const addParticipant=gid=>{const name=(newParticipant[gid]||"").trim();if(!name)return;
    setSplitGroups(gs=>gs.map(g=>g.id===gid?{...g,participants:[...g.participants.filter(p=>p!==name),name]}:g));
    setNewParticipant(p=>({...p,[gid]:""}));
  };

  const linkedTxIds=new Set(splitExpenses.filter(e=>e.linkedTxId).map(e=>e.linkedTxId));
  const availableTxns=transactions.filter(t=>t.amount<0&&!linkedTxIds.has(t.id));
  const filteredTxns=txSearch?availableTxns.filter(t=>t.desc.toLowerCase().includes(txSearch.toLowerCase())||extractMerchant(t.desc).toLowerCase().includes(txSearch.toLowerCase())):availableTxns.slice(0,20);

  const markSettlementPaid=tr=>{
    setSettlements(ss=>[...ss,{id:Date.now()+Math.random(),groupId:activeGroup.id,...tr,paid:true,date:new Date().toISOString().split("T")[0]}]);
    const incoming=transactions.find(t=>t.amount>0&&Math.abs(t.amount-tr.amount)/tr.amount<0.02);
    if(incoming)showToastFn(lang==="es"?`💡 Ingreso de €${incoming.amount.toFixed(2)} podría ser este reembolso — vincúlalo en Movimientos`:`💡 Incoming €${incoming.amount.toFixed(2)} may match — link it in Transactions`,"info");
    else showToastFn(lang==="es"?"✅ Pago registrado":"✅ Settlement marked paid");
  };

  const subTabs=[{id:"groups",e:"👥",label:lang==="es"?"Grupos":"Groups"},{id:"expenses",e:"🧾",label:lang==="es"?"Gastos":"Expenses"},{id:"balances",e:"⚖️",label:lang==="es"?"Balances":"Balances"}];

  const maxBal=Math.max(...Object.values(netBalances).map(Math.abs),0.01);

  return<div style={{maxWidth:"660px",fontFamily:f}}>
    <h2 style={{color:c.text,marginBottom:4,fontSize:"22px",fontWeight:800}}>✂️ {lang==="es"?"Splits":"Splits"}</h2>
    <p style={{color:c.muted,fontSize:"13px",marginBottom:18}}>{lang==="es"?"Divide gastos entre amigos y calcula quién debe qué.":"Split bills with friends and settle up easily."}</p>
    {/* Sub-nav */}
    <div style={{display:"flex",gap:"4px",marginBottom:20,background:c.pl,borderRadius:"12px",padding:"4px"}}>
      {subTabs.map(tab=><button key={tab.id} onClick={()=>setSubView(tab.id)}
        style={{flex:1,padding:"8px 4px",borderRadius:"9px",border:"none",cursor:"pointer",fontFamily:f,fontWeight:700,fontSize:"12px",transition:"all 0.15s",
          background:subView===tab.id?c.p:"transparent",color:subView===tab.id?"white":c.muted}}>
        {tab.e} {!isMobile&&tab.label}
      </button>)}
    </div>
    {/* Group pill selector (expenses + balances) */}
    {subView!=="groups"&&splitGroups.length>0&&<div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:16}}>
      {splitGroups.map(g=><button key={g.id} onClick={()=>setActiveGroupId(g.id)}
        style={{padding:"5px 14px",borderRadius:"16px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:f,
          background:activeGroupId===g.id?c.p:"transparent",color:activeGroupId===g.id?"white":c.muted,outline:`1.5px solid ${activeGroupId===g.id?c.p:c.border}`}}>
        {g.name} <span style={{opacity:0.6}}>({g.participants.length})</span>
      </button>)}
    </div>}

    {/* ── GROUPS ── */}
    {subView==="groups"&&<>
      <div style={{background:c.card,borderRadius:"14px",padding:"16px 20px",border:`1.5px dashed ${c.border}`,marginBottom:16}}>
        <div style={{fontSize:"13px",fontWeight:700,color:c.text,marginBottom:10}}>+ {lang==="es"?"Nuevo grupo":"New group"}</div>
        <div style={{display:"flex",gap:"8px"}}>
          <input value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addGroup()}
            placeholder={lang==="es"?"Nombre (ej: Viaje a Roma)":"Name (e.g. Rome trip)"}
            style={{flex:1,padding:"9px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white"}}/>
          <button onClick={addGroup} style={{padding:"9px 18px",borderRadius:"10px",border:"none",background:c.p,color:"white",cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:f}}>
            {lang==="es"?"Crear":"Create"}
          </button>
        </div>
      </div>
      {splitGroups.length===0&&<div style={{textAlign:"center",color:c.muted,padding:"32px",fontSize:"14px"}}>
        {lang==="es"?"Sin grupos — crea uno arriba 👆":"No groups yet — create one above 👆"}
      </div>}
      {splitGroups.map(g=><div key={g.id} style={{background:c.card,borderRadius:"14px",padding:"16px 20px",border:`1.5px solid ${c.border}`,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontWeight:800,fontSize:"15px",color:c.text}}>{g.name}</div>
          <button onClick={()=>{setSplitGroups(gs=>gs.filter(x=>x.id!==g.id));setSplitExpenses(es=>es.filter(e=>e.groupId!==g.id));setSettlements(ss=>ss.filter(s=>s.groupId!==g.id));}}
            style={{background:"transparent",border:"none",color:c.muted,cursor:"pointer",fontSize:"13px",fontFamily:f}}>{lang==="es"?"Eliminar":"Delete"}</button>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:10}}>
          {g.participants.map(p=><span key={p} style={{display:"flex",alignItems:"center",gap:"5px",padding:"4px 10px",borderRadius:"16px",background:c.pl,fontSize:"12px",fontWeight:600,color:c.p}}>
            {p}
            <button onClick={()=>setSplitGroups(gs=>gs.map(x=>x.id===g.id?{...x,participants:x.participants.filter(pp=>pp!==p)}:x))}
              style={{background:"transparent",border:"none",color:c.muted,cursor:"pointer",fontSize:"10px",padding:0,lineHeight:1}}>✕</button>
          </span>)}
          {!g.participants.length&&<span style={{color:c.muted,fontSize:"12px"}}>{lang==="es"?"Sin participantes":"No participants yet"}</span>}
        </div>
        <div style={{display:"flex",gap:"8px"}}>
          <input value={newParticipant[g.id]||""} onChange={e=>setNewParticipant(p=>({...p,[g.id]:e.target.value}))}
            onKeyDown={e=>e.key==="Enter"&&addParticipant(g.id)}
            placeholder={lang==="es"?"Añadir persona (ej: Ana)":"Add person (e.g. Ana)"}
            style={{flex:1,padding:"7px 10px",borderRadius:"9px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white"}}/>
          <button onClick={()=>addParticipant(g.id)} style={{padding:"7px 16px",borderRadius:"9px",border:"none",background:c.p,color:"white",cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:f}}>+</button>
        </div>
      </div>)}
    </>}

    {/* ── EXPENSES ── */}
    {subView==="expenses"&&<>
      {!activeGroup&&<div style={{textAlign:"center",color:c.muted,padding:"32px",fontSize:"14px"}}>{lang==="es"?"Crea un grupo primero":"Create a group first"}</div>}
      {activeGroup&&<>
        {!showAddExp&&!showTxPicker&&<div style={{display:"flex",gap:"8px",marginBottom:16,flexWrap:"wrap"}}>
          <button onClick={()=>{setShowAddExp(true);setTxPrefill(null);}} style={{flex:1,minWidth:"140px",padding:"10px",borderRadius:"10px",border:"none",background:c.p,color:"white",cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:f}}>
            + {lang==="es"?"Nuevo gasto":"New expense"}
          </button>
          {transactions.length>0&&<button onClick={()=>{setShowTxPicker(true);setShowAddExp(false);}} style={{flex:1,minWidth:"140px",padding:"10px",borderRadius:"10px",border:`1.5px solid ${c.border}`,background:"white",color:c.p,cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:f}}>
            📂 {lang==="es"?"Desde movimientos":"From transactions"}
          </button>}
        </div>}
        {showAddExp&&<div style={{background:c.card,borderRadius:"14px",padding:"16px 20px",border:`1.5px solid ${c.p}30`,marginBottom:16}}>
          <div style={{fontWeight:700,color:c.text,fontSize:"14px",marginBottom:12}}>🧾 {lang==="es"?"Nuevo gasto":"New expense"}</div>
          <SplitExpenseForm theme={theme} lang={lang} group={activeGroup} splitExpenses={splitExpenses} prefill={txPrefill||{}}
            onSave={exp=>{setSplitExpenses(es=>[...es,exp]);setShowAddExp(false);setTxPrefill(null);}}
            onCancel={()=>{setShowAddExp(false);setTxPrefill(null);}}/>
        </div>}
        {showTxPicker&&<div style={{background:c.card,borderRadius:"14px",padding:"16px 20px",border:`1.5px solid ${c.border}`,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontWeight:700,color:c.text,fontSize:"14px"}}>📂 {lang==="es"?"Elige un movimiento":"Pick a transaction"}</div>
            <button onClick={()=>setShowTxPicker(false)} style={{background:"transparent",border:"none",color:c.muted,cursor:"pointer",fontSize:"18px"}}>✕</button>
          </div>
          <input value={txSearch} onChange={e=>setTxSearch(e.target.value)} placeholder={lang==="es"?"Buscar…":"Search…"}
            style={{width:"100%",padding:"8px 12px",borderRadius:"9px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white",marginBottom:10}}/>
          <div style={{maxHeight:"220px",overflowY:"auto"}}>
            {filteredTxns.map(t=><div key={t.id} onClick={()=>{setTxPrefill({description:extractMerchant(t.desc),amount:Math.abs(t.amount),date:t.date,linkedTxId:t.id});setShowTxPicker(false);setShowAddExp(true);}}
              style={{padding:"9px 12px",borderRadius:"9px",cursor:"pointer",marginBottom:4,display:"flex",justifyContent:"space-between",alignItems:"center",border:`1px solid ${c.border}`,background:"white"}}
              onMouseEnter={e=>e.currentTarget.style.background=c.pl} onMouseLeave={e=>e.currentTarget.style.background="white"}>
              <div><div style={{fontWeight:600,fontSize:"13px",color:c.text}}>{extractMerchant(t.desc)}</div><div style={{fontSize:"11px",color:c.muted}}>{fmtShort(t.date)}</div></div>
              <div style={{fontWeight:700,color:c.danger,fontSize:"13px"}}>-{fmt(Math.abs(t.amount))}</div>
            </div>)}
            {!filteredTxns.length&&<div style={{color:c.muted,fontSize:"13px",textAlign:"center",padding:"16px"}}>{lang==="es"?"Sin movimientos disponibles":"No available transactions"}</div>}
          </div>
        </div>}
        {!groupExps.length&&!showAddExp&&!showTxPicker&&<div style={{textAlign:"center",color:c.muted,padding:"32px",fontSize:"14px"}}>{lang==="es"?"Sin gastos en este grupo":"No expenses yet"}</div>}
        {groupExps.map(exp=>{
          const linkedTx=exp.linkedTxId?transactions.find(t=>t.id===exp.linkedTxId):null;
          return<div key={exp.id} style={{background:c.card,borderRadius:"12px",padding:"14px 18px",marginBottom:8,border:`1.5px solid ${c.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:"14px",color:c.text}}>{exp.description}</div>
                <div style={{fontSize:"11px",color:c.muted,marginTop:2}}>{fmtShort(exp.date)} · {lang==="es"?"Pagó":"Paid by"} <strong>{exp.paidBy}</strong></div>
                {linkedTx&&<div style={{fontSize:"10px",color:c.p,marginTop:2,fontWeight:600}}>🔗 {lang==="es"?"Vinculado a movimiento":"Linked to transaction"}</div>}
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontWeight:800,fontSize:"15px",color:c.text}}>€{exp.amount.toFixed(2)}</div>
                <button onClick={()=>setSplitExpenses(es=>es.filter(e=>e.id!==exp.id))} style={{background:"transparent",border:"none",color:c.muted,cursor:"pointer",fontSize:"11px",fontFamily:f}}>{lang==="es"?"Eliminar":"Delete"}</button>
              </div>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:"5px",marginTop:8}}>
              {Object.entries(exp.splits||{}).map(([p,s])=><span key={p} style={{fontSize:"11px",padding:"2px 8px",borderRadius:"10px",background:c.pl,color:c.p,fontWeight:600}}>{p}: €{(+s).toFixed(2)}</span>)}
            </div>
          </div>;
        })}
      </>}
    </>}

    {/* ── BALANCES ── */}
    {subView==="balances"&&<>
      {!activeGroup&&<div style={{textAlign:"center",color:c.muted,padding:"32px",fontSize:"14px"}}>{lang==="es"?"Crea un grupo primero":"Create a group first"}</div>}
      {activeGroup&&!groupExps.length&&<div style={{textAlign:"center",color:c.muted,padding:"32px",fontSize:"14px"}}>{lang==="es"?"Añade gastos para ver los balances":"Add expenses to see balances"}</div>}
      {activeGroup&&groupExps.length>0&&<>
        <div style={{background:c.card,borderRadius:"14px",padding:"16px 20px",border:`1.5px solid ${c.border}`,marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:"14px",color:c.text,marginBottom:12}}>{lang==="es"?"Balance neto":"Net balance"}</div>
          {Object.entries(netBalances).sort((a,b)=>b[1]-a[1]).map(([p,b])=><div key={p} style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:8}}>
            <span style={{flex:1,fontWeight:600,fontSize:"13px",color:c.text}}>{p}</span>
            <div style={{width:"100px",height:"6px",borderRadius:"3px",background:c.pl,overflow:"hidden",position:"relative"}}>
              <div style={{position:"absolute",height:"100%",width:`${Math.abs(b)/maxBal*100}%`,background:b>=0?"#10b981":c.danger,borderRadius:"3px",
                left:b>=0?"50%":"auto",right:b<0?"50%":"auto"}}/>
            </div>
            <span style={{fontWeight:700,fontSize:"13px",color:b>=0?"#10b981":c.danger,width:"68px",textAlign:"right"}}>{b>=0?"+":""}€{b.toFixed(2)}</span>
          </div>)}
        </div>
        <div style={{background:c.card,borderRadius:"14px",padding:"16px 20px",border:`1.5px solid ${c.border}`}}>
          <div style={{fontWeight:700,fontSize:"14px",color:c.text,marginBottom:12}}>💸 {lang==="es"?"Ajuste de cuentas":"Settle up"}</div>
          {!pendingTransfers.length&&<div style={{color:"#10b981",fontWeight:700,fontSize:"13px",textAlign:"center",padding:"12px"}}>✅ {lang==="es"?"¡Todos en paz!":"All settled!"}</div>}
          {pendingTransfers.map((tr,i)=>{
            const paid=groupSettlements.some(s=>s.from===tr.from&&s.to===tr.to&&Math.abs(s.amount-tr.amount)<0.01&&s.paid);
            return<div key={i} style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px 12px",borderRadius:"10px",marginBottom:6,
              background:paid?"#f0fdf4":c.pl,border:`1.5px solid ${paid?"#bbf7d0":c.border}`,opacity:paid?0.7:1}}>
              <div style={{flex:1,fontSize:"13px"}}>
                <strong style={{color:c.text}}>{tr.from}</strong>
                <span style={{color:c.muted,margin:"0 6px"}}>→</span>
                <strong style={{color:c.text}}>{tr.to}</strong>
                <span style={{fontWeight:800,color:c.p,marginLeft:8}}>€{tr.amount.toFixed(2)}</span>
              </div>
              {paid?<span style={{fontSize:"11px",color:"#15803d",fontWeight:700}}>✓ {lang==="es"?"Pagado":"Paid"}</span>
                :<button onClick={()=>markSettlementPaid(tr)} style={{padding:"5px 12px",borderRadius:"8px",border:"none",background:c.p,color:"white",cursor:"pointer",fontSize:"11px",fontWeight:700,fontFamily:f}}>
                  {lang==="es"?"Marcar pagado":"Mark paid"}
                </button>}
            </div>;
          })}
        </div>
      </>}
    </>}
  </div>;
}
