import { useState, useEffect, useCallback } from "react";
import { FONT_URL, THEMES, THEME_W_ES, T } from "./utils/constants.js";
import { useCategories } from "./hooks/useCategories.js";
import { useBudgets } from "./hooks/useBudgets.js";
import { useExport } from "./hooks/useExport.js";
import { useTransactions } from "./hooks/useTransactions.js";
import { useIsMobile } from "./hooks/useIsMobile.js";
import { useAppData } from "./hooks/useAppData.js";
import { DataPage } from "./components/Upload.jsx";
import { Dashboard } from "./components/Dashboard.jsx";
import { Toast } from "./components/Toast.jsx";
import { Onboarding } from "./components/Onboarding.jsx";
import { SubscriptionVerify, AutoPayPage } from "./components/Subscriptions.jsx";
import { CategoryReview } from "./components/CategoryReview.jsx";
import { BudgetWizard, BudgetsPage } from "./components/Budget.jsx";
import { RemindersPage } from "./components/Reminders.jsx";
import { SplitsPage, SplitModal } from "./components/Splits.jsx";

export default function App() {
  const [onboarded,setOnboarded]       = useState(false);
  const [user,setUser]                 = useState(null);
  const [page,setPage]                 = useState("dashboard");
  const [timeFilter,setTimeFilter]     = useState("month");
  const [compareMode,setCompareMode]   = useState(false);
  const [customRange,setCustomRange]   = useState({start:"",end:""});
  const { budgets, setBudgets, catGroups, setCatGroups, showBudgetWiz, setShowBudgetWiz } = useBudgets();
  const { customCats, setCustomCats, merchantMemory, setMerchantMemory, updateMemory, clearMemory } = useCategories();
  const [reminders,setReminders]       = useState([]);
  const [autoPayments,setAutoPayments] = useState([]);
  const [toast,setToast]               = useState(null);
  const [widgetConfig,setWidgetConfig]     = useState([]);
  const [lang,setLang]                     = useState("es");
  const [splitGroups,setSplitGroups]       = useState([]);
  const [splitExpenses,setSplitExpenses]   = useState([]);
  const [settlements,setSettlements]       = useState([]);
  const [splitTxModal,setSplitTxModal]     = useState(null);

  useEffect(()=>{const s=document.createElement("style");s.textContent=`@import url('${FONT_URL}');*{box-sizing:border-box;margin:0;padding:0}body,#root{margin:0;padding:0;overscroll-behavior-y:none}@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes pop{0%{opacity:0;transform:scale(0.88)}100%{opacity:1;transform:scale(1)}}@keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.18);border-radius:3px}`;document.head.appendChild(s);return()=>s.remove();},[]);

  const showToast=(msg,type="success")=>setToast({msg,type});

  const { transactions, comments, reimbursed, modalSteps, detectedSubs, unknownTxns, showSubVerify, showCatReview, handleUpload, handleSubDone, handleCatDone, onCatChange, onCommentSave, onMarkReimbursed } = useTransactions({ updateMemory, setMerchantMemory, setCustomCats, setBudgets, setShowBudgetWiz, setAutoPayments, setReminders, setWidgetConfig, setUser, setLang, setSplitGroups, setSplitExpenses, setSettlements, showToast, setPage, user, merchantMemory, autoPayments });
  const onAddReminder=useCallback(r=>setReminders(rs=>[...rs,r]),[]);
  const { handleExport } = useExport({ transactions, comments, autoPayments, reminders, budgets, customCats, widgetConfig, splitGroups, splitExpenses, settlements, user, lang });
  const isMobile=useIsMobile();

  if(!onboarded)return <Onboarding onDone={u=>{
    setUser(u);
    setOnboarded(true);
    const ul=u.lang||"es";
    setLang(ul);
    if(u.quickStart) setPage("data");
    const goalLabelsEs={save:"🎯 Meta: Ahorrar para algo",cut:"🎯 Meta: Gastar menos",know:"🎯 Meta: Entender mis gastos",chill:"🎯 Meta: Solo explorando"};
    const goalLabelsEn={save:"🎯 Goal: Save for something",cut:"🎯 Goal: Cut my spending",know:"🎯 Goal: Understand my money",chill:"🎯 Goal: Just exploring"};
    const goalLabels=ul==="es"?goalLabelsEs:goalLabelsEn;
    const today=new Date().toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric"});
    setReminders([{id:Date.now(),text:`${goalLabels[u.goal]||"🎯 Goal set"} — ${ul==="es"?"registrado el":"set on"} ${today}`,done:false,repeat:"once"}]);
  }}/>;

  const theme=THEMES[user?.themeId]||THEMES.nature;
  const w_eff=lang==="es"?(THEME_W_ES[theme.id]||theme.w):theme.w;
  const effectiveTheme={...theme,w:w_eff};
  const{c,font:f}=effectiveTheme;const w=w_eff;
  const tr=T[lang]||T.en;
  const { allCats, uncategorizedCount, filtered, compFiltered, totalInc, totalExp, net, biggestExp, catData, paymentsWithCountdown, budgetWarnings, subStepIdx, catStepIdx, budStepIdx } = useAppData({ transactions, reimbursed, autoPayments, budgets, timeFilter, customRange, customCats, modalSteps });

  const NAV=[{id:"dashboard",e:theme.emoji,label:w.home},{id:"budgets",e:"🎯",label:tr.budgets},{id:"reminders",e:"📋",label:tr.reminders},{id:"payments",e:"💳",label:tr.autoPay},{id:"splits",e:"✂️",label:"Splits"},{id:"data",e:"📂",label:tr.data}];

  return <div style={{minHeight:"100vh",background:theme.grad,fontFamily:f,color:c.text,paddingBottom:0}}>
    {/* ── Desktop top nav ── */}
    {!isMobile&&<nav style={{background:c.nav,padding:"10px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 14px rgba(0,0,0,0.18)"}}>
      <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
        <span style={{fontSize:"30px"}}>{user?.avatar}</span>
        <div><div style={{color:c.navT,fontWeight:800,fontSize:"15px",fontFamily:f}}>{user?.name}'s {w.home}</div><div style={{color:"rgba(255,255,255,0.4)",fontSize:"10px"}}>{theme.emoji} {theme.name} · Moneda 💸</div></div>
      </div>
      <div style={{display:"flex",gap:"2px"}}>
        {NAV.map(({id,e,label})=><button key={id} onClick={()=>setPage(id)} style={{background:page===id?"rgba(255,255,255,0.2)":"transparent",border:"none",borderRadius:"10px",padding:"6px 10px",cursor:"pointer",color:page===id?"white":"rgba(255,255,255,0.55)",fontFamily:f,fontWeight:600,fontSize:"10px",display:"flex",flexDirection:"column",alignItems:"center",gap:"1px",transition:"all 0.15s",minHeight:44}}><span style={{fontSize:"20px"}}>{e}</span>{label}</button>)}
      </div>
    </nav>}
    {/* ── Mobile compact top header ── */}
    {isMobile&&<header style={{background:c.nav,padding:"10px 16px",display:"flex",alignItems:"center",gap:"10px",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 14px rgba(0,0,0,0.18)"}}>
      <span style={{fontSize:"26px"}}>{user?.avatar}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:c.navT,fontWeight:800,fontSize:"14px",fontFamily:f,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user?.name}'s {w.home}</div>
        <div style={{color:"rgba(255,255,255,0.4)",fontSize:"10px"}}>{theme.emoji} Moneda 💸</div>
      </div>
    </header>}
    {/* ── Main content ── */}
    <div style={{paddingTop:isMobile?"16px":"26px",paddingLeft:isMobile?"12px":"24px",paddingRight:isMobile?"12px":"24px",paddingBottom:isMobile?"calc(72px + env(safe-area-inset-bottom, 0px))":"26px",maxWidth:"1080px",margin:"0 auto"}}>
      {uncategorizedCount>0&&<div style={{background:"#fef3c7",border:"1.5px solid #f59e0b",borderRadius:"12px",padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:"10px",fontFamily:f}}>
        <span style={{fontSize:"20px"}}>⚠️</span>
        <span style={{fontWeight:700,color:"#92400e",fontSize:"13px"}}>{lang==="es"?`${uncategorizedCount} gasto${uncategorizedCount!==1?"s":""} sin categoría — abre Datos → Ver log completo y asígnalos`:`${uncategorizedCount} uncategorized expense${uncategorizedCount!==1?"s":""} — open Data → View full log and assign their categories`}</span>
      </div>}
      {page==="dashboard"&&<Dashboard {...{theme:effectiveTheme,timeFilter,setTimeFilter,compareMode,setCompareMode,customRange,setCustomRange,filtered,compFiltered,totalInc,totalExp,net,biggestExp,catData,budgetWarnings,paymentsWithCountdown,reminders,setReminders,transactions,comments,onCommentSave,onCatChange,hasData:transactions.length>0,onAddReminder,allCats,reimbursed,onMarkReimbursed,budgets,widgetConfig,setWidgetConfig,onExport:handleExport,lang,onSplitTx:setSplitTxModal,splitExpenses}}/>}
      {page==="budgets"  &&<BudgetsPage {...{theme:effectiveTheme,budgets,setBudgets,catGroups,setCatGroups,allTransactions:transactions,allCats,lang}}/>}
      {page==="reminders"&&<RemindersPage {...{theme:effectiveTheme,reminders,setReminders,lang}}/>}
      {page==="payments" &&<AutoPayPage {...{theme:effectiveTheme,autoPayments,setAutoPayments,paymentsWithCountdown,lang}}/>}
      {page==="splits"   &&<SplitsPage {...{theme:effectiveTheme,lang,splitGroups,setSplitGroups,splitExpenses,setSplitExpenses,settlements,setSettlements,transactions,onMarkReimbursed,showToastFn:showToast}}/>}
      {page==="data"     &&<DataPage {...{theme:effectiveTheme,transactions,onUpload:handleUpload,onCatChange,comments,onCommentSave,onAddReminder,allCats,reimbursed,onMarkReimbursed,merchantMemory,onClearMemory:()=>{clearMemory();showToast(lang==="es"?"Memoria borrada":"Memory cleared","info");},onExport:handleExport,lang}}/>}
    </div>
    {/* ── Mobile bottom tab bar ── */}
    {isMobile&&<nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:200,background:c.nav,borderTop:"1px solid rgba(255,255,255,0.12)",display:"flex",paddingBottom:"env(safe-area-inset-bottom, 0px)",boxShadow:"0 -2px 14px rgba(0,0,0,0.22)"}}>
      {NAV.map(({id,e,label})=><button key={id} onClick={()=>setPage(id)} style={{flex:1,background:"transparent",border:"none",borderTop:page===id?`2.5px solid white`:"2.5px solid transparent",padding:"8px 4px 6px",cursor:"pointer",color:page===id?"white":"rgba(255,255,255,0.5)",fontFamily:f,fontWeight:600,fontSize:"10px",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",minHeight:"56px",transition:"color 0.15s,border-color 0.15s"}}>
        <span style={{fontSize:"22px",lineHeight:1}}>{e}</span>
        <span style={{letterSpacing:0.3}}>{label}</span>
      </button>)}
    </nav>}
    {showSubVerify&&detectedSubs.length>0&&<SubscriptionVerify theme={effectiveTheme} subs={detectedSubs} steps={modalSteps} stepIndex={subStepIdx} onDone={handleSubDone} lang={lang}/>}
    {showCatReview&&unknownTxns.length>0&&<CategoryReview theme={effectiveTheme} unknowns={unknownTxns} customCats={customCats} steps={modalSteps} stepIndex={catStepIdx} onDone={handleCatDone} lang={lang}/>}
    {showBudgetWiz&&<BudgetWizard theme={effectiveTheme} steps={modalSteps} stepIndex={budStepIdx} onDone={lims=>{setBudgets(lims);setShowBudgetWiz(false);showToast(lang==="es"?"¡Presupuestos guardados! 🎯":"Budgets saved! 🎯");}} lang={lang}/>}
    {splitTxModal&&<SplitModal theme={effectiveTheme} lang={lang} tx={splitTxModal} splitGroups={splitGroups} splitExpenses={splitExpenses}
      onSave={exp=>setSplitExpenses(es=>[...es,exp])} onClose={()=>setSplitTxModal(null)}/>}
    {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
  </div>;
}
