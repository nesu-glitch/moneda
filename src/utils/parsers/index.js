import * as XLSX from "xlsx";
import { sanitizeCellValue } from "../sanitize.js";
import { categorise } from "../categories.js";

// ── Amount parser: handles European (1.234,56) and Anglo (1,234.56) formats ──
export function parseEuroAmount(raw) {
  if(raw===null||raw===undefined||raw==="")return NaN;
  let s=String(raw).trim().replace(/[€$£\s ]/g,"").replace(/[−–]/g,"-");
  if(/\d\.\d{3},/.test(s))return parseFloat(s.replace(/\./g,"").replace(",","."));
  if(/,\d{1,2}$/.test(s)&&!/\./.test(s))return parseFloat(s.replace(",","."));
  return parseFloat(s.replace(",",""));
}
// ── Date parser: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, Date objects, datetime strings ──
export function parseFlexDate(raw) {
  if(!raw)return null;
  if(raw instanceof Date&&!isNaN(raw))return raw.toISOString().split("T")[0];
  const s=String(raw).trim().split(" ")[0].split("T")[0];
  let m=s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if(m)return`${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  m=s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if(m)return`${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;
  return null;
}

export function parseBankExport(data) {
  const wb=XLSX.read(data,{type:"array",cellDates:true}),ws=wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:"",raw:false});
  if(!rows.length)return{txns:[],comments:{}};

  // ── Detect Moneda re-upload (our own export format) ──────────────────────
  const h0=rows[0].map(c=>String(c).toLowerCase().trim());
  const isMoneda=h0.includes("fecha")&&h0.includes("descripción")&&h0.includes("categoría")&&h0.includes("importe");
  if(isMoneda){
    const fI=h0.indexOf("fecha"),dI=h0.indexOf("descripción"),cI=h0.indexOf("categoría");
    const aI=h0.indexOf("importe"),cmI=h0.indexOf("comentario");
    const txns=[],comments={};
    for(let i=1;i<rows.length;i++){
      const row=rows[i];if(!row||row.every(c=>!c))continue;
      const date=String(row[fI]||"").trim();
      const desc=sanitizeCellValue(String(row[dI]||"").trim());
      const cat=sanitizeCellValue(String(row[cI]||"").trim())||null;
      const rawAmt=String(row[aI]||"").trim();
      const comment=cmI>=0?sanitizeCellValue(String(row[cmI]||"").trim()):"";
      let amount=parseFloat(rawAmt.replace(/[€$£\s]/g,"").replace(/[−–]/g,"-").replace(",","."));
      if(isNaN(amount))continue;
      const id=`${date}-${i}`;
      txns.push({id,date,desc,amount:+amount.toFixed(2),cat:cat||null});
      if(comment)comments[id]=comment;
    }
    // Parse extra sheets saved by doExport
    let savedAutoPayments=[],savedReminders=[],savedBudgets={},savedCustomCats=[],savedWidgetConfig=[];
    if(wb.SheetNames.includes("AutoPagos")){const rows=XLSX.utils.sheet_to_json(wb.Sheets["AutoPagos"],{defval:""});savedAutoPayments=rows.map(r=>({id:Date.now()+Math.random(),name:sanitizeCellValue(String(r.Nombre||"").trim()),amount:parseFloat(r.Importe)||0,day:parseInt(r.Dia)||1,month:parseInt(r.Mes)||undefined,frequency:String(r.Frecuencia||"monthly").trim()})).filter(p=>p.name);}
    if(wb.SheetNames.includes("Recordatorios")){const rows=XLSX.utils.sheet_to_json(wb.Sheets["Recordatorios"],{defval:""});savedReminders=rows.map(r=>({id:Date.now()+Math.random(),text:sanitizeCellValue(String(r.Texto||"").trim()),done:String(r.Hecho||"").toLowerCase()==="si",repeat:String(r.Repetir||"once").trim()})).filter(r=>r.text);}
    if(wb.SheetNames.includes("Presupuestos")){const rows=XLSX.utils.sheet_to_json(wb.Sheets["Presupuestos"],{defval:""});rows.forEach(r=>{const cat=String(r.Categoria||"").trim(),limit=parseFloat(r.LimiteMensual)||0;if(cat&&limit>0)savedBudgets[cat]=limit;});}
    if(wb.SheetNames.includes("Config")){const rows=XLSX.utils.sheet_to_json(wb.Sheets["Config"],{defval:""});savedCustomCats=rows.map(r=>sanitizeCellValue(String(r.CategoriaPersonalizada||"").trim())).filter(Boolean);}
    if(wb.SheetNames.includes("Widgets")){const rows=XLSX.utils.sheet_to_json(wb.Sheets["Widgets"],{defval:""});savedWidgetConfig=rows.sort((a,b)=>(+a.Orden||0)-(+b.Orden||0)).map(r=>({id:String(r.Id||"").trim(),label:sanitizeCellValue(String(r.Etiqueta||"").trim()),visible:String(r.Visible||"").toLowerCase()==="si"})).filter(w=>w.id);}
    let savedProfile=null;
    if(wb.SheetNames.includes("_moneda_config")){try{const cell=wb.Sheets["_moneda_config"]["A1"];if(cell&&cell.v)savedProfile=JSON.parse(String(cell.v));}catch(_){}}
    let savedSplits=null;
    if(wb.SheetNames.includes("_splits")){try{const cell=wb.Sheets["_splits"]["A1"];if(cell&&cell.v)savedSplits=JSON.parse(String(cell.v));}catch(_){}}
    return{txns,comments,isMonedaExport:true,savedAutoPayments,savedReminders,savedBudgets,savedCustomCats,savedWidgetConfig,savedProfile,savedSplits};
  }

  // ── Generic Spanish bank (Santander, BBVA, CaixaBank, Bankinter, Sabadell, ING, Unicaja, Kutxabank, Openbank) ──

  // 1. Detect bank from first 8 rows of text
  const topText=rows.slice(0,8).map(r=>r.map(c=>String(c)).join(" ")).join(" ").toLowerCase();
  let detectedBank="your bank";
  if(topText.includes("bbva"))                                       detectedBank="BBVA";
  else if(topText.includes("caixabank")||topText.includes("la caixa")) detectedBank="CaixaBank";
  else if(topText.includes("bankinter"))                             detectedBank="Bankinter";
  else if(topText.includes("sabadell"))                              detectedBank="Sabadell";
  else if(topText.includes("ing direct")||topText.includes("ing españa")||/\bing\b/.test(topText)) detectedBank="ING";
  else if(topText.includes("unicaja"))                               detectedBank="Unicaja";
  else if(topText.includes("kutxabank")||topText.includes("kutxa"))  detectedBank="Kutxabank";
  else if(topText.includes("openbank"))                              detectedBank="Openbank";
  else if(topText.includes("santander"))                             detectedBank="Santander";

  // 2. Bank-specific column keyword overrides
  const BANK_COLS={
    BBVA:      {date:["fecha"],                                        desc:["concepto"],                                                                   debit:["cargo"],                         credit:["abono"]},
    CaixaBank: {date:["data operació","fecha operación","data operacio","fecha operacion"], desc:["descripció","descripción","descripcio","descripcion"],     debit:["càrrecs","cargos","carrecs"],     credit:["abonaments","abonos"]},
    Bankinter: {date:["fecha operación","fecha operacion","fecha"],     desc:["descripción","descripcion","concepto"],                                        amount:["importe"]},
    Sabadell:  {date:["fecha"],                                        desc:["concepto"],                                                                   debit:["cargo"],                         credit:["abono"],   amount:["importe"]},
    ING:       {date:["fecha"],                                        desc:["descripción","descripcion","nombre"],                                          amount:["importe (€)","importe"],         cat:["categoría","categoria"]},
    Unicaja:   {date:["fecha"],                                        desc:["concepto"],                                                                   debit:["cargos"],                        credit:["abonos"]},
    Kutxabank: {date:["fecha valor","fecha"],                           desc:["concepto"],                                                                   debit:["débitos","debitos","cargo"],      credit:["créditos","creditos","abono"]},
    Openbank:  {date:["fecha"],                                        desc:["concepto"],                                                                   amount:["importe"]},
    Santander: {date:["fecha"],                                        desc:["concepto"],                                                                   amount:["importe"]},
  };
  const bankCols=BANK_COLS[detectedBank]||{};

  // 3. Score-based header row detection (scan up to row 30)
  const DATE_KW=["fecha","date","data","fecha operación","fecha valor","fecha operacion","data operació"];
  const DESC_KW=["concepto","descripción","descripcion","descripció","descripcio","nombre","movimiento","detalle","description"];
  const AMT_KW =["importe","amount","cargo","abono","cargos","abonos","débitos","créditos","debitos","creditos","càrrecs","abonaments","importe (€)","valor"];

  let headerRow=-1,bestScore=-1;
  for(let i=0;i<Math.min(rows.length,30);i++){
    const r=rows[i].map(c=>String(c).toLowerCase().trim());
    let score=0;
    for(let j=0;j<r.length;j++){
      const cell=r[j];
      if(DATE_KW.some(k=>cell===k))score+=2; else if(DATE_KW.some(k=>cell.includes(k)))score+=1;
      if(DESC_KW.some(k=>cell===k))score+=2; else if(DESC_KW.some(k=>cell.includes(k)))score+=1;
      if(AMT_KW.some(k=>cell===k)) score+=2; else if(AMT_KW.some(k=>cell.includes(k)))score+=1;
      // +1 bonus when a neighbouring cell looks numeric (suggests this is a real data header)
      const next=String(r[j+1]||"").replace(/[€$£\s]/g,"");
      if(score>0&&/^-?[\d.,]+$/.test(next))score+=1;
    }
    if(score>bestScore){bestScore=score;headerRow=i;}
  }
  if(bestScore<2)headerRow=0; // nothing convincing found — assume row 0

  // 4. Resolve column indices with exact-match priority, then loose contains-match
  const hdr=rows[headerRow].map(c=>String(c).toLowerCase().trim());
  const findCol=(...keys)=>{
    for(const k of keys){const idx=hdr.findIndex(c=>c===k||c.replace(/\s+/g," ")===k);if(idx>=0)return idx;}
    for(const k of keys){const idx=hdr.findIndex(c=>c.includes(k));if(idx>=0)return idx;}
    return -1;
  };

  const dateCol=findCol(...(bankCols.date||[]),"fecha","date","data");
  const descCol=findCol(...(bankCols.desc||[]),"concepto","descripción","descripcion","descripció","nombre","movimiento","detalle");
  const catIngCol=bankCols.cat?findCol(...bankCols.cat):-1;

  // Prefer bank-specific separate debit/credit cols; fall back to single signed amount col
  let debitCol=-1,creditCol=-1,amtCol=-1;
  if(bankCols.debit&&bankCols.credit){
    debitCol=findCol(...bankCols.debit);
    creditCol=findCol(...bankCols.credit);
  }
  if(bankCols.amount){
    amtCol=findCol(...bankCols.amount);
  }
  // Generic fallback when nothing matched yet
  if(debitCol===-1&&creditCol===-1&&amtCol===-1){
    amtCol=findCol("importe","amount","valor");
  }

  // 5–7. Parse data rows
  const txns=[];
  const SKIP_RE=/^(total|saldo|balance|subtotal)\b/i;
  for(let i=headerRow+1;i<rows.length;i++){
    const row=rows[i];
    if(!row||row.every(c=>!String(c).trim()))continue;

    // 6a. Date must parse
    const date=parseFlexDate(dateCol>=0?row[dateCol]:row[0]);
    if(!date)continue;

    // 6b. Skip subtotal/balance rows
    const desc=descCol>=0?sanitizeCellValue(String(row[descCol]||"").trim()):"";
    if(SKIP_RE.test(desc))continue;

    // 3 & 4. Compute amount from debit/credit pair or single signed column
    let amount;
    if(debitCol>=0&&creditCol>=0){
      const dv=parseEuroAmount(row[debitCol]);
      const cv=parseEuroAmount(row[creditCol]);
      if(isNaN(dv)&&isNaN(cv))continue;
      const d=isNaN(dv)?0:dv, cr=isNaN(cv)?0:cv;
      if(d===0&&cr===0)continue;
      amount=+(cr-d).toFixed(2); // credit positive, debit negative
    } else if(amtCol>=0){
      amount=parseEuroAmount(row[amtCol]);
      if(isNaN(amount))continue;
    } else continue;

    // 6c. Skip blank desc + zero amount
    if(!desc&&amount===0)continue;

    // Category: income flag, ING category fallback, then rule-based
    let cat=amount>0?"Income":categorise(desc);
    if(catIngCol>=0&&!cat){
      const ingCat=sanitizeCellValue(String(row[catIngCol]||"").trim());
      if(ingCat)cat=ingCat;
    }

    txns.push({id:`${date}-${i}`,date,desc,amount:+amount.toFixed(2),cat});
  }

  // 7. Return with detected bank name
  return{txns,comments:{},bank:detectedBank};
}
export function doExport(transactions,comments,{autoPayments=[],reminders=[],budgets={},customCats=[],widgetConfig=[],profile={},splitGroups=[],splitExpenses=[],settlements=[]}={}) {
  const wb=XLSX.utils.book_new();
  const data=transactions.map(t=>({Fecha:t.date,Descripción:t.desc,Categoría:t.cat||"",Importe:t.amount,Tipo:t.amount>=0?"Ingreso":"Gasto",Comentario:comments[t.id]||""}));
  const ws=XLSX.utils.json_to_sheet(data);ws["!cols"]=[{wch:12},{wch:45},{wch:16},{wch:10},{wch:10},{wch:40}];
  XLSX.utils.book_append_sheet(wb,ws,"Transacciones");
  if(autoPayments.length>0){const d=autoPayments.map(p=>({Nombre:p.name,Importe:p.amount,Dia:p.day,Mes:p.month||"",Frecuencia:p.frequency}));const w=XLSX.utils.json_to_sheet(d);w["!cols"]=[{wch:20},{wch:10},{wch:6},{wch:6},{wch:12}];XLSX.utils.book_append_sheet(wb,w,"AutoPagos");}
  if(reminders.length>0){const d=reminders.map(r=>({Texto:r.text,Hecho:r.done?"Si":"No",Repetir:r.repeat}));const w=XLSX.utils.json_to_sheet(d);w["!cols"]=[{wch:40},{wch:8},{wch:12}];XLSX.utils.book_append_sheet(wb,w,"Recordatorios");}
  const budgetEntries=Object.entries(budgets).filter(([,v])=>v>0);
  if(budgetEntries.length>0){const d=budgetEntries.map(([cat,limit])=>({Categoria:cat,LimiteMensual:limit}));const w=XLSX.utils.json_to_sheet(d);w["!cols"]=[{wch:16},{wch:14}];XLSX.utils.book_append_sheet(wb,w,"Presupuestos");}
  if(customCats.length>0){const d=customCats.map(cat=>({CategoriaPersonalizada:cat}));const w=XLSX.utils.json_to_sheet(d);w["!cols"]=[{wch:22}];XLSX.utils.book_append_sheet(wb,w,"Config");}
  if(widgetConfig.length>0){const d=widgetConfig.map((wid,i)=>({Id:wid.id,Etiqueta:wid.label,Visible:wid.visible?"Si":"No",Orden:i+1}));const w=XLSX.utils.json_to_sheet(d);w["!cols"]=[{wch:16},{wch:28},{wch:8},{wch:7}];XLSX.utils.book_append_sheet(wb,w,"Widgets");}
  // _moneda_config — single-cell JSON profile snapshot (silent, not visible to user)
  const cfgWs=XLSX.utils.aoa_to_sheet([[JSON.stringify({userName:profile.userName||"",lang:profile.lang||"es",themeId:profile.themeId||"nature",avatar:profile.avatar||"",goal:profile.goal||"know"})]]);
  XLSX.utils.book_append_sheet(wb,cfgWs,"_moneda_config");
  // _splits — split groups, expenses and settlements as JSON
  const splitsWs=XLSX.utils.aoa_to_sheet([[JSON.stringify({splitGroups,splitExpenses,settlements})]]);
  XLSX.utils.book_append_sheet(wb,splitsWs,"_splits");
  XLSX.writeFile(wb,`moneda_${new Date().toISOString().split("T")[0]}.xlsx`);
}
