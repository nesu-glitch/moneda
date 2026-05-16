import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const FONT_URL = "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Cinzel:wght@400;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap";

// ── Themes ────────────────────────────────────────────────────────────────────
const THEMES = {
  nature:    { id:"nature",    name:"Nature",      emoji:"🌿", tagline:"Grow your savings like a garden",      bg:"#f0f7ec", card:"#ffffff", grad:"linear-gradient(160deg,#dff0d8,#f0f7ec 60%)", c:{p:"#4a7c59",pl:"#e2f0db",acc:"#f9c74f",danger:"#d95f0e",text:"#2d4a3e",muted:"#7a9e82",border:"#c5e0b8",nav:"#3a6347",navT:"#ffffff",overlay:"rgba(42,74,56,0.65)"}, font:'"Nunito",sans-serif',       w:{home:"My Grove",    txn:"Gatherings",   budget:"Garden Limit", inc:"Harvest", over:"Over your garden limit 🌱"},  npc:"🦔",npcName:"Hedgie",  chat:["Oh! A rustling in the leaves... 🍃","A new friend has arrived at the grove!","The forest remembers every acorn you spend.","Shall I help you track yours?"],          avatars:["🐸","🦔","🐰","🦋","🐿️","🦉"] },
  adventure: { id:"adventure", name:"Adventure",   emoji:"⚔️", tagline:"Track your gold, conquer your quests", bg:"#fdf6e3", card:"#fffdf5", grad:"linear-gradient(160deg,#fdebd0,#fdf6e3 60%)", c:{p:"#8b5e3c",pl:"#fdebd0",acc:"#d4a017",danger:"#c0392b",text:"#3d1c02",muted:"#a07040",border:"#e8d5b0",nav:"#5c3418",navT:"#ffeeba",overlay:"rgba(60,28,2,0.65)"},   font:'"Cinzel",Georgia,serif',    w:{home:"Map Room",    txn:"Journey Log",  budget:"War Chest",    inc:"Loot",    over:"War chest depleted! ⚔️"},          npc:"🧙",npcName:"Merlin",  chat:["Halt, brave traveler! ⚔️","Many heroes have lost their gold to careless spending.","A wise adventurer tracks every coin.","Are you ready to begin?"],               avatars:["🦊","🐺","🦁","🐉","🧙","🏹"] },
  princess:  { id:"princess",  name:"Princess",    emoji:"👸", tagline:"Rule your royal treasury with grace",  bg:"#fff5f9", card:"#ffffff", grad:"linear-gradient(160deg,#fce4f0,#fff5f9 60%)", c:{p:"#b5478a",pl:"#fce4f0",acc:"#ffd700",danger:"#e74c6d",text:"#5c1f3b",muted:"#9c6080",border:"#f0c0d8",nav:"#8f2a68",navT:"#fff0f8",overlay:"rgba(92,31,59,0.65)"},  font:'"Playfair Display",Georgia,serif', w:{home:"Royal Court",  txn:"Royal Ledger", budget:"Royal Decree", inc:"Tribute", over:"Exceeding royal decree! 👑"},        npc:"🧚",npcName:"Fae",     chat:["Oh my stars! A new arrival! ✨","Welcome to your royal treasury, darling! 👑","Every gem spent and coin saved matters.","Shall we begin your reign?"],            avatars:["👸","🧚","🦄","🌸","🎀","💎"] },
  finance:   { id:"finance",   name:"Finance Pro", emoji:"📊", tagline:"Clean data. Clear decisions.",         bg:"#f8fafc", card:"#ffffff", grad:"#f8fafc",                                      c:{p:"#2563eb",pl:"#dbeafe",acc:"#10b981",danger:"#ef4444",text:"#0f172a",muted:"#64748b",border:"#e2e8f0",nav:"#1e40af",navT:"#ffffff",overlay:"rgba(15,23,42,0.65)"},   font:'"Inter",system-ui,sans-serif',  w:{home:"Overview",    txn:"Transactions", budget:"Allocation",   inc:"Revenue", over:"Budget exceeded ⚠️"},            npc:"🤖",npcName:"Fin",     chat:["Welcome to your finance dashboard.","Your data stays 100% on this device.","Track spending, set budgets, plan ahead.","Let's get started."],                          avatars:["🐻","🦅","🐬","🦉","🐆","🤖"] },
};
const THEMES_TR = {
  nature: {
    en: { name:"Nature", tagline:"Grow your savings like a garden",
      chat:["Oh! A rustling in the leaves... 🍃","A new friend has arrived at the grove!","The forest remembers every acorn you spend.","Shall I help you track yours?"] },
    es: { name:"Naturaleza", tagline:"Haz crecer tus ahorros como un jardín",
      chat:["¡Oh! Un susurro entre las hojas... 🍃","¡Un nuevo amigo ha llegado al jardín!","El bosque recuerda cada bellota que gastas.","¿Te ayudo a llevar la cuenta?"] }
  },
  adventure: {
    en: { name:"Adventure", tagline:"Track your gold, conquer your quests",
      chat:["Halt, brave traveler! ⚔️","Many heroes have lost their gold to careless spending.","A wise adventurer tracks every coin.","Are you ready to begin?"] },
    es: { name:"Aventura", tagline:"Controla tu oro, conquista tus misiones",
      chat:["¡Alto, valiente viajero! ⚔️","Muchos héroes perdieron su oro por gastar sin control.","Un aventurero sabio lleva cuenta de cada moneda.","¿Estás listo para empezar?"] }
  },
  princess: {
    en: { name:"Princess", tagline:"Rule your royal treasury with grace",
      chat:["Oh my stars! A new arrival! ✨","Welcome to your royal treasury, darling! 👑","Every gem spent and coin saved matters.","Shall we begin your reign?"] },
    es: { name:"Princesa", tagline:"Gobierna tu tesoro real con elegancia",
      chat:["¡Cielos! ¡Una nueva llegada! ✨","Bienvenida a tu tesoro real, querida! 👑","Cada gema gastada y moneda ahorrada importa.","¿Comenzamos tu reinado?"] }
  },
  finance: {
    en: { name:"Finance Pro", tagline:"Clean data. Clear decisions.",
      chat:["Welcome to your finance dashboard.","Your data stays 100% on this device.","Track spending, set budgets, plan ahead.","Let's get started."] },
    es: { name:"Finanzas Pro", tagline:"Datos claros. Decisiones claras.",
      chat:["Bienvenida a tu panel financiero.","Tus datos se quedan 100% en este dispositivo.","Controla gastos, fija presupuestos, planifica.","Empecemos."] }
  }
};
const GOALS = [{id:"save",e:"💰",label:"Save for something",sub:"I have a goal in mind"},{id:"cut",e:"✂️",label:"Cut my spending",sub:"I want to spend less"},{id:"know",e:"🔍",label:"Understand my money",sub:"See where it all goes"},{id:"chill",e:"✨",label:"Just exploring",sub:"Curious about finances"}];
const GOALS_TR = {
  en:{save:{label:"Save for something",sub:"I have a goal in mind"},cut:{label:"Cut my spending",sub:"I want to spend less"},know:{label:"Understand my money",sub:"See where it all goes"},chill:{label:"Just exploring",sub:"Curious about finances"}},
  es:{save:{label:"Ahorrar para algo",sub:"Tengo una meta en mente"},cut:{label:"Gastar menos",sub:"Quiero reducir mis gastos"},know:{label:"Entender mis finanzas",sub:"Ver en qué se gasta todo"},chill:{label:"Solo explorando",sub:"Curiosidad financiera"}},
};

// ── Translations ──────────────────────────────────────────────────────────────
const T = {
  en:{
    home:"Overview",budgets:"Budgets",reminders:"Reminders",autoPay:"Auto Pay",data:"Data",
    income:"Income",expenses:"Expenses",net:"Net",biggestExpense:"Biggest expense",
    allTime:"All Time",thisWeek:"This Week",lastWeek:"Last Week",thisMonth:"This Month",lastMonth:"Last Month",
    custom:"Custom",compare:"Compare",
    noData:"No data yet",noDataSub:"Go to the Data tab and upload your bank export.",
    insights:"Insights",topSpend:"Top spend",mostVisited:"Most visited",avgDay:"Avg/day",
    upcomingCharges:"Upcoming charges",noPayments:"No auto payments set",
    inDays:"in",days:"days",day:"day",
    export:"Export Excel",exportBtn:"Download .xlsx",
    journal:"Transactions",noTxns:"No transactions this month",
    spent:"spent",transactions:"transactions",expenses2:"expenses",
    editCat:"Click to edit category",
    addComment:"Add a note…",saveComment:"Save",cancel:"Cancel",
    addReminder:"Reminder",markReimbursed:"Mark reimbursed",
    reimbursedLabel:"Reimbursed",removeReimb:"Remove",
    reason:"Reason (e.g. Maria paid me back half)",
    linkTo:"Link to transaction",searchTxn:"Search for the matching transaction…",
    budgetTitle:"Budget Limits",budgetSub:"Monthly limits per category. Groups let you bundle categories.",
    noLimit:"No limit set",setLimit:"Set limit",edit:"Edit",
    exceeded:"Budget exceeded ⚠️",month:"Month",week:"Week",
    individualLimits:"Individual Limits",weeklyNote:"monthly ÷ 4",
    remindersTitle:"Reminders",remindersSub:"To-dos, one-offs, and recurring nudges",
    newReminder:"+ New reminder",placeholder:"e.g. Take out €200 cash",
    once:"once",weekly:"weekly",monthly:"monthly",addReminderBtn:"Add reminder",
    autoPayTitle:"Auto Payments",autoPaySub:"Recurring charges — know what's coming",
    monthlyCommitments:"Monthly commitments",charges:"charges",
    everyMonth:"every month",everyYear:"every year",
    remove:"remove",addPayment:"Add payment",
    name:"Name (e.g. Spotify)",amount:"€ Amount",dayOfMonth:"Day",
    dataTitle:"Your Data",dataSub:"Upload your bank export",supportedBanks:"Supported banks",
    dropHere:"Drop your bank export here",dropIt:"Drop it!",chooseFile:"Choose file",
    privacyTitle:"100% Private",privacyBody:"Everything parsed in your browser. Nothing sent anywhere. Ever.",
    saveSession:"Save your session",saveSessionBody:"Download your data with all categories and notes. Next time re-upload this file — your classifications will be remembered.",
    dataLoaded:"Data loaded",viewLedger:"View full",
    memoryActive:"Merchant memory active",memoryBody:"merchants remembered — next upload auto-classifies these",
    clearMemory:"Clear",viewMemory:"View",hideMemory:"Hide",rememberedMerchants:"Remembered merchants",
    helpBanks:"Help us support more banks",helpBanksSub:"Is your bank not working? Share an anonymised export sample.",
    warning:"⚠️ Before uploading: open your export in Excel, delete ALL rows with real transactions, and keep ONLY the first header row (column names). Never share real financial data.",
    shareBtn:"📋 Share a sample export →",
    feedbackLink:"💬 Found a bug or have a suggestion? → Open an issue on GitHub",
    subsDetected:"Subscriptions detected",subsSub:"Tick yours & set frequency — some are billed yearly, not monthly.",
    billing:"Billing:",billingMonthly:"🗓 Monthly",billingYearly:"📅 Yearly",
    perMonth:"per month",perYear:"per year",renewsDay:"renews day",detected:"Detected:",
    confirmAutoPay:"Confirm & add to Auto Pay ✓",
    classifyTitle:"Classify merchants",classifyInstruction:"Click a merchant and pick its category",
    classifyActive:"Now tap a category below to assign",
    classifyDrop:"Drop on a category ↓",createCategory:"+ Create new category (e.g. Pets)",
    add:"Add",categories:"Categories",removeUnneeded:"(✕ to remove unneeded)",assigned:"Assigned ✓",
    doneBtn:"Done — save all ✓",leftToClassify:"merchants left to classify",
    budgetWizardTitle:"Set your budgets",budgetWizardSub:"What's your approximate monthly income? We'll suggest smart limits.",
    skipManual:"Skip — set manually →",suggestLimits:"Suggest my limits →",
    adjustTitle:"✏️ Adjust monthly limits",adjustSub:"Based on your income. Change anything that doesn't fit.",
    back:"← Back",saveBudgets:"Save budgets 🎯",
    tutorialTitle:"Quick guide — how Moneda works",
    step1Title:"Download your bank export 🏦",step1Sub:"Log into your bank's website, go to transaction history and download as Excel (.xlsx or .csv). Works with Santander, BBVA, CaixaBank, ING, Bankinter, Sabadell and more.",
    step2Title:"Upload it to Moneda 📂",step2Sub:"Go to the Data tab and drop your file. Moneda reads it instantly — nothing is sent anywhere, everything stays on your device.",
    step3Title:"Classify & customise 🗂️",step3Sub:"We auto-categorise most transactions. You can correct any, set monthly budgets, add reminders and track subscriptions.",
    step4Title:"💾 Save your session before you leave",step4Sub:"Any categories, budgets and reminders you create exist only in this tab. Before closing, go to Data and tap Download .xlsx — next time upload that file to restore everything.",
    gotIt:"Got it — let's go! 🚀",
    spendingTitle:"Spending by category",totalSpentIn:"Total spent in",byMerchant:"By merchant",
    insightsLabel:"Insights",
    categoryGroups:"Category Groups",createGroup:"+ Create category group (e.g. Food = Groceries + Restaurants)",
    newGroup:"New group",groupName:"Group name (e.g. Food)",selectCategories:"Select categories:",
    createGroupBtn:"Create group",removeGroup:"remove group",
    pickLang:"Choose your language",
    welcomeTitle:"Welcome to Moneda",pickWorld:"Pick your world",enterWorld:"Enter this world →",
    quickStart:"⚡ Quick start — just pick a name",selected:"✓ Selected",
    whatsYourName:"What's your name?",nameForDashboard:"Just for your dashboard — no account needed.",
    namePlaceholder:"Your name…",letsGo:"Let's go! 🚀",continueBtn:"Continue →",
    pickCompanion:"Pick your companion",whoJoins:"Who's joining you on this journey?",
    thisIsYou:"This is you!",perfect:"Perfect! →",
    whyHere:"Why are you here?",noWrongAnswers:"No wrong answers",
    startJourney:"Start my journey 🚀",pickOption:"Pick an option above",
    customise:"Customise",customDone:"Done",
    dragReorder:"Drag widgets to reorder, or hide ones you don't need:",
    visible:"Visible",hidden:"Hidden",
    wSummary:"📊 Summary cards",wInsights:"💡 Insights",wBudget:"🎯 Budget",
    wPayments:"💳 Upcoming charges",wSpending:"📊 Spending by category",
    wJournal:"📄 Journal",wIncome:"💰 Income transactions",
    wSubscriptions:"📦 Subscriptions & Recurring",
  },
  es:{
    home:"Inicio",budgets:"Presupuestos",reminders:"Recordatorios",autoPay:"Pagos fijos",data:"Datos",
    income:"Ingresos",expenses:"Gastos",net:"Balance",biggestExpense:"Mayor gasto",
    allTime:"Todo el tiempo",thisWeek:"Esta semana",lastWeek:"Semana pasada",thisMonth:"Este mes",lastMonth:"Mes pasado",
    custom:"Personalizado",compare:"Comparar",
    noData:"Sin datos aún",noDataSub:"Ve a la pestaña Datos y sube el extracto de tu banco.",
    insights:"Resumen",topSpend:"Mayor gasto",mostVisited:"Sitio más frecuente",avgDay:"Media/día",
    upcomingCharges:"Próximos cobros",noPayments:"No hay pagos automáticos",
    inDays:"en",days:"días",day:"día",
    export:"Exportar Excel",exportBtn:"Descargar .xlsx",
    journal:"Movimientos",noTxns:"No hay movimientos este mes",
    spent:"gastado",transactions:"movimientos",expenses2:"gastos",
    editCat:"Clic para editar categoría",
    addComment:"Añade una nota…",saveComment:"Guardar",cancel:"Cancelar",
    addReminder:"Recordatorio",markReimbursed:"Marcar como reembolsado",
    reimbursedLabel:"Reembolsado",removeReimb:"Eliminar",
    reason:"Motivo (ej: María me devolvió la mitad)",
    linkTo:"Vincular con movimiento",searchTxn:"Busca el movimiento correspondiente…",
    budgetTitle:"Límites de presupuesto",budgetSub:"Límites mensuales por categoría. Los grupos permiten agrupar categorías.",
    noLimit:"Sin límite",setLimit:"Poner límite",edit:"Editar",
    exceeded:"Presupuesto superado ⚠️",month:"Mes",week:"Semana",
    individualLimits:"Límites individuales",weeklyNote:"mensual ÷ 4",
    remindersTitle:"Recordatorios",remindersSub:"Tareas, avisos puntuales y recordatorios recurrentes",
    newReminder:"+ Nuevo recordatorio",placeholder:"ej: Sacar €200 en efectivo",
    once:"una vez",weekly:"semanal",monthly:"mensual",addReminderBtn:"Añadir recordatorio",
    autoPayTitle:"Pagos automáticos",autoPaySub:"Cargos recurrentes — sabe siempre lo que viene",
    monthlyCommitments:"Compromisos mensuales",charges:"cargos",
    everyMonth:"cada mes",everyYear:"cada año",
    remove:"eliminar",addPayment:"Añadir pago",
    name:"Nombre (ej: Spotify)",amount:"€ Importe",dayOfMonth:"Día",
    dataTitle:"Tus datos",dataSub:"Sube el extracto de tu banco",supportedBanks:"Bancos compatibles",
    dropHere:"Arrastra aquí el extracto de tu banco",dropIt:"¡Suéltalo!",chooseFile:"Elegir archivo",
    privacyTitle:"100% Privado",privacyBody:"Todo se procesa en tu navegador. Nada se envía a ningún servidor. Nunca.",
    saveSession:"Guarda tu sesión",saveSessionBody:"Descarga tus datos con todas las categorías y notas. La próxima vez sube este archivo y Moneda lo recuperará todo.",
    dataLoaded:"Datos cargados",viewLedger:"Ver todos los",
    memoryActive:"Memoria de comercios activa",memoryBody:"comercios guardados — la próxima subida los clasifica automáticamente",
    clearMemory:"Limpiar",viewMemory:"Ver",hideMemory:"Ocultar",rememberedMerchants:"Comercios recordados",
    helpBanks:"Ayúdanos a añadir más bancos",helpBanksSub:"¿Tu banco no funciona? Comparte una muestra anonimizada.",
    warning:"⚠️ Antes de subir: abre tu extracto en Excel, borra TODAS las filas con movimientos reales y deja SOLO la primera fila con los nombres de las columnas. Nunca compartas datos financieros reales.",
    shareBtn:"📋 Compartir muestra →",
    feedbackLink:"💬 ¿Encontraste un error o tienes una sugerencia? → Abrir issue en GitHub",
    subsDetected:"Suscripciones detectadas",subsSub:"Marca las tuyas y elige la frecuencia — algunas se cobran anualmente.",
    billing:"Facturación:",billingMonthly:"🗓 Mensual",billingYearly:"📅 Anual",
    perMonth:"al mes",perYear:"al año",renewsDay:"se renueva el día",detected:"Detectado:",
    confirmAutoPay:"Confirmar y añadir a Pagos fijos ✓",
    classifyTitle:"Clasificar comercios",classifyInstruction:"Haz click en un gasto y elige su categoría",
    classifyActive:"Ahora elige una categoría para",
    classifyDrop:"Suelta en una categoría ↓",createCategory:"+ Crear nueva categoría (ej: Mascotas)",
    add:"Añadir",categories:"Categorías",removeUnneeded:"(✕ para eliminar las que no necesitas)",assigned:"Asignados ✓",
    doneBtn:"Listo — guardar todo ✓",leftToClassify:"comercios sin clasificar",
    budgetWizardTitle:"Configura tus presupuestos",budgetWizardSub:"¿Cuáles son tus ingresos mensuales aproximados? Te sugeriremos límites.",
    skipManual:"Saltar — lo hago manualmente →",suggestLimits:"Sugerir límites →",
    adjustTitle:"✏️ Ajusta los límites mensuales",adjustSub:"Basados en tus ingresos. Cambia lo que no se ajuste a ti.",
    back:"← Atrás",saveBudgets:"Guardar presupuestos 🎯",
    tutorialTitle:"Guía rápida — cómo funciona Moneda",
    step1Title:"Descarga el extracto de tu banco 🏦",step1Sub:"Entra en la web o app de tu banco, ve al historial de movimientos y descárgalo como Excel (.xlsx o .csv). Compatible con Santander, BBVA, CaixaBank, ING, Bankinter, Sabadell y más.",
    step2Title:"Súbelo a Moneda 📂",step2Sub:"Ve a la pestaña Datos y arrastra tu archivo. Moneda lo lee al instante — nada se envía a ningún servidor, todo queda en tu dispositivo.",
    step3Title:"Clasifica y personaliza 🗂️",step3Sub:"Categorizamos la mayoría de movimientos automáticamente. Puedes corregir cualquiera, poner límites de presupuesto, añadir recordatorios y controlar suscripciones.",
    step4Title:"💾 Guarda tu sesión antes de salir",step4Sub:"Las categorías, presupuestos y recordatorios que crees solo existen en esta pestaña. Antes de cerrar, ve a Datos y pulsa Descargar .xlsx — la próxima vez sube ese archivo y Moneda recuperará todo.",
    gotIt:"¡Entendido — vamos! 🚀",
    spendingTitle:"Gasto por categoría",totalSpentIn:"Total gastado en",byMerchant:"Por comercio",
    insightsLabel:"Resumen",
    categoryGroups:"Grupos de categorías",createGroup:"+ Crear grupo (ej: Alimentación = Supermercado + Restaurantes)",
    newGroup:"Nuevo grupo",groupName:"Nombre del grupo (ej: Alimentación)",selectCategories:"Selecciona categorías:",
    createGroupBtn:"Crear grupo",removeGroup:"eliminar grupo",
    pickLang:"Elige tu idioma",
    welcomeTitle:"Bienvenido a Moneda",pickWorld:"Elige tu mundo",enterWorld:"Entrar en este mundo →",
    quickStart:"⚡ Inicio rápido — solo pon tu nombre",selected:"✓ Seleccionado",
    whatsYourName:"¿Cómo te llamas?",nameForDashboard:"Solo para tu panel — sin registro.",
    namePlaceholder:"Tu nombre…",letsGo:"¡Vamos! 🚀",continueBtn:"Continuar →",
    pickCompanion:"Elige tu acompañante",whoJoins:"¿Quién te acompaña en este viaje?",
    thisIsYou:"¡Este eres tú!",perfect:"¡Perfecto! →",
    whyHere:"¿Por qué estás aquí?",noWrongAnswers:"No hay respuestas incorrectas",
    startJourney:"¡A por ello! 🚀",pickOption:"Elige una opción arriba",
    customise:"Personalizar",customDone:"Hecho",
    dragReorder:"Arrastra los módulos para reordenar u oculta los que no necesitas:",
    visible:"Visible",hidden:"Oculto",
    wSummary:"📊 Resumen",wInsights:"💡 Estadísticas",wBudget:"🎯 Presupuesto",
    wPayments:"💳 Próximos cobros",wSpending:"📊 Gasto por categoría",
    wJournal:"📄 Movimientos",wIncome:"💰 Ingresos",
    wSubscriptions:"📦 Suscripciones y pagos fijos",
  }
};

// ── Category label translations ───────────────────────────────────────────────
const CAT_LABELS = {
  en:{Groceries:"Groceries",Restaurants:"Restaurants",Transport:"Transport",Shopping:"Shopping",Subscriptions:"Subscriptions",Health:"Health",Housing:"Housing",Income:"Income","ATM / Cash":"ATM / Cash",Transfers:"Transfers",Entertainment:"Entertainment",Utilities:"Utilities",Education:"Education",Other:"Other"},
  es:{Groceries:"Supermercado",Restaurants:"Restaurantes",Transport:"Transporte",Shopping:"Compras",Subscriptions:"Suscripciones",Health:"Salud",Housing:"Vivienda",Income:"Ingresos","ATM / Cash":"Efectivo / Cajero",Transfers:"Transferencias",Entertainment:"Ocio",Utilities:"Suministros",Education:"Educación",Other:"Otros"}
};

// ── Spanish theme vocabulary ──────────────────────────────────────────────────
const THEME_W_ES = {
  nature:    {home:"Mi Jardín",   txn:"Movimientos",   budget:"Límite del jardín",inc:"Cosecha", over:"Superaste el límite del jardín 🌱"},
  adventure: {home:"Sala del Mapa",txn:"Diario de viaje",budget:"Cofre de guerra",inc:"Botín",   over:"¡Cofre de guerra agotado! ⚔️"},
  princess:  {home:"Corte Real",  txn:"Libro de cuentas",budget:"Decreto Real",  inc:"Tributo", over:"¡Superando el decreto real! 👑"},
  finance:   {home:"Resumen",     txn:"Transacciones", budget:"Asignación",       inc:"Ingresos",over:"Presupuesto superado ⚠️"},
};

const CC = {Groceries:"#4caf50",Restaurants:"#ff9800",Transport:"#2196f3",Shopping:"#e91e63",Subscriptions:"#9c27b0",Health:"#f44336",Housing:"#795548",Income:"#00bcd4","ATM / Cash":"#607d8b",Transfers:"#ff5722",Entertainment:"#3f51b5",Utilities:"#009688",Education:"#8bc34a",Other:"#9e9e9e"};
let ALL_CATS = Object.keys(CC).filter(k=>k!=="Income");
const RULES = {
  Groceries:["mercadona","lidl","aldi","carrefour","eroski","consum","dia ","leclerc","supermercado","alcampo","hipercor"],
  Restaurants:["restaurante","restaurant","burger","mcdonalds","kfc","pizza","sushi","tapas","cafeteria","bar ","cafe ","starbucks","dunkin","tabaco","estanco","cerveceria","kebab","telepizza","vinos","bodega","honest green","city land","mm31","alliance vendin","sfc doner","bar antigua","casa esteban","maquina ta"],
  Transport:["renfe","metro","bus ","taxi","uber","cabify","bolt","ryanair","vueling","iberia","edreams","parking","gasolinera","bp ","repsol","shell","crtm","emt ","cercanias","estacion de","la estacion"],
  Utilities:["endesa","iberdrola","naturgy","gas natural","agua ","telefonica","movistar","vodafone","orange","internet","electricidad"],
  Subscriptions:["netflix","spotify","hbo","disney","amazon prime","apple one","google one","microsoft","chatgpt","youtube premium","linkedin","notion","adobe","canva"],
  Health:["farmacia","pharmacy","doctor","clinica","hospital","sanitas","adeslas","gym","fitness","crossfit","dentista","dental"],
  Shopping:["amazon","zara","h&m","mango","pull&bear","ikea","pccomponentes","mediamarkt","fnac","el corte ingles","shein","aliexpress","vinted","expnavalu","pidlitacka"],
  Housing:["alquiler","hipoteca","comunidad propietarios","seguro hogar"],
  Education:["ie business","coursera","udemy","edx","libro","libreria","kindle","academia"],
  Entertainment:["cinema","teatro","concierto","museo","steam","playstation","xbox","nintendo"],
  "ATM / Cash":["cajero","atm","efectivo","retirada de efectivo"],
  Transfers:["bizum","transferencia","transfer","revolut","wise","paypal"],
};
const SUB_KW = {netflix:"Netflix",spotify:"Spotify",hbo:"HBO Max",disney:"Disney+","amazon prime":"Amazon Prime","apple one":"Apple One","google one":"Google One",microsoft:"Microsoft 365",chatgpt:"ChatGPT Plus",linkedin:"LinkedIn",adobe:"Adobe CC",notion:"Notion",canva:"Canva"};

// ── Utilities ─────────────────────────────────────────────────────────────────
const fmt  = n=>`€${Math.abs(+n).toFixed(2)}`;
const fmtD = d=>new Date(d).toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric"});
const fmtShort = d=>new Date(d).toLocaleDateString("es-ES",{day:"2-digit",month:"short"});
const NOW  = new Date();

function extractMerchant(desc) {
  if (!desc) return "Unknown";
  const raw = desc.trim();
  // Bizum: extract person name — stop at CONCEPTO or end
  const bizumMatch = raw.match(/BIZUM\s+(?:A FAVOR DE|RECIBIDO DE|DE|ENVIADO A)\s+(.+?)(?:\s+CONCEPTO\b|\s*[-,]|\s{2,}|$)/i);
  if (bizumMatch) { const name=bizumMatch[1].trim().replace(/\s*TARJ\.?.*/i,"").trim(); if(name.length>1) return name.slice(0,36); }
  // Transferencia: extract counterpart name
  const transMatch = raw.match(/(?:TRANSFERENCIA|TRANSFER|DEVOLUCION BIZUM)\s+(?:A|DE|RECIBIDA DE|EMITIDA A)?\s*(.+?)(?:\s*[-,]|\s{2,}|IBAN|ES\d{2}|$)/i);
  if (transMatch) { const name=transMatch[1].trim(); if(name.length>2&&!/^\d/.test(name)) return name.slice(0,36); }
  let s=raw.replace(/^(PAGO MOVIL EN |COMPRA EN |COMPRA |RECIBO |CARGO |PAGO EN |RETIRADA DE EFECTIVO EN |COMPRA INTERNET EN |DEVOLUCION COMPRA EN )/i,"")
            .replace(/,?\s*(MADRID|BARCELONA|ESPAÑA|ES|TARJ\.?.*|TARJETA\s*\d+.*|CO\b.*|COMISION.*|Vilnius.*|LUXEMBOURG.*)$/i,"")
            .replace(/\s*,\s*[A-Z][a-z].*$/,"")  // strip city, Country suffixes
            .trim();
  return s.slice(0,36)||raw.slice(0,20);
}
function categorise(desc) {
  if (!desc) return null;
  const d=desc.toLowerCase();
  for (const [cat,kws] of Object.entries(RULES)) if (kws.some(k=>d.includes(k))) return cat;
  return null;
}
function detectSubscriptions(txns) {
  const found=[],seen=new Set();
  for (const t of txns) {
    if (t.amount>=0) continue;
    const d=t.desc.toLowerCase();
    for (const [key,name] of Object.entries(SUB_KW)) if (d.includes(key)&&!seen.has(key)) { seen.add(key); found.push({key,name,amount:Math.abs(t.amount),day:new Date(t.date).getDate(),date:t.date,txnId:t.id,frequency:"monthly"}); }
  }
  return found;
}
function detectRecurring(txns,alreadyFound) {
  const skipKeys=new Set(alreadyFound.map(s=>s.key));
  const groups={};
  for(const t of txns){if(t.amount>=0)continue;const m=extractMerchant(t.desc);if(skipKeys.has(m))continue;if(!groups[m])groups[m]=[];groups[m].push(t);}
  const found=[];
  for(const [merchant,group] of Object.entries(groups)){
    if(group.length<2)continue;
    const sorted=[...group].sort((a,b)=>new Date(a.date)-new Date(b.date));
    const amounts=sorted.map(t=>Math.abs(t.amount));
    const avgAmt=amounts.reduce((s,a)=>s+a,0)/amounts.length;
    if(avgAmt<3)continue; // skip tiny amounts
    const allSimilar=amounts.every(a=>Math.abs(a-avgAmt)/avgAmt<0.12);
    if(!allSimilar)continue;
    let allMonthly=true;
    for(let i=1;i<sorted.length;i++){const diff=(new Date(sorted[i].date)-new Date(sorted[i-1].date))/86400000;if(diff<20||diff>40){allMonthly=false;break;}}
    if(!allMonthly)continue;
    found.push({key:merchant,name:merchant,amount:+avgAmt.toFixed(2),day:new Date(sorted[sorted.length-1].date).getDate(),date:sorted[sorted.length-1].date,txnId:sorted[sorted.length-1].id,frequency:"monthly",isRecurring:true});
  }
  return found;
}
function getRange(f,custom) {
  if (f==="custom"&&custom?.start&&custom?.end){const e=new Date(custom.end);e.setHours(23,59,59);return[new Date(custom.start),e];}
  if (f==="all") return [new Date(0),new Date(NOW.getFullYear()+1,0,1)];
  const d=new Date(NOW),day=d.getDay(),mo=day===0?-6:1-day;
  if (f==="week")      {const s=new Date(d);s.setDate(d.getDate()+mo);const e=new Date(s);e.setDate(s.getDate()+6);return[s,e];}
  if (f==="lastWeek")  {const s=new Date(d);s.setDate(d.getDate()+mo-7);const e=new Date(s);e.setDate(s.getDate()+6);return[s,e];}
  if (f==="month")     return[new Date(d.getFullYear(),d.getMonth(),1),d];
  if (f==="lastMonth") {const s=new Date(d.getFullYear(),d.getMonth()-1,1),e=new Date(d.getFullYear(),d.getMonth(),0);return[s,e];}
  return[new Date(0),d];
}
const filterTxns=(txns,f,custom)=>{const[s,e]=getRange(f,custom);return txns.filter(t=>{const x=new Date(t.date);return x>=s&&x<=e;});};
const compFilterKey=f=>(f==="week"||f==="lastWeek")?"lastWeek":(f==="month"||f==="lastMonth")?"lastMonth":null;

// ── Mobile detection hook ──────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile,setMobile]=useState(()=>typeof window!=="undefined"&&window.innerWidth<768);
  useEffect(()=>{
    let t;
    const h=()=>{clearTimeout(t);t=setTimeout(()=>setMobile(window.innerWidth<768),100);};
    window.addEventListener("resize",h);
    return()=>{window.removeEventListener("resize",h);clearTimeout(t);};
  },[]);
  return mobile;
}

// ── Amount parser: handles European (1.234,56) and Anglo (1,234.56) formats ──
function parseEuroAmount(raw) {
  if(raw===null||raw===undefined||raw==="")return NaN;
  let s=String(raw).trim().replace(/[€$£\s ]/g,"").replace(/[−–]/g,"-");
  if(/\d\.\d{3},/.test(s))return parseFloat(s.replace(/\./g,"").replace(",","."));
  if(/,\d{1,2}$/.test(s)&&!/\./.test(s))return parseFloat(s.replace(",","."));
  return parseFloat(s.replace(",",""));
}
// ── Date parser: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, Date objects, datetime strings ──
function parseFlexDate(raw) {
  if(!raw)return null;
  if(raw instanceof Date&&!isNaN(raw))return raw.toISOString().split("T")[0];
  const s=String(raw).trim().split(" ")[0].split("T")[0];
  let m=s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if(m)return`${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  m=s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if(m)return`${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;
  return null;
}

function parseBankExport(data) {
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
      const desc=String(row[dI]||"").trim();
      const cat=String(row[cI]||"").trim()||null;
      const rawAmt=String(row[aI]||"").trim();
      const comment=cmI>=0?String(row[cmI]||"").trim():"";
      let amount=parseFloat(rawAmt.replace(/[€$£\s]/g,"").replace(/[−–]/g,"-").replace(",","."));
      if(isNaN(amount))continue;
      const id=`${date}-${i}`;
      txns.push({id,date,desc,amount:+amount.toFixed(2),cat:cat||null});
      if(comment)comments[id]=comment;
    }
    // Parse extra sheets saved by doExport
    let savedAutoPayments=[],savedReminders=[],savedBudgets={},savedCustomCats=[],savedWidgetConfig=[];
    if(wb.SheetNames.includes("AutoPagos")){const rows=XLSX.utils.sheet_to_json(wb.Sheets["AutoPagos"],{defval:""});savedAutoPayments=rows.map(r=>({id:Date.now()+Math.random(),name:String(r.Nombre||"").trim(),amount:parseFloat(r.Importe)||0,day:parseInt(r.Dia)||1,month:parseInt(r.Mes)||undefined,frequency:String(r.Frecuencia||"monthly").trim()})).filter(p=>p.name);}
    if(wb.SheetNames.includes("Recordatorios")){const rows=XLSX.utils.sheet_to_json(wb.Sheets["Recordatorios"],{defval:""});savedReminders=rows.map(r=>({id:Date.now()+Math.random(),text:String(r.Texto||"").trim(),done:String(r.Hecho||"").toLowerCase()==="si",repeat:String(r.Repetir||"once").trim()})).filter(r=>r.text);}
    if(wb.SheetNames.includes("Presupuestos")){const rows=XLSX.utils.sheet_to_json(wb.Sheets["Presupuestos"],{defval:""});rows.forEach(r=>{const cat=String(r.Categoria||"").trim(),limit=parseFloat(r.LimiteMensual)||0;if(cat&&limit>0)savedBudgets[cat]=limit;});}
    if(wb.SheetNames.includes("Config")){const rows=XLSX.utils.sheet_to_json(wb.Sheets["Config"],{defval:""});savedCustomCats=rows.map(r=>String(r.CategoriaPersonalizada||"").trim()).filter(Boolean);}
    if(wb.SheetNames.includes("Widgets")){const rows=XLSX.utils.sheet_to_json(wb.Sheets["Widgets"],{defval:""});savedWidgetConfig=rows.sort((a,b)=>(+a.Orden||0)-(+b.Orden||0)).map(r=>({id:String(r.Id||"").trim(),label:String(r.Etiqueta||"").trim(),visible:String(r.Visible||"").toLowerCase()==="si"})).filter(w=>w.id);}
    let savedProfile=null;
    if(wb.SheetNames.includes("_moneda_config")){try{const cell=wb.Sheets["_moneda_config"]["A1"];if(cell&&cell.v)savedProfile=JSON.parse(String(cell.v));}catch(_){}}
    return{txns,comments,isMonedaExport:true,savedAutoPayments,savedReminders,savedBudgets,savedCustomCats,savedWidgetConfig,savedProfile};
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
    const desc=descCol>=0?String(row[descCol]||"").trim():"";
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
      const ingCat=String(row[catIngCol]||"").trim();
      if(ingCat)cat=ingCat;
    }

    txns.push({id:`${date}-${i}`,date,desc,amount:+amount.toFixed(2),cat});
  }

  // 7. Return with detected bank name
  return{txns,comments:{},bank:detectedBank};
}
function doExport(transactions,comments,{autoPayments=[],reminders=[],budgets={},customCats=[],widgetConfig=[],profile={}}={}) {
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
  XLSX.writeFile(wb,`moneda_${new Date().toISOString().split("T")[0]}.xlsx`);
}

// ── Step Progress ─────────────────────────────────────────────────────────────
function StepProgress({steps,current,theme}) {
  const {c,font:f}=theme;
  return <div style={{display:"flex",gap:"0px",marginBottom:"20px",borderRadius:"12px",overflow:"hidden",border:`1.5px solid ${c.border}`}}>
    {steps.map((s,i)=>(
      <div key={i} style={{flex:1,padding:"10px 8px",textAlign:"center",fontSize:"11px",fontWeight:700,fontFamily:f,
        background:i<current?`${c.p}30`:i===current?c.p:"white",
        color:i===current?"white":i<current?c.p:c.muted,
        borderRight:i<steps.length-1?`1px solid ${c.border}`:"none",
        transition:"all 0.3s"}}>
        {i<current&&<span style={{marginRight:"4px"}}>✓</span>}{s}
      </div>
    ))}
  </div>;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({msg,type,onClose}) {
  const isMobile=useIsMobile();
  useEffect(()=>{const t=setTimeout(onClose,4500);return()=>clearTimeout(t);},[]);
  return <div style={{position:"fixed",bottom:isMobile?72:28,left:isMobile?"50%":"auto",right:isMobile?"auto":28,transform:isMobile?"translateX(-50%)":"none",zIndex:9999,background:type==="success"?"#22c55e":type==="error"?"#ef4444":"#3b82f6",color:"white",borderRadius:"14px",padding:"14px 20px",fontSize:"14px",fontWeight:600,boxShadow:"0 8px 32px rgba(0,0,0,0.22)",animation:"fadeUp 0.3s ease",display:"flex",alignItems:"center",gap:"10px",whiteSpace:"nowrap",maxWidth:"90vw"}}>
    <span style={{fontSize:"20px"}}>{type==="success"?"✅":type==="error"?"❌":"ℹ️"}</span>{msg}
    <span onClick={onClose} style={{cursor:"pointer",opacity:0.7,marginLeft:4}}>✕</span>
  </div>;
}

// ── NPC Dialog ────────────────────────────────────────────────────────────────
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

// ── Subscription Verify ───────────────────────────────────────────────────────
function SubscriptionVerify({theme,subs,steps,stepIndex,onDone,lang="es"}) {
  const {c,font:f}=theme;
  const tr=T[lang]||T.en;
  const isMobile=useIsMobile();
  const [items,setItems]=useState(subs.map(s=>({...s,checked:true,frequency:"monthly"})));
  const toggle=key=>setItems(is=>is.map(i=>i.key===key?{...i,checked:!i.checked}:i));
  const setFreq=(key,freq)=>setItems(is=>is.map(i=>i.key===key?{...i,frequency:freq}:i));
  return <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?0:"20px",background:"rgba(0,0,0,0.75)"}}>
    <div style={{background:"#ffffff",borderRadius:isMobile?"24px 24px 0 0":"20px",padding:isMobile?"24px 20px":"28px 32px",maxWidth:"540px",width:"100%",maxHeight:isMobile?"95vh":"88vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.5)",border:`2px solid ${c.border}`,animation:isMobile?"slideUp 0.3s ease":"none"}}>
      <StepProgress steps={steps} current={stepIndex} theme={theme}/>
      <div style={{fontSize:"22px",fontWeight:800,color:c.text,marginBottom:6,fontFamily:f}}>📦 {tr.subsDetected}</div>
      <div style={{fontSize:"13px",color:"#374151",fontWeight:500,marginBottom:16,background:"#f3f4f6",borderRadius:"10px",padding:"10px 14px"}}>
        {tr.subsSub}
      </div>
      <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"10px"}}>
        {items.map(s=>(
          <div key={s.key} style={{borderRadius:"14px",border:`2px solid ${s.checked?c.p:"#d1d5db"}`,background:s.checked?"#eff6ff":"#f9fafb",transition:"all 0.15s"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px",padding:"14px 16px 10px",cursor:"pointer"}} onClick={()=>toggle(s.key)}>
              <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,border:`2px solid ${s.checked?c.p:"#d1d5db"}`,background:s.checked?c.p:"#ffffff",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                {s.checked&&<span style={{color:"white",fontSize:"12px",lineHeight:1}}>✓</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:"15px",color:"#111827",fontFamily:f}}>{s.name}</div>
                <div style={{fontSize:"11px",color:"#6b7280",marginTop:2}}>{s.isRecurring?"🔄 Recurring pattern":"📦 Subscription"} · {tr.detected} {fmtD(s.date)} · {tr.renewsDay} {s.day}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontWeight:700,fontSize:"15px",color:c.danger}}>-{fmt(s.amount)}</div>
                <div style={{fontSize:"11px",color:"#6b7280"}}>{s.frequency==="yearly"?tr.perYear:tr.perMonth}</div>
              </div>
            </div>
            <div style={{display:"flex",gap:"6px",alignItems:"center",padding:"0 16px 12px"}}>
              <span style={{fontSize:"11px",color:"#374151",fontWeight:700,marginRight:4}}>{tr.billing}</span>
              {[["monthly",tr.billingMonthly],["yearly",tr.billingYearly]].map(([freq,label])=>(
                <button key={freq} onClick={e=>{e.stopPropagation();setFreq(s.key,freq);}}
                  style={{padding:"5px 14px",borderRadius:"20px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:f,
                    background:s.frequency===freq?c.p:"#ffffff",
                    color:s.frequency===freq?"#ffffff":"#6b7280",
                    boxShadow:s.frequency===freq?`0 2px 8px ${c.p}50`:"inset 0 0 0 1.5px #d1d5db",
                    transition:"all 0.15s"}}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={()=>onDone(items.filter(i=>i.checked))}
        style={{marginTop:18,padding:"14px",borderRadius:"12px",border:"none",background:c.p,color:"white",fontSize:"15px",fontWeight:700,cursor:"pointer",fontFamily:f,boxShadow:`0 4px 14px ${c.p}40`}}>
        {tr.confirmAutoPay}
      </button>
    </div>
  </div>;
}

// ── Category Review — Drag + Click to Classify ────────────────────────────────
function CategoryReview({theme,unknowns,customCats,steps,stepIndex,onDone,lang="es"}) {
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

// ── Budget Wizard ─────────────────────────────────────────────────────────────
function BudgetWizard({theme,steps,stepIndex,onDone,lang="es"}) {
  const {c,font:f}=theme;
  const tr=T[lang]||T.en;
  const catLabel=cat=>(CAT_LABELS[lang]||CAT_LABELS.en)[cat]||cat;
  const isMobile=useIsMobile();
  const [step,setStep]=useState(1),[income,setIncome]=useState("");
  const [limits,setLimits]=useState({Groceries:150,Restaurants:120,Transport:80,Shopping:200,Subscriptions:50,Health:60,Entertainment:50});
  const suggest=inc=>{const i=+inc||1500;setLimits({Groceries:Math.round(i*0.12),Restaurants:Math.round(i*0.10),Transport:Math.round(i*0.07),Shopping:Math.round(i*0.10),Subscriptions:Math.round(i*0.04),Health:Math.round(i*0.05),Entertainment:Math.round(i*0.04)});};
  return <div style={{position:"fixed",inset:0,zIndex:600,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?0:"20px",background:c.overlay||"rgba(0,0,0,0.65)"}}>
    <div style={{background:"#ffffff",borderRadius:isMobile?"24px 24px 0 0":"24px",padding:isMobile?"24px 20px":"32px",maxWidth:"500px",width:"100%",maxHeight:isMobile?"95vh":"none",overflowY:isMobile?"auto":"visible",boxShadow:"0 24px 60px rgba(0,0,0,0.45)",border:`1.5px solid ${c.border}`,animation:isMobile?"slideUp 0.3s ease":"none"}}>
      <StepProgress steps={steps} current={stepIndex} theme={theme}/>
      {step===1&&<>
        <div style={{fontSize:"40px",marginBottom:12,textAlign:"center"}}>🎯</div>
        <h2 style={{fontSize:"22px",fontWeight:800,color:c.text,marginBottom:8,textAlign:"center",fontFamily:f}}>{tr.budgetWizardTitle}</h2>
        <p style={{color:c.muted,fontSize:"13px",textAlign:"center",marginBottom:24}}>{tr.budgetWizardSub}</p>
        <input value={income} onChange={e=>setIncome(e.target.value)} type="number" placeholder="e.g. 1800"
          style={{width:"100%",padding:"14px",borderRadius:"12px",border:`2px solid ${income?c.p:c.border}`,fontSize:"18px",outline:"none",textAlign:"center",fontFamily:f,color:c.text,marginBottom:16,background:"white"}}/>
        <button onClick={()=>{suggest(income);setStep(2);}}
          style={{width:"100%",padding:"14px",borderRadius:"12px",border:"none",background:c.p,color:"white",fontSize:"16px",fontWeight:700,cursor:"pointer",fontFamily:f}}>
          {income?tr.suggestLimits:tr.skipManual}
        </button>
      </>}
      {step===2&&<>
        <h2 style={{fontSize:"20px",fontWeight:800,color:c.text,marginBottom:4,fontFamily:f}}>{tr.adjustTitle}</h2>
        <p style={{color:c.muted,fontSize:"13px",marginBottom:18}}>{tr.adjustSub}</p>
        <div style={{display:"flex",flexDirection:"column",gap:"10px",maxHeight:"340px",overflowY:"auto",marginBottom:20}}>
          {Object.entries(limits).map(([cat,val])=>(
            <div key={cat} style={{display:"flex",alignItems:"center",gap:"12px"}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:CC[cat]||c.p,flexShrink:0}}/>
              <span style={{flex:1,fontWeight:600,fontSize:"14px",color:c.text,fontFamily:f}}>{catLabel(cat)}</span>
              <span style={{fontSize:"13px",color:c.muted}}>€</span>
              <input type="number" value={val} onChange={e=>setLimits(l=>({...l,[cat]:+e.target.value}))}
                style={{width:"80px",padding:"6px 10px",borderRadius:"8px",border:`1.5px solid ${c.border}`,fontSize:"14px",outline:"none",fontFamily:f,color:c.text,textAlign:"right",background:"white"}}/>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:"10px"}}>
          <button onClick={()=>setStep(1)} style={{flex:1,padding:"12px",borderRadius:"12px",border:`1.5px solid ${c.border}`,background:"transparent",color:c.muted,fontSize:"14px",cursor:"pointer",fontFamily:f}}>{tr.back}</button>
          <button onClick={()=>onDone(limits)} style={{flex:2,padding:"12px",borderRadius:"12px",border:"none",background:c.p,color:"white",fontSize:"15px",fontWeight:700,cursor:"pointer",fontFamily:f}}>{tr.saveBudgets}</button>
        </div>
      </>}
    </div>
  </div>;
}

// ── Reimbursement expand panel (shared by mobile+desktop) ────────────────────
function ReimPanel({t,theme,reimbursed,onMarkReimbursed,setShowReim,allTransactions}) {
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
function TxnRow({t,theme,onCatChange,onAddReminder,comment,onCommentSave,allCats,reimbursed,onMarkReimbursed,allTransactions,lang="es"}) {
  const {c,font:f}=theme;
  const tr=T[lang]||T.en;
  const catLabel=cat=>(CAT_LABELS[lang]||CAT_LABELS.en)[cat]||cat;
  const isMobile=useIsMobile();
  const [editCat,setEditCat]=useState(false),[showCom,setShowCom]=useState(false),[showRem,setShowRem]=useState(false),[showReim,setShowReim]=useState(false);
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

// ── Merchant Breakdown ────────────────────────────────────────────────────────
function MerchantBreakdown({theme,txns,cat,lang="es"}) {
  const {c}=theme;
  const tr=T[lang]||T.en;
  const [hoveredName,setHoveredName]=useState(null);
  const data=Object.entries(txns.filter(t=>t.cat===cat&&t.amount<0).reduce((acc,t)=>{const m=extractMerchant(t.desc);if(!acc[m])acc[m]={total:0,count:0};acc[m].total+=Math.abs(t.amount);acc[m].count++;return acc;},{}))
    .map(([name,{total,count}])=>({name,total:+total.toFixed(2),count})).sort((a,b)=>b.total-a.total).slice(0,15);
  if(!data.length)return null;
  const max=data[0]?.total||1;
  return <div style={{marginTop:18,paddingTop:14,borderTop:`1px solid ${c.border}`}}>
    <div style={{fontWeight:700,color:c.text,marginBottom:10,fontSize:"13px"}}>📍 {tr.byMerchant}</div>
    {data.map(({name,total,count})=>(
      <div key={name} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:7,position:"relative"}}
        onMouseEnter={()=>setHoveredName(name)} onMouseLeave={()=>setHoveredName(null)}>
        <div style={{width:"130px",fontSize:"12px",color:c.text,fontWeight:600,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"default"}}>
          {name}
          {/* Full name tooltip on hover */}
          {hoveredName===name&&name.length>18&&<div style={{position:"absolute",left:0,bottom:"calc(100% + 4px)",background:"#111827",color:"white",fontSize:"11px",fontWeight:600,padding:"5px 10px",borderRadius:"8px",whiteSpace:"nowrap",zIndex:50,boxShadow:"0 4px 12px rgba(0,0,0,0.3)",pointerEvents:"none"}}>
            {name}
            <div style={{position:"absolute",bottom:"-4px",left:"12px",width:"8px",height:"8px",background:"#111827",transform:"rotate(45deg)"}}/>
          </div>}
        </div>
        <div style={{flex:1,height:"9px",borderRadius:"9px",background:c.pl,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${(total/max)*100}%`,borderRadius:"9px",background:CC[cat]||c.p,transition:"width 0.5s"}}/>
        </div>
        <div style={{width:"68px",textAlign:"right",fontSize:"12px",fontWeight:700,color:c.text,flexShrink:0}}>{fmt(total)}</div>
        <div style={{width:"28px",fontSize:"11px",color:c.muted,flexShrink:0}}>{count}×</div>
      </div>
    ))}
  </div>;
}

// ── Compare Panel ─────────────────────────────────────────────────────────────
function ComparePanel({theme,label1,label2,txns1,txns2,lang="es"}) {
  const {c,font:f}=theme;
  const tr=T[lang]||T.en;
  const st=tx=>({inc:tx.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0),exp:tx.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0),net:tx.reduce((s,t)=>s+t.amount,0)});
  const s1=st(txns1),s2=st(txns2);
  const Row=({label,v1,v2,isExp})=>{const d=isExp?Math.abs(v2)-Math.abs(v1):v2-v1;const pct=v1?Math.round(Math.abs(d/v1)*100):0;const better=isExp?d<0:d>0;
    return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:8,alignItems:"center"}}>
      <span style={{fontSize:"12px",color:c.muted,fontWeight:600}}>{label}</span>
      <span style={{textAlign:"center",fontSize:"14px",fontWeight:700,color:c.text}}>{fmt(Math.abs(v1))}</span>
      <div style={{textAlign:"right",display:"flex",alignItems:"center",justifyContent:"flex-end",gap:"5px"}}>
        <span style={{fontSize:"14px",fontWeight:700,color:c.text}}>{fmt(Math.abs(v2))}</span>
        {pct>0&&<span style={{fontSize:"11px",fontWeight:700,padding:"2px 6px",borderRadius:"20px",background:better?"#dcfce7":"#fee2e2",color:better?"#15803d":"#dc2626"}}>{d>0?"↑":"↓"}{pct}%</span>}
      </div>
    </div>;};
  return <div style={{background:c.card,borderRadius:"16px",padding:"20px 24px",border:`1.5px solid ${c.border}`,marginBottom:18}}>
    <div style={{fontWeight:700,color:c.text,marginBottom:14,fontSize:"15px"}}>⚖️ Period comparison</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:12}}>
      <div/><div style={{textAlign:"center",fontSize:"11px",fontWeight:700,color:c.muted,textTransform:"uppercase",letterSpacing:1}}>{label1}</div>
      <div style={{textAlign:"right",fontSize:"11px",fontWeight:700,color:c.p,textTransform:"uppercase",letterSpacing:1}}>{label2}</div>
    </div>
    <Row label={tr.income} v1={s1.inc} v2={s2.inc} isExp={false}/>
    <Row label={tr.expenses} v1={s1.exp} v2={s2.exp} isExp={true}/>
    <Row label={tr.net} v1={s1.net} v2={s2.net} isExp={false}/>
  </div>;
}

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

// ── Full Ledger (used in Data page) ──────────────────────────────────────────
function FullLedger({theme,transactions,onCatChange,comments,onCommentSave,onAddReminder,allCats,reimbursed,onMarkReimbursed,onExport,lang="es"}) {
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
          {visible.slice(0,limit).map(t=><TxnRow key={t.id} t={t} theme={theme} onCatChange={onCatChange} onAddReminder={onAddReminder} comment={comments[t.id]} onCommentSave={onCommentSave} allCats={allCats} reimbursed={reimbursed?.[t.id]} onMarkReimbursed={onMarkReimbursed} lang={lang}/>)}
        </div>
      :<div style={{overflowX:"auto",borderRadius:"14px",border:`1.5px solid ${c.border}`,background:c.card}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontFamily:f}}>
            <thead><tr style={{borderBottom:`2px solid ${c.border}`,background:c.pl}}>
              {["Date","Description","Category","Amount",""].map(h=><th key={h} style={{padding:"9px 12px",textAlign:"left",fontSize:"10px",color:c.muted,textTransform:"uppercase",letterSpacing:1.2,fontWeight:700}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {visible.slice(0,limit).map(t=><TxnRow key={t.id} t={t} theme={theme} onCatChange={onCatChange} onAddReminder={onAddReminder} comment={comments[t.id]} onCommentSave={onCommentSave} allCats={allCats} reimbursed={reimbursed?.[t.id]} onMarkReimbursed={onMarkReimbursed} lang={lang}/>)}
            </tbody>
          </table>
        </div>}
    {visible.length>limit&&<div style={{textAlign:"center",marginTop:12}}>
      <button onClick={()=>setLimit(l=>l+50)} style={{padding:"8px 20px",borderRadius:"10px",border:`1.5px solid ${c.border}`,background:"transparent",color:c.p,cursor:"pointer",fontSize:"13px",fontWeight:600,fontFamily:f}}>Load more ({visible.length-limit} remaining)</button>
    </div>}
  </div>;
}

// ── Budget Widget (standalone, own period toggle) ─────────────────────────────
function BudgetWidget({theme,budgets,allTransactions,w,lang="es"}) {
  const {c,font:f}=theme;
  const tr=T[lang]||T.en;
  const catLabel=cat=>(CAT_LABELS[lang]||CAT_LABELS.en)[cat]||cat;
  const [period,setPeriod]=useState("month");
  const now=new Date();
  const day=now.getDay(),mo=day===0?-6:1-day;
  const wkStart=new Date(now);wkStart.setDate(now.getDate()+mo);wkStart.setHours(0,0,0,0);
  const wkEnd=new Date(wkStart);wkEnd.setDate(wkStart.getDate()+6);wkEnd.setHours(23,59,59);
  const periodTxns=allTransactions.filter(t=>{
    if(t.amount>=0)return false;
    const d=new Date(t.date);
    return period==="month"
      ? d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()
      : d>=wkStart&&d<=wkEnd;
  });
  const monthLabel=now.toLocaleDateString("es-ES",{month:"long",year:"numeric"});
  const wkLabel=`${wkStart.toLocaleDateString("es-ES",{day:"2-digit",month:"short"})} – ${wkEnd.toLocaleDateString("es-ES",{day:"2-digit",month:"short"})}`;
  const budgetRows=Object.entries(budgets).filter(([,v])=>v>0).map(([cat,monthlyLimit])=>{
    const limit=period==="week"?+(monthlyLimit/4).toFixed(2):monthlyLimit;
    const spent=+(periodTxns.filter(t=>t.cat===cat).reduce((s,t)=>s+Math.abs(t.amount),0)).toFixed(2);
    const pct=+(Math.min(limit?spent/limit*100:0,100)).toFixed(0);
    return{cat,limit,spent,pct,over:limit>0&&spent>limit};
  });
  if(!budgetRows.length)return null;
  return <div style={{background:c.card,borderRadius:"16px",padding:"20px 24px",border:`1.5px solid ${c.border}`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:"8px"}}>
      <div>
        <div style={{fontWeight:700,color:c.text,fontSize:"15px"}}>🎯 {w.budget}</div>
        <div style={{fontSize:"11px",color:c.muted,marginTop:2,textTransform:"capitalize"}}>{period==="month"?monthLabel:wkLabel}</div>
      </div>
      <div style={{display:"flex",gap:"5px"}}>
        {[["month",`📅 ${tr.month}`],["week",`🗓 ${tr.week}`]].map(([p,lbl])=>(
          <button key={p} onClick={()=>setPeriod(p)}
            style={{padding:"5px 12px",borderRadius:"16px",border:"none",cursor:"pointer",fontSize:"11px",fontWeight:700,fontFamily:f,
              background:period===p?c.p:"white",color:period===p?"white":c.muted,
              boxShadow:period===p?`0 2px 8px ${c.p}40`:`inset 0 0 0 1.5px ${c.border}`}}>
            {lbl}
          </button>
        ))}
      </div>
    </div>
    {budgetRows.map(({cat,limit,spent,pct,over})=>(
      <div key={cat} style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
          <div style={{display:"flex",alignItems:"center",gap:"7px"}}><div style={{width:8,height:8,borderRadius:"50%",background:CC[cat]||c.p}}/><span style={{fontSize:"13px",fontWeight:600,color:c.text}}>{catLabel(cat)}</span></div>
          <span style={{fontSize:"12px",color:over?c.danger:pct>=80?"#f59e0b":c.muted}}>{fmt(spent)} / {fmt(limit)} {over?"🔴":pct>=80?"🟡":"🟢"}</span>
        </div>
        <div style={{height:"8px",borderRadius:"8px",background:c.pl,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,borderRadius:"8px",background:over?c.danger:pct>=80?"#f59e0b":CC[cat]||c.p,transition:"width 0.6s"}}/></div>
        {over&&<div style={{fontSize:"11px",color:c.danger,marginTop:3}}>{w.over}</div>}
      </div>
    ))}
  </div>;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({theme,timeFilter,setTimeFilter,compareMode,setCompareMode,customRange,setCustomRange,filtered,compFiltered,totalInc,totalExp,net,biggestExp,catData,budgetWarnings,paymentsWithCountdown,reminders,setReminders,transactions,comments,onCommentSave,onCatChange,hasData,onAddReminder,allCats,reimbursed,onMarkReimbursed,budgets,widgetConfig,setWidgetConfig,onExport,lang="es"}) {
  const {c,font:f,w}=theme;
  const tr=T[lang]||T.en;
  const catLabel=cat=>(CAT_LABELS[lang]||CAT_LABELS.en)[cat]||cat;
  const WIDGET_LABEL_KEY={summary:"wSummary",insights:"wInsights",budget:"wBudget",payments:"wPayments",spending:"wSpending",journal:"wJournal",income:"wIncome",subscriptions:"wSubscriptions"};
  const widgetLabel=id=>tr[WIDGET_LABEL_KEY[id]]||id;
  const isMobile=useIsMobile();
  const [catFilter,setCatFilter]=useState("All");
  const [editMode,setEditMode]=useState(false);

  // Widget order/visibility — stored as [{id,visible}]
  const DEFAULT_WIDGETS=[
    {id:"summary",label:"📊 Summary cards",visible:true},
    {id:"insights",label:"💡 Insights",visible:true},
    {id:"budget",label:"🎯 Budget",visible:true},
    {id:"payments",label:"💳 Upcoming charges",visible:true},
    {id:"spending",label:"📊 Spending by category",visible:true},
    {id:"journal",label:"📄 Journal",visible:true},
    {id:"income",label:"💰 Income transactions",visible:true},
    {id:"subscriptions",label:"📦 Subscriptions & Recurring",visible:false},
  ];
  // Preserve user order from widgetConfig; append any new DEFAULT_WIDGETS entries not yet in config
  const widgets = widgetConfig?.length
    ? [...widgetConfig, ...DEFAULT_WIDGETS.filter(dw=>!widgetConfig.find(w=>w.id===dw.id))]
    : DEFAULT_WIDGETS;
  const isVisible = id => widgets.find(w=>w.id===id)?.visible!==false;
  const moveWidget = (id,dir) => {
    const idx=widgets.findIndex(w=>w.id===id);
    const newW=[...widgets];
    const swap=idx+dir;
    if(swap<0||swap>=newW.length)return;
    [newW[idx],newW[swap]]=[newW[swap],newW[idx]];
    setWidgetConfig(newW);
  };
  const toggleWidget = id => setWidgetConfig(widgets.map(w=>w.id===id?{...w,visible:!w.visible}:w));

  // Include ALL cats that appear in filtered expenses (including custom ones)
  const inPeriodCatSet=new Set(filtered.filter(t=>t.amount<0).map(t=>t.cat).filter(Boolean));
  const inPeriodCats=["All",...[...inPeriodCatSet].sort()];

  // Month journal navigation (independent of time filter for browsing)
  const [journalMonth,setJournalMonth]=useState(()=>{const d=new Date(NOW);return{y:d.getFullYear(),m:d.getMonth()};});
  const journalTxns=transactions.filter(t=>{const d=new Date(t.date);return d.getFullYear()===journalMonth.y&&d.getMonth()===journalMonth.m;});
  const prevJM=()=>setJournalMonth(({y,m})=>m===0?{y:y-1,m:11}:{y,m:m-1});
  const nextJM=()=>setJournalMonth(({y,m})=>m===11?{y:y+1,m:0}:{y,m:m+1});
  const journalLabel=new Date(journalMonth.y,journalMonth.m,1).toLocaleDateString("es-ES",{month:"long",year:"numeric"});
  const isCurrentMonth=journalMonth.y===NOW.getFullYear()&&journalMonth.m===NOW.getMonth();

  const compKey=compFilterKey(timeFilter);

  // Period label for "Total spent in X — [period]"
  const periodLabels={"week":tr.thisWeek,"lastWeek":tr.lastWeek,"month":tr.thisMonth,"lastMonth":tr.lastMonth,"all":tr.allTime,"custom":tr.custom};
  const periodLabel=periodLabels[timeFilter]||"";

  // Insights
  const topCat=catData[0];
  const merchantCounts=filtered.filter(t=>t.amount<0).reduce((acc,t)=>{const m=extractMerchant(t.desc);acc[m]=(acc[m]||0)+1;return acc;},{});
  const topMerchant=Object.entries(merchantCounts).sort((a,b)=>b[1]-a[1])[0];
  const avgDaily=filtered.filter(t=>t.amount<0).length?Math.abs(totalExp)/Math.max(1,Math.ceil((getRange(timeFilter,customRange)[1]-getRange(timeFilter,customRange)[0])/86400000)):0;

  const SCard=({label,value,sub,color})=><div style={{background:c.card,borderRadius:"16px",padding:"20px",flex:"0 0 auto",width:isMobile?"160px":"auto",minWidth:isMobile?"160px":"130px",boxShadow:"0 2px 12px rgba(0,0,0,0.05)",border:`1.5px solid ${c.border}`}}>
    <div style={{fontSize:"10px",color:c.muted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:6,fontFamily:f}}>{label}</div>
    <div style={{fontSize:"22px",fontWeight:800,color,fontFamily:f}}>{value}</div>
    <div style={{fontSize:"12px",color:c.muted,marginTop:5,fontFamily:f}}>{sub}</div>
  </div>;

  return <div style={{display:"flex",flexDirection:"column",gap:"18px",fontFamily:f}}>
    {/* Customize bar */}
    <div style={{display:"flex",justifyContent:"flex-end"}}>
      <button onClick={()=>setEditMode(m=>!m)}
        style={{padding:"6px 14px",borderRadius:"12px",border:`1.5px solid ${editMode?c.p:c.border}`,background:editMode?c.p:"white",color:editMode?"white":c.muted,cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:f,display:"flex",alignItems:"center",gap:"5px"}}>
        ✏️ {editMode?tr.customDone:tr.customise}
      </button>
    </div>
    {editMode&&<div style={{background:c.card,borderRadius:"14px",padding:"16px 20px",border:`1.5px solid ${c.p}30`}}>
      <div style={{fontSize:"12px",fontWeight:700,color:c.text,marginBottom:12}}>{tr.dragReorder}</div>
      {widgets.map((wid,idx)=>(
        <div key={wid.id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 12px",borderRadius:"10px",marginBottom:6,background:wid.visible?"#f9fafb":"#f0f0f0",border:`1.5px solid ${wid.visible?c.border:"#d1d5db"}`}}>
          <div style={{display:"flex",flexDirection:"column",gap:"1px"}}>
            <button onClick={()=>moveWidget(wid.id,-1)} disabled={idx===0} style={{padding:"1px 5px",border:"none",background:"transparent",cursor:idx===0?"default":"pointer",color:idx===0?"#d1d5db":c.muted,fontSize:"10px",lineHeight:1}}>▲</button>
            <button onClick={()=>moveWidget(wid.id,1)} disabled={idx===widgets.length-1} style={{padding:"1px 5px",border:"none",background:"transparent",cursor:idx===widgets.length-1?"default":"pointer",color:idx===widgets.length-1?"#d1d5db":c.muted,fontSize:"10px",lineHeight:1}}>▼</button>
          </div>
          <span style={{flex:1,fontSize:"13px",fontWeight:600,color:wid.visible?c.text:"#9ca3af"}}>{widgetLabel(wid.id)}</span>
          <button onClick={()=>toggleWidget(wid.id)}
            style={{padding:"4px 12px",borderRadius:"16px",border:"none",cursor:"pointer",fontSize:"11px",fontWeight:700,fontFamily:f,background:wid.visible?c.p:"#e5e7eb",color:wid.visible?"white":"#6b7280"}}>
            {wid.visible?tr.visible:tr.hidden}
          </button>
        </div>
      ))}
    </div>}
    {/* Time filters */}
    <div style={{display:"flex",gap:"7px",flexWrap:"wrap",alignItems:"center",overflowX:isMobile?"auto":"visible"}}>
      {[["week",tr.thisWeek],["lastWeek",tr.lastWeek],["month",tr.thisMonth],["lastMonth",tr.lastMonth],["all",tr.allTime]].map(([id,lbl])=>(
        <button key={id} onClick={()=>{setTimeFilter(id);setCompareMode(false);}} style={{padding:"8px 14px",borderRadius:"20px",border:"none",cursor:"pointer",fontFamily:f,fontWeight:600,fontSize:"13px",transition:"all 0.18s",background:timeFilter===id?c.p:c.card,color:timeFilter===id?"white":c.text,boxShadow:timeFilter===id?`0 3px 10px ${c.p}50`:"0 1px 4px rgba(0,0,0,0.07)",whiteSpace:"nowrap",minHeight:"44px"}}>{lbl}</button>
      ))}
      <button onClick={()=>setTimeFilter("custom")} style={{padding:"8px 13px",borderRadius:"20px",border:"none",cursor:"pointer",fontFamily:f,fontWeight:600,fontSize:"13px",background:timeFilter==="custom"?c.p:c.card,color:timeFilter==="custom"?"white":c.text,boxShadow:timeFilter==="custom"?`0 3px 10px ${c.p}50`:"0 1px 4px rgba(0,0,0,0.07)",whiteSpace:"nowrap",minHeight:"44px"}}>📅 {tr.custom}</button>
      {(timeFilter==="week"||timeFilter==="month")&&<button onClick={()=>setCompareMode(m=>!m)} style={{padding:"8px 13px",borderRadius:"20px",border:"none",cursor:"pointer",fontFamily:f,fontWeight:600,fontSize:"13px",background:compareMode?"#f59e0b":c.card,color:compareMode?"white":c.text,boxShadow:compareMode?"0 3px 10px rgba(245,158,11,0.5)":"0 1px 4px rgba(0,0,0,0.07)",whiteSpace:"nowrap",minHeight:"44px"}}>⚖️ {tr.compare}</button>}
    </div>
    {timeFilter==="custom"&&<div style={{background:c.card,borderRadius:"14px",padding:"16px 20px",border:`1.5px solid ${c.border}`,display:"flex",gap:"12px",alignItems:"center",flexWrap:"wrap"}}>
      <span style={{fontSize:"13px",fontWeight:600,color:c.text}}>📅 From</span>
      <input type="date" value={customRange.start} onChange={e=>setCustomRange(r=>({...r,start:e.target.value}))} style={{padding:"7px 10px",borderRadius:"9px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,background:"white"}}/>
      <span style={{color:c.muted}}>to</span>
      <input type="date" value={customRange.end} onChange={e=>setCustomRange(r=>({...r,end:e.target.value}))} style={{padding:"7px 10px",borderRadius:"9px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,background:"white"}}/>
    </div>}
    {!hasData&&<div style={{background:c.card,borderRadius:"16px",padding:"32px",textAlign:"center",border:`2px dashed ${c.border}`}}>
      <div style={{fontSize:"42px",marginBottom:10}}>📂</div>
      <div style={{fontWeight:700,color:c.text,fontSize:"17px",marginBottom:6}}>{tr.noData}</div>
      <div style={{color:c.muted,fontSize:"13px"}}>{tr.noDataSub}</div>
    </div>}
    {compareMode&&compFiltered&&compKey&&<ComparePanel theme={theme} label1={timeFilter==="week"?tr.thisWeek:tr.thisMonth} label2={compKey==="lastWeek"?tr.lastWeek:tr.lastMonth} txns1={filtered} txns2={compFiltered} lang={lang}/>}
    {/* Summary cards */}
    {isVisible("summary")&&<div style={{display:"flex",gap:"12px",flexWrap:isMobile?"nowrap":"wrap",overflowX:isMobile?"auto":"visible",paddingBottom:isMobile?"4px":0}}>
      <SCard label={w.inc} value={`+${fmt(totalInc)}`} sub={`${filtered.filter(t=>t.amount>0).length} ${tr.transactions}`} color="#10b981"/>
      <SCard label={tr.expenses} value={`-${fmt(Math.abs(totalExp))}`} sub={`${filtered.filter(t=>t.amount<0).length} ${tr.transactions}`} color={c.danger}/>
      <SCard label={tr.net} value={`${net>=0?"+":""}${fmt(net)}`} sub={net>=0?"Great work! 🎉":"More out than in"} color={net>=0?"#10b981":c.danger}/>
      {biggestExp&&<SCard label={tr.biggestExpense} value={`-${fmt(Math.abs(biggestExp.amount))}`} sub={biggestExp.desc.slice(0,28)+"…"} color={c.danger}/>}
    </div>}
    {/* Insights strip */}
    {isVisible("insights")&&hasData&&(topCat||topMerchant)&&<div style={{background:c.card,borderRadius:"14px",padding:"14px 20px",border:`1.5px solid ${c.border}`,display:"flex",gap:"20px",flexWrap:"wrap"}}>
      <span style={{fontSize:"11px",fontWeight:700,color:c.muted,alignSelf:"center",textTransform:"uppercase",letterSpacing:1}}>💡 {tr.insightsLabel}</span>
      {topCat&&<div style={{display:"flex",alignItems:"center",gap:"7px"}}><div style={{width:9,height:9,borderRadius:"50%",background:CC[topCat.name]||c.p}}/><span style={{fontSize:"12px",color:c.text,fontWeight:600}}>{tr.topSpend}: <strong>{catLabel(topCat.name)}</strong> ({fmt(topCat.value)})</span></div>}
      {topMerchant&&<div style={{fontSize:"12px",color:c.text,fontWeight:600}}>🛒 {tr.mostVisited}: <strong>{topMerchant[0]}</strong> ({topMerchant[1]}×)</div>}
      {avgDaily>0&&<div style={{fontSize:"12px",color:c.text,fontWeight:600}}>📅 {tr.avgDay}: <strong>{fmt(avgDaily)}</strong></div>}
    </div>}
    {/* Budget widget — independent period toggle */}
    {isVisible("budget")&&timeFilter!=="all"&&<BudgetWidget theme={theme} budgets={budgets} allTransactions={transactions} w={w} lang={lang}/>}
    {/* Payments + Reminders */}
    {isVisible("payments")&&<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"16px"}}>
      <div style={{background:c.card,borderRadius:"16px",padding:"20px",border:`1.5px solid ${c.border}`}}>
        <div style={{fontWeight:700,color:c.text,marginBottom:14,fontSize:"15px"}}>💳 {tr.upcomingCharges}</div>
        {(()=>{const monthly=paymentsWithCountdown.filter(p=>p.frequency!=="yearly");return monthly.length===0?<div style={{color:c.muted,fontSize:"13px"}}>{tr.noPayments}</div>:monthly.map(p=><div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,padding:"10px 12px",borderRadius:"10px",background:p.days<=3?`${c.danger}15`:p.days<=7?"#f59e0b18":c.pl}}><div><div style={{fontWeight:600,fontSize:"13px",color:c.text}}>{p.name}</div><div style={{fontSize:"11px",color:c.muted}}>{tr.inDays} {p.days} {p.days!==1?tr.days:tr.day}</div></div><div style={{fontWeight:700,fontSize:"14px",color:p.days<=3?c.danger:c.text}}>-{fmt(p.amount)}</div></div>);})()}
      </div>
      <div style={{background:c.card,borderRadius:"16px",padding:"20px",border:`1.5px solid ${c.border}`}}>
        <div style={{fontWeight:700,color:c.text,marginBottom:14,fontSize:"15px"}}>📋 {tr.remindersTitle}</div>
        {reminders.map(r=><div key={r.id} onClick={()=>setReminders(rs=>rs.map(x=>x.id===r.id?{...x,done:!x.done}:x))}
          style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 10px",borderRadius:"10px",cursor:"pointer",marginBottom:6,opacity:r.done?0.5:1}}>
          <div style={{width:22,height:22,borderRadius:"50%",flexShrink:0,border:`2px solid ${r.done?c.p:c.border}`,background:r.done?c.p:"white",display:"flex",alignItems:"center",justifyContent:"center"}}>{r.done&&<span style={{color:"white",fontSize:"11px"}}>✓</span>}</div>
          <div style={{flex:1}}><div style={{fontSize:"13px",fontWeight:600,color:c.text,textDecoration:r.done?"line-through":"none"}}>{r.text}</div><div style={{fontSize:"10px",color:c.muted}}>🔁 {r.repeat}</div></div>
        </div>)}
      </div>
    </div>}
    {/* Spending by category */}
    {isVisible("spending")&&catData.length>0&&<div style={{background:c.card,borderRadius:"16px",padding:"22px 24px",border:`1.5px solid ${c.border}`}}>
      <div style={{fontWeight:700,color:c.text,marginBottom:14,fontSize:"15px"}}>📊 {tr.spendingTitle}</div>
      <div style={{display:"flex",gap:"7px",flexWrap:"wrap",marginBottom:16}}>
        {inPeriodCats.map(cat=><button key={cat} onClick={()=>setCatFilter(cat)} style={{padding:"5px 13px",borderRadius:"20px",border:"none",cursor:"pointer",fontSize:"12px",fontFamily:f,fontWeight:600,transition:"all 0.15s",background:catFilter===cat?(CC[cat]||c.p):"transparent",color:catFilter===cat?"white":c.muted,outline:`1.5px solid ${catFilter===cat?(CC[cat]||c.p):c.border}`}}>{cat==="All"?cat:catLabel(cat)}</button>)}
      </div>
      {catFilter==="All"
        ? <ResponsiveContainer width="100%" height={200}>
            <BarChart data={catData} margin={{top:0,right:10,bottom:0,left:0}}>
              <XAxis dataKey="name" tick={{fontSize:11,fill:c.muted}} axisLine={false} tickLine={false}/>
              <YAxis hide/>
              <Tooltip formatter={v=>[`€${(+v).toFixed(2)}`,"Spent"]} contentStyle={{borderRadius:"10px",border:`1px solid ${c.border}`,fontFamily:f,fontSize:"13px"}} cursor={{fill:`${c.pl}80`}}/>
              <Bar dataKey="value" radius={[6,6,0,0]}>{catData.map(e=><Cell key={e.name} fill={CC[e.name]||c.p}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        : <>
            {/* Total header replaces bar chart */}
            <div style={{background:c.pl,borderRadius:"14px",padding:"18px 22px",marginBottom:4,display:"flex",alignItems:"center",gap:"14px",border:`1.5px solid ${CC[catFilter]||c.p}40`}}>
              <div style={{width:16,height:16,borderRadius:"50%",background:CC[catFilter]||c.p,flexShrink:0}}/>
              <div>
                <div style={{fontSize:"12px",color:c.muted,marginBottom:2,fontFamily:f}}>{tr.totalSpentIn} <strong>{catLabel(catFilter)}</strong> — {periodLabel}</div>
                <div style={{fontSize:"28px",fontWeight:800,color:CC[catFilter]||c.p,fontFamily:f}}>
                  {fmt(filtered.filter(t=>t.cat===catFilter&&t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0))}
                </div>
                <div style={{fontSize:"11px",color:c.muted,marginTop:2}}>{filtered.filter(t=>t.cat===catFilter&&t.amount<0).length} {tr.transactions}</div>
              </div>
            </div>
            <MerchantBreakdown theme={theme} txns={filtered} cat={catFilter} lang={lang}/>
          </>
      }
    </div>}
    {/* ── Journal (month-nav) ── */}
    {isVisible("journal")&&<div style={{background:c.card,borderRadius:"16px",padding:"22px 24px",border:`1.5px solid ${c.border}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:"10px"}}>
        <div style={{fontWeight:700,color:c.text,fontSize:"15px"}}>📄 {w.txn}</div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <button onClick={prevJM} style={{padding:"6px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,background:"white",color:c.p,cursor:"pointer",fontSize:"14px",fontWeight:700}}>←</button>
          <span style={{fontSize:"13px",fontWeight:700,color:c.text,minWidth:"130px",textAlign:"center",textTransform:"capitalize"}}>{journalLabel}</span>
          <button onClick={nextJM} disabled={isCurrentMonth} style={{padding:"6px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,background:isCurrentMonth?"#f0f0f0":"white",color:isCurrentMonth?c.muted:c.p,cursor:isCurrentMonth?"default":"pointer",fontSize:"14px",fontWeight:700}}>→</button>
          {transactions.length>0&&<button onClick={onExport} style={{padding:"6px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,background:"transparent",color:c.p,cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:f}}>📥 Export</button>}
        </div>
      </div>
      {journalTxns.length===0
        ?<div style={{color:c.muted,fontSize:"13px",textAlign:"center",padding:"20px"}}>{tr.noTxns} — {lang==="es"?"usa ← para volver":"use ← to go back"}</div>
        :<div style={{overflowX:"auto"}}>
          <div style={{fontSize:"12px",color:c.muted,marginBottom:8}}>{journalTxns.length} {tr.transactions} · {journalTxns.filter(t=>t.amount<0).length} {tr.expenses2} · {fmt(Math.abs(journalTxns.filter(t=>t.amount<0).reduce((s,t)=>s+t.amount,0)))} {tr.spent}</div>
          {isMobile
            ?<div style={{borderRadius:"12px",border:`1px solid ${c.border}`,overflow:"hidden"}}>
                {journalTxns.map(t=><TxnRow key={t.id} t={t} theme={theme} onCatChange={onCatChange} onAddReminder={onAddReminder} comment={comments[t.id]} onCommentSave={onCommentSave} allCats={allCats} reimbursed={reimbursed[t.id]} onMarkReimbursed={onMarkReimbursed} allTransactions={transactions} lang={lang}/>)}
              </div>
            :<table style={{width:"100%",borderCollapse:"collapse",fontFamily:f}}>
                <thead><tr style={{borderBottom:`2px solid ${c.border}`}}>{["Date","Description","Category","Amount",""].map(h=><th key={h} style={{padding:"7px 12px",textAlign:"left",fontSize:"10px",color:c.muted,textTransform:"uppercase",letterSpacing:1.2,fontWeight:700}}>{h}</th>)}</tr></thead>
                <tbody>{journalTxns.map(t=><TxnRow key={t.id} t={t} theme={theme} onCatChange={onCatChange} onAddReminder={onAddReminder} comment={comments[t.id]} onCommentSave={onCommentSave} allCats={allCats} reimbursed={reimbursed[t.id]} onMarkReimbursed={onMarkReimbursed} allTransactions={transactions} lang={lang}/>)}</tbody>
              </table>}
        </div>}
    </div>}
    {/* ── Income transactions widget ── */}
    {isVisible("income")&&hasData&&<div style={{background:c.card,borderRadius:"16px",padding:"22px 24px",border:`1.5px solid ${c.border}`}}>
      <div style={{fontWeight:700,color:c.text,fontSize:"15px",marginBottom:14}}>💰 {w.inc} — {periodLabel}</div>
      {filtered.filter(t=>t.amount>0).length===0
        ?<div style={{color:c.muted,fontSize:"13px",textAlign:"center",padding:"20px"}}>{lang==="es"?"Sin ingresos en este período":"No income in this period"}</div>
        :<>
          <div style={{fontSize:"12px",color:c.muted,marginBottom:10}}>
            {filtered.filter(t=>t.amount>0).length} {tr.transactions} · <span style={{color:"#10b981",fontWeight:700}}>+{fmt(totalInc)} total</span>
          </div>
          <div style={{overflowX:"auto",borderRadius:"12px",border:`1.5px solid ${c.border}`}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontFamily:f}}>
              <thead><tr style={{borderBottom:`2px solid ${c.border}`,background:c.pl}}>{(isMobile?["Date","Amount"]:["Date","From","Amount"]).map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:"10px",color:c.muted,textTransform:"uppercase",letterSpacing:1.2,fontWeight:700}}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.filter(t=>t.amount>0).map(t=>(
                  <tr key={t.id} style={{borderBottom:`1px solid ${c.border}`}}
                    onMouseEnter={e=>e.currentTarget.style.background=c.pl}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{padding:"9px 12px",fontSize:"12px",color:c.muted,whiteSpace:"nowrap"}}>{fmtShort(t.date)}</td>
                    {!isMobile&&<td style={{padding:"9px 12px",fontSize:"13px",color:c.text,maxWidth:"260px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{extractMerchant(t.desc)}</td>}
                    <td style={{padding:"9px 12px",fontSize:"13px",fontWeight:700,color:"#10b981",textAlign:"right",whiteSpace:"nowrap"}}>+{fmt(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>}
    </div>}
    {/* ── Subscriptions & Recurring widget ── */}
    {isVisible("subscriptions")&&<div style={{background:c.card,borderRadius:"16px",padding:"22px 24px",border:`1.5px solid ${c.border}`}}>
      <div style={{fontWeight:700,color:c.text,fontSize:"15px",marginBottom:14}}>📦 Subscriptions & Recurring</div>
      {paymentsWithCountdown.length===0
        ?<div style={{color:c.muted,fontSize:"13px",textAlign:"center",padding:"20px"}}>No auto payments set — add them in <strong>Auto Pay</strong></div>
        :<>
          <div style={{borderRadius:"12px",border:`1.5px solid ${c.border}`,overflow:"hidden",marginBottom:10}}>
            {paymentsWithCountdown.map((p,i)=>(
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:"12px",padding:"13px 18px",borderBottom:i<paymentsWithCountdown.length-1?`1px solid ${c.border}`:"none"}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:CC.Subscriptions||"#9c27b0",flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:"14px",color:c.text}}>{p.name}</div>
                  <div style={{fontSize:"11px",color:c.muted,marginTop:1}}>
                    {p.frequency==="yearly"
                      ?`yearly · ${p.month?`month ${p.month}, `:``}day ${p.day}`
                      :`monthly · day ${p.day}`}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontWeight:700,fontSize:"14px",color:c.danger}}>
                    -{fmt(p.amount)}{p.frequency==="yearly"?"/yr":"/mo"}
                  </div>
                  {p.frequency==="yearly"&&<div style={{fontSize:"10px",color:c.muted}}>{fmt(+(p.amount/12).toFixed(2))}/mo equiv.</div>}
                </div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",fontSize:"12px",fontWeight:700,color:c.muted}}>
            Monthly total: <span style={{color:c.danger,marginLeft:5}}>-{fmt(paymentsWithCountdown.reduce((s,p)=>s+(p.frequency==="yearly"?+(p.amount/12).toFixed(2):p.amount),0))}/mo</span>
          </div>
        </>}
    </div>}
  </div>;
}

// ── Budgets Page ──────────────────────────────────────────────────────────────
function BudgetsPage({theme,budgets,setBudgets,catGroups,setCatGroups,allTransactions,allCats,lang="es"}) {
  const {c,font:f}=theme;
  const tr=T[lang]||T.en;
  const catLabel=cat=>(CAT_LABELS[lang]||CAT_LABELS.en)[cat]||cat;
  const [editing,setEditing]=useState(null),[val,setVal]=useState("");
  const [showNewGroup,setShowNewGroup]=useState(false),[groupName,setGroupName]=useState(""),[groupCats,setGroupCats]=useState([]);
  const [period,setPeriod]=useState("month"); // "month" or "week"
  const [addCat,setAddCat]=useState(""),[addVal,setAddVal]=useState(""),[showAdd,setShowAdd]=useState(false);

  // Filter transactions to current month or week
  const now=new Date();
  const periodTxns=allTransactions.filter(t=>{
    const d=new Date(t.date);
    if(period==="month") return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();
    // current week
    const day=now.getDay(),mo=day===0?-6:1-day;
    const wkStart=new Date(now);wkStart.setDate(now.getDate()+mo);wkStart.setHours(0,0,0,0);
    const wkEnd=new Date(wkStart);wkEnd.setDate(wkStart.getDate()+6);wkEnd.setHours(23,59,59);
    return d>=wkStart&&d<=wkEnd;
  });
  const periodSpent=Object.entries(periodTxns.filter(t=>t.amount<0).reduce((acc,t)=>({...acc,[t.cat]:(acc[t.cat]||0)+Math.abs(t.amount)}),{})).reduce((o,[k,v])=>({...o,[k]:+v.toFixed(2)}),{});
  // For budget limits: monthly is stored, weekly = monthly÷4
  const effectiveLimit=cat=>period==="week"?+((budgets[cat]||0)/4).toFixed(2):(budgets[cat]||0);
  const periodLabel=period==="month"?now.toLocaleDateString("es-ES",{month:"long",year:"numeric"}):"this week";

  return <div style={{maxWidth:"640px",fontFamily:f}}>
    <h2 style={{color:c.text,marginBottom:6,fontSize:"22px",fontWeight:800}}>🎯 {theme.w.budget}</h2>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:"8px"}}>
      <p style={{color:c.muted,fontSize:"14px"}}>{tr.budgetSub||"Limits vs actual spending"} — <strong>{periodLabel}</strong></p>
      <div style={{display:"flex",gap:"6px"}}>
        {[["month",`📅 ${tr.month}`],["week",`🗓 ${tr.week}`]].map(([p,lbl])=>(
          <button key={p} onClick={()=>setPeriod(p)} style={{padding:"5px 13px",borderRadius:"16px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:f,background:period===p?c.p:"white",color:period===p?"white":c.muted,boxShadow:period===p?`0 2px 8px ${c.p}40`:`inset 0 0 0 1.5px ${c.border}`}}>{lbl}</button>
        ))}
      </div>
    </div>
    {/* Category groups */}
    {catGroups.length>0&&<div style={{marginBottom:20}}>
      <div style={{fontSize:"13px",fontWeight:700,color:c.text,marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>🗂 {tr.categoryGroups}</div>
      {catGroups.map(g=>{
        const total=g.cats.reduce((s,cat)=>s+(periodSpent[cat]||0),0);
        const limit=g.cats.reduce((s,cat)=>s+(budgets[cat]||0),0);
        const pct=limit?Math.min(total/limit*100,100):0;
        return <div key={g.id} style={{background:c.card,borderRadius:"14px",padding:"16px 20px",marginBottom:8,border:`1.5px solid ${c.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div><div style={{fontWeight:700,color:c.text,fontSize:"15px"}}>{g.name}</div><div style={{fontSize:"11px",color:c.muted,marginTop:2}}>{g.cats.join(" + ")}</div></div>
            <div style={{textAlign:"right"}}>
              <div style={{fontWeight:700,fontSize:"14px",color:c.text}}>{fmt(total)}{limit?` / ${fmt(limit)}`:""}</div>
              <button onClick={()=>setCatGroups(gs=>gs.filter(x=>x.id!==g.id))} style={{fontSize:"11px",color:c.muted,background:"transparent",border:"none",cursor:"pointer",fontFamily:f}}>{tr.removeGroup}</button>
            </div>
          </div>
          {limit>0&&<div style={{height:"7px",borderRadius:"7px",background:c.pl,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,borderRadius:"7px",background:pct>=100?c.danger:pct>=80?"#f59e0b":c.p,transition:"width 0.5s"}}/></div>}
        </div>;
      })}
    </div>}
    {/* New group form */}
    <div style={{background:c.card,borderRadius:"14px",padding:"18px 20px",marginBottom:20,border:`1.5px dashed ${c.border}`}}>
      {!showNewGroup?<button onClick={()=>setShowNewGroup(true)} style={{background:"transparent",border:"none",color:c.p,cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:f}}>{tr.createGroup}</button>
        :<div>
          <div style={{fontSize:"13px",fontWeight:700,color:c.text,marginBottom:10}}>{tr.newGroup}</div>
          <input value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder={tr.groupName} style={{width:"100%",padding:"9px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white",marginBottom:10}}/>
          <div style={{fontSize:"12px",color:c.muted,marginBottom:8}}>{tr.selectCategories}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:12}}>
            {ALL_CATS.map(cat=><button key={cat} onClick={()=>setGroupCats(cs=>cs.includes(cat)?cs.filter(x=>x!==cat):[...cs,cat])}
              style={{padding:"4px 11px",borderRadius:"20px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:600,background:groupCats.includes(cat)?(CC[cat]||c.p):"transparent",color:groupCats.includes(cat)?"white":c.muted,outline:`1.5px solid ${groupCats.includes(cat)?(CC[cat]||c.p):c.border}`}}>{catLabel(cat)}</button>)}
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={()=>{if(groupName.trim()&&groupCats.length>0){setCatGroups(gs=>[...gs,{id:Date.now(),name:groupName.trim(),cats:groupCats}]);setGroupName("");setGroupCats([]);setShowNewGroup(false);}}} style={{padding:"8px 16px",borderRadius:"10px",border:"none",background:c.p,color:"white",cursor:"pointer",fontSize:"13px",fontWeight:700,fontFamily:f}}>{tr.createGroupBtn}</button>
            <button onClick={()=>{setShowNewGroup(false);setGroupName("");setGroupCats([]);}} style={{padding:"8px 14px",borderRadius:"10px",border:`1.5px solid ${c.border}`,background:"transparent",color:c.muted,cursor:"pointer",fontSize:"13px",fontFamily:f}}>{tr.cancel}</button>
          </div>
        </div>}
    </div>
    {/* Individual budgets — only categories with a limit set */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{fontSize:"13px",fontWeight:700,color:c.text,textTransform:"uppercase",letterSpacing:1}}>{tr.individualLimits} {period==="week"&&<span style={{fontWeight:400,color:c.muted,fontSize:"11px",textTransform:"none"}}>({tr.weeklyNote})</span>}</div>
      <button onClick={()=>{const u=allCats.filter(cat=>!(budgets[cat]>0));setAddCat(u[0]||"");setShowAdd(s=>!s);}}
        style={{padding:"5px 12px",borderRadius:"16px",border:"none",background:c.p,color:"white",cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:f}}>+ Add</button>
    </div>
    {showAdd&&<div style={{background:"#f9fafb",borderRadius:"12px",padding:"14px 18px",marginBottom:12,border:`1.5px dashed ${c.p}`,display:"flex",gap:"10px",alignItems:"center",flexWrap:"wrap"}}>
      <select value={addCat} onChange={e=>setAddCat(e.target.value)}
        style={{padding:"7px 10px",borderRadius:"9px",border:`1.5px solid ${c.border}`,fontSize:"13px",background:"white",color:c.text,fontFamily:f,outline:"none"}}>
        {allCats.filter(cat=>!(budgets[cat]>0)).map(cat=><option key={cat} value={cat}>{cat}</option>)}
      </select>
      <input value={addVal} onChange={e=>setAddVal(e.target.value)} type="number" placeholder="€/month" min="1"
        style={{width:"110px",padding:"7px 10px",borderRadius:"9px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,background:"white"}}/>
      <button onClick={()=>{if(addCat&&+addVal>0){setBudgets(b=>({...b,[addCat]:+addVal}));setAddVal("");setShowAdd(false);}}}
        style={{padding:"7px 14px",borderRadius:"9px",border:"none",background:c.p,color:"white",cursor:"pointer",fontSize:"13px",fontWeight:700,fontFamily:f}}>Save</button>
      <button onClick={()=>setShowAdd(false)} style={{padding:"7px 10px",borderRadius:"9px",border:`1.5px solid ${c.border}`,background:"white",color:c.muted,cursor:"pointer",fontSize:"13px"}}>Cancel</button>
    </div>}
    {allCats.filter(cat=>budgets[cat]>0).length===0&&!showAdd&&<div style={{color:c.muted,fontSize:"13px",textAlign:"center",padding:"20px 0"}}>No budgets set yet — click <strong>+ Add</strong> to create one</div>}
    {allCats.filter(cat=>budgets[cat]>0).map(cat=>{
      const monthlyLimit=budgets[cat];
      const limit=effectiveLimit(cat);
      const spent=periodSpent[cat]||0;
      const pct=limit?+(Math.min(spent/limit*100,100)).toFixed(0):0;
      return <div key={cat} style={{background:c.card,borderRadius:"14px",padding:"18px 22px",marginBottom:10,border:`1.5px solid ${c.border}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}><div style={{width:10,height:10,borderRadius:"50%",background:CC[cat]||c.p}}/><span style={{fontWeight:700,color:c.text,fontSize:"15px"}}>{catLabel(cat)}</span></div>
          {editing===cat?<div style={{display:"flex",gap:"6px"}}>
            <input value={val} onChange={e=>setVal(e.target.value)} type="number" autoFocus onKeyDown={e=>{if(e.key==="Enter"){setBudgets(b=>({...b,[cat]:+val}));setEditing(null);}}} style={{width:"80px",padding:"6px 8px",borderRadius:"8px",border:`2px solid ${c.p}`,fontSize:"14px",outline:"none",fontFamily:f,background:"white"}}/>
            <span style={{fontSize:"11px",color:c.muted,alignSelf:"center"}}>/mo</span>
            <button onClick={()=>{setBudgets(b=>({...b,[cat]:+val}));setEditing(null);}} style={{padding:"6px 12px",borderRadius:"8px",border:"none",background:c.p,color:"white",cursor:"pointer",fontSize:"12px",fontWeight:700}}>Set</button>
            <button onClick={()=>setEditing(null)} style={{padding:"6px 10px",borderRadius:"8px",border:`1.5px solid ${c.border}`,background:"transparent",cursor:"pointer",fontSize:"13px",color:c.muted}}>✕</button>
          </div>:<div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{color:c.muted,fontSize:"12px"}}>{fmt(spent)} / {fmt(limit)}{period==="week"?" /wk":" /mo"}</span>
            {period==="week"&&<span style={{fontSize:"10px",color:c.muted}}>(€{monthlyLimit}/mo)</span>}
            <button onClick={()=>{setEditing(cat);setVal(monthlyLimit);}} style={{padding:"4px 10px",borderRadius:"8px",border:`1.5px solid ${c.border}`,background:"transparent",color:c.p,cursor:"pointer",fontSize:"12px",fontWeight:700,fontFamily:f}}>{tr.edit}</button>
            <button onClick={()=>setBudgets(b=>{const n={...b};delete n[cat];return n;})} title="Remove budget" style={{padding:"4px 8px",borderRadius:"8px",border:"none",background:"transparent",color:c.muted,cursor:"pointer",fontSize:"14px",lineHeight:1}}>✕</button>
          </div>}
        </div>
        <div style={{height:"7px",borderRadius:"7px",background:c.pl,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,borderRadius:"7px",background:pct>=100?c.danger:pct>=80?"#f59e0b":CC[cat]||c.p,transition:"width 0.5s"}}/></div>
        {pct>=100&&<div style={{fontSize:"11px",color:c.danger,marginTop:3}}>{theme.w.over}</div>}
      </div>;
    })}
  </div>;
}

// ── Reminders Page ────────────────────────────────────────────────────────────
function RemindersPage({theme,reminders,setReminders,lang="es"}) {
  const {c,font:f}=theme;
  const tr=T[lang]||T.en;
  const[text,setText]=useState(""),[repeat,setRepeat]=useState("once");
  const add=()=>{if(!text.trim())return;setReminders(rs=>[...rs,{id:Date.now(),text:text.trim(),done:false,repeat}]);setText("");};
  return <div style={{maxWidth:"520px",fontFamily:f}}>
    <h2 style={{color:c.text,marginBottom:6,fontSize:"22px",fontWeight:800}}>📋 {tr.remindersTitle}</h2>
    <p style={{color:c.muted,fontSize:"14px",marginBottom:22}}>{tr.remindersSub}</p>
    <div style={{background:c.card,borderRadius:"16px",padding:"20px",marginBottom:18,border:`1.5px solid ${c.border}`}}>
      <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder={tr.placeholder} style={{width:"100%",padding:"10px 14px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"14px",outline:"none",fontFamily:f,color:c.text,marginBottom:10,background:"white"}}/>
      <div style={{display:"flex",gap:"7px",marginBottom:12}}>{["once","weekly","monthly"].map(r=><button key={r} onClick={()=>setRepeat(r)} style={{padding:"5px 14px",borderRadius:"20px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:f,background:repeat===r?c.p:"transparent",color:repeat===r?"white":c.muted,outline:`1.5px solid ${repeat===r?c.p:c.border}`}}>{r==="once"?tr.once:r==="weekly"?tr.weekly:tr.monthly}</button>)}</div>
      <button onClick={add} style={{padding:"9px 20px",borderRadius:"10px",border:"none",background:c.p,color:"white",cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:f}}>{tr.addReminderBtn}</button>
    </div>
    {reminders.map(r=><div key={r.id} style={{background:c.card,borderRadius:"12px",padding:"14px 18px",marginBottom:8,border:`1.5px solid ${r.done?c.pl:c.border}`,display:"flex",alignItems:"center",gap:"12px",opacity:r.done?0.55:1}}>
      <div onClick={()=>setReminders(rs=>rs.map(x=>x.id===r.id?{...x,done:!x.done}:x))} style={{width:24,height:24,borderRadius:"50%",flexShrink:0,cursor:"pointer",border:`2px solid ${r.done?c.p:c.border}`,background:r.done?c.p:"white",display:"flex",alignItems:"center",justifyContent:"center"}}>{r.done&&<span style={{color:"white",fontSize:"13px"}}>✓</span>}</div>
      <div style={{flex:1}}><div style={{fontSize:"14px",fontWeight:600,color:c.text,textDecoration:r.done?"line-through":"none"}}>{r.text}</div><div style={{fontSize:"11px",color:c.muted,marginTop:2}}>🔁 {r.repeat}</div></div>
      <button onClick={()=>setReminders(rs=>rs.filter(x=>x.id!==r.id))} style={{background:"transparent",border:"none",color:c.muted,cursor:"pointer",fontSize:"18px",padding:"4px 6px"}}>✕</button>
    </div>)}
  </div>;
}

// ── Auto Pay Page ─────────────────────────────────────────────────────────────
function AutoPayPage({theme,autoPayments,setAutoPayments,paymentsWithCountdown,lang="es"}) {
  const {c,font:f}=theme;
  const tr=T[lang]||T.en;
  const[name,setName]=useState(""),[amt,setAmt]=useState(""),[day,setDay]=useState(""),[month,setMonth]=useState(""),[freq,setFreq]=useState("monthly");
  const add=()=>{
    if(!name||!amt||!day)return;
    if(freq==="yearly"&&!month)return;
    setAutoPayments(ps=>[...ps,{id:Date.now(),name,amount:+amt,day:+day,month:freq==="yearly"?+month:undefined,frequency:freq}]);
    setName("");setAmt("");setDay("");setMonth("");
  };
  return <div style={{maxWidth:"580px",fontFamily:f}}>
    <h2 style={{color:c.text,marginBottom:6,fontSize:"22px",fontWeight:800}}>💳 {tr.autoPayTitle}</h2>
    <p style={{color:c.muted,fontSize:"14px",marginBottom:20}}>{tr.autoPaySub}</p>
    <div style={{background:`${c.p}14`,borderRadius:"14px",padding:"16px 22px",marginBottom:20,border:`1.5px solid ${c.p}30`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontSize:"11px",color:c.muted,textTransform:"uppercase",letterSpacing:1}}>{tr.monthlyCommitments}</div><div style={{fontSize:"28px",fontWeight:800,color:c.p}}>-€{autoPayments.reduce((s,p)=>s+(p.frequency==="yearly"?p.amount/12:p.amount),0).toFixed(2)}/mo</div></div>
      <div style={{fontSize:"12px",color:c.muted}}>{autoPayments.length} {tr.charges}</div>
    </div>
    {paymentsWithCountdown.map(p=><div key={p.id} style={{background:c.card,borderRadius:"14px",padding:"14px 18px",marginBottom:10,border:`1.5px solid ${p.days<=3?c.danger:p.days<=7?"#f59e0b":c.border}`,display:"flex",alignItems:"center",gap:"14px"}}>
      <div style={{width:50,height:50,borderRadius:"12px",flexShrink:0,background:p.days<=3?`${c.danger}20`:p.days<=7?"#f59e0b20":c.pl,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{fontSize:"20px",fontWeight:800,lineHeight:1,color:p.days<=3?c.danger:p.days<=7?"#d97706":c.p}}>{p.days}</div>
        <div style={{fontSize:"9px",color:c.muted}}>days</div>
      </div>
      <div style={{flex:1}}><div style={{fontWeight:700,color:c.text,fontSize:"15px"}}>{p.name}</div><div style={{fontSize:"12px",color:c.muted}}>{p.frequency==="yearly"?`${tr.everyYear}${p.month?`, ${lang==="es"?"mes":"month"} ${p.month}`:""}, ${lang==="es"?"día":"day"} ${p.day}`:`${tr.everyMonth}, ${lang==="es"?"día":"day"} ${p.day}`}</div></div>
      <div style={{textAlign:"right"}}><div style={{fontWeight:700,fontSize:"15px",color:c.text}}>-€{p.amount.toFixed(2)}{p.frequency==="yearly"?" /yr":"/mo"}</div><button onClick={()=>setAutoPayments(ps=>ps.filter(x=>x.id!==p.id))} style={{fontSize:"11px",color:c.muted,background:"transparent",border:"none",cursor:"pointer",fontFamily:f}}>{tr.remove}</button></div>
    </div>)}
    <div style={{background:c.card,borderRadius:"16px",padding:"20px",marginTop:16,border:`1.5px dashed ${c.border}`}}>
      <div style={{fontSize:"13px",fontWeight:700,color:c.text,marginBottom:12}}>+ {tr.addPayment}</div>
      <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:10}}>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder={tr.name} style={{flex:"2 1 160px",padding:"9px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white"}}/>
        <input value={amt} onChange={e=>setAmt(e.target.value)} placeholder={tr.amount} type="number" style={{flex:"1 1 90px",padding:"9px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white"}}/>
        {freq==="yearly"&&<input value={month} onChange={e=>setMonth(e.target.value)} placeholder={lang==="es"?"Mes (1-12)":"Month (1-12)"} type="number" min="1" max="12" style={{flex:"1 1 90px",padding:"9px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white"}}/>}
        <input value={day} onChange={e=>setDay(e.target.value)} placeholder={`${tr.dayOfMonth} (1-31)`} type="number" min="1" max="31" style={{flex:"1 1 80px",padding:"9px 12px",borderRadius:"10px",border:`1.5px solid ${c.border}`,fontSize:"13px",outline:"none",fontFamily:f,color:c.text,background:"white"}}/>
      </div>
      <div style={{display:"flex",gap:"6px",marginBottom:12}}>{["monthly","yearly"].map(fr=><button key={fr} onClick={()=>{setFreq(fr);setMonth("");setDay("");}} style={{padding:"5px 13px",borderRadius:"16px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:600,fontFamily:f,background:freq===fr?c.p:"transparent",color:freq===fr?"white":c.muted,outline:`1.5px solid ${freq===fr?c.p:c.border}`}}>{fr==="monthly"?tr.everyMonth:tr.everyYear}</button>)}</div>
      <button onClick={add} style={{padding:"10px 20px",borderRadius:"10px",border:"none",background:c.p,color:"white",cursor:"pointer",fontWeight:700,fontSize:"13px",fontFamily:f}}>{tr.addPayment}</button>
    </div>
  </div>;
}

// ── Data Page ─────────────────────────────────────────────────────────────────
function DataPage({theme,transactions,onUpload,onCatChange,comments,onCommentSave,onAddReminder,allCats,reimbursed,onMarkReimbursed,merchantMemory,onClearMemory,onExport,lang="es"}) {
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
    const merged={txns:[],comments:{},isMonedaExport:results.every(r=>r.isMonedaExport),
      savedAutoPayments:[],savedReminders:[],savedBudgets:{},savedCustomCats:[]};
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

// ── Onboarding ────────────────────────────────────────────────────────────────
function Onboarding({onDone}) {
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
      <button onClick={()=>setStage("quickname")} style={{padding:"10px 32px",borderRadius:"14px",border:"2px solid #d1d5db",background:"white",color:"#6b7280",fontSize:"14px",fontWeight:600,cursor:"pointer",fontFamily:'"Inter",sans-serif'}}>{tl.quickStart}</button>
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

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [onboarded,setOnboarded]       = useState(false);
  const [user,setUser]                 = useState(null);
  const [page,setPage]                 = useState("dashboard");
  const [timeFilter,setTimeFilter]     = useState("month");
  const [compareMode,setCompareMode]   = useState(false);
  const [customRange,setCustomRange]   = useState({start:"",end:""});
  const [transactions,setTransactions] = useState([]);
  const [comments,setComments]         = useState({});
  const [budgets,setBudgets]           = useState({});
  const [catGroups,setCatGroups]       = useState([]);
  const [customCats,setCustomCats]     = useState([]);
  const [reminders,setReminders]       = useState([]);
  const [autoPayments,setAutoPayments] = useState([]);
  const [toast,setToast]               = useState(null);
  const [reimbursed,setReimbursed]     = useState({});
  // Merchant memory: {extractedMerchantName: category} — persists across uploads
  const [merchantMemory,setMerchantMemory] = useState({});
  const [widgetConfig,setWidgetConfig]     = useState([]);
  const [lang,setLang]                     = useState("es");
  const updateMemory = useCallback((txns)=>{
    setMerchantMemory(prev=>{
      const next={...prev};
      for(const t of txns){ if(t.cat&&t.cat!=="Income"){ const m=extractMerchant(t.desc); next[m]=t.cat; } }
      return next;
    });
  },[]);
  const [pending,setPending]           = useState(null);
  const [detectedSubs,setDetectedSubs] = useState([]);
  const [unknownTxns,setUnknownTxns]   = useState([]);
  const [showSubVerify,setShowSubVerify]   = useState(false);
  const [showCatReview,setShowCatReview]   = useState(false);
  const [showBudgetWiz,setShowBudgetWiz]   = useState(false);
  const [isFirstUpload,setIsFirstUpload]   = useState(true);
  const [modalSteps,setModalSteps]     = useState([]);

  useEffect(()=>{const s=document.createElement("style");s.textContent=`@import url('${FONT_URL}');*{box-sizing:border-box;margin:0;padding:0}body,#root{margin:0;padding:0;overscroll-behavior-y:none}@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes pop{0%{opacity:0;transform:scale(0.88)}100%{opacity:1;transform:scale(1)}}@keyframes slideUp{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.18);border-radius:3px}`;document.head.appendChild(s);return()=>s.remove();},[]);

  const showToast=(msg,type="success")=>setToast({msg,type});

  const finalizeTxns=useCallback((txns,filename)=>{
    const sorted=[...txns].sort((a,b)=>new Date(b.date)-new Date(a.date));
    setTransactions(sorted);
    updateMemory(sorted);
    showToast(`✅ Loaded ${sorted.length} transactions`);
    setPage("dashboard");
    if(isFirstUpload&&!user?.quickStart){setShowBudgetWiz(true);}
    setIsFirstUpload(false);
  },[isFirstUpload,updateMemory,user]);

  const handleUpload=useCallback((parsed,error,filename)=>{
    if(error){showToast(error,"error");return;}

    // parsed is now {txns, comments, isMonedaExport, savedAutoPayments, savedReminders, savedBudgets, savedCustomCats, savedWidgetConfig}
    const {txns:rawTxns, comments:restoredComments={}, isMonedaExport=false, savedAutoPayments=[], savedReminders=[], savedBudgets={}, savedCustomCats=[], savedWidgetConfig=[], savedProfile=null} = parsed;

    // Restore comments from the export
    if(Object.keys(restoredComments).length>0){
      setComments(prev=>({...prev,...restoredComments}));
    }

    // For Moneda re-uploads: all cats already set, skip classify entirely
    if(isMonedaExport){
      const sorted=[...rawTxns].sort((a,b)=>new Date(b.date)-new Date(a.date));
      setTransactions(sorted);
      updateMemory(sorted);
      // Restore custom categories from Config sheet + any non-standard cats in transactions
      const txnCats=sorted.filter(t=>t.cat&&t.cat!=="Income").map(t=>t.cat);
      const allRestoredCats=[...new Set([...savedCustomCats,...txnCats])].filter(c=>!ALL_CATS.includes(c));
      if(allRestoredCats.length>0){setCustomCats(c=>[...new Set([...c,...allRestoredCats])]);ALL_CATS=[...ALL_CATS,...allRestoredCats];}
      // Restore auto payments (merge, don't duplicate by name)
      if(savedAutoPayments.length>0) setAutoPayments(ps=>{const names=new Set(ps.map(p=>p.name));return [...ps,...savedAutoPayments.filter(p=>!names.has(p.name))];});
      // Restore reminders
      if(savedReminders.length>0) setReminders(rs=>[...rs,...savedReminders]);
      // Restore budgets (merge)
      if(Object.keys(savedBudgets).length>0) setBudgets(prev=>({...savedBudgets,...prev}));
      // Restore widget order/visibility preferences
      if(savedWidgetConfig.length>0) setWidgetConfig(savedWidgetConfig);
      // Restore user profile (name, theme, language, avatar, goal) — silent
      if(savedProfile){
        setUser(prev=>({...(prev||{}),name:savedProfile.userName||prev?.name||"",themeId:savedProfile.themeId||prev?.themeId||"nature",avatar:savedProfile.avatar||prev?.avatar||"",goal:savedProfile.goal||prev?.goal||"know",lang:savedProfile.lang||prev?.lang||"es"}));
        if(savedProfile.lang) setLang(savedProfile.lang);
      }
      const restoredCats=sorted.filter(t=>t.cat&&t.cat!=="Income").length;
      showToast(`✅ Restored ${sorted.length} transactions · ${restoredCats} with saved categories`);
      setPage("dashboard");
      if(isFirstUpload&&!user?.quickStart){setShowBudgetWiz(true);}
      setIsFirstUpload(false);
      return;
    }

    // Sync any custom cats stored in merchant memory into ALL_CATS so CategoryReview shows them
    const memCustomCats=[...new Set(Object.values(merchantMemory).filter(c=>c&&c!=="Income"&&!ALL_CATS.includes(c)))];
    if(memCustomCats.length>0){setCustomCats(c=>[...new Set([...c,...memCustomCats])]);ALL_CATS=[...ALL_CATS,...memCustomCats];}

    // Standard Bank statement upload — apply merchant memory then classify unknowns
    let autoClassified=0;
    const preClassified=rawTxns.map(t=>{
      if(t.cat===null){
        const merchant=extractMerchant(t.desc);
        if(merchantMemory[merchant]){autoClassified++;return{...t,cat:merchantMemory[merchant]};}
      }
      return t;
    });
    if(autoClassified>0) showToast(`🧠 Auto-classified ${autoClassified} known merchant${autoClassified!==1?"s":""} from memory`,"info");
    const namedSubs=detectSubscriptions(preClassified);
    const subs=[...namedSubs,...detectRecurring(preClassified,namedSubs)];
    const unknowns=preClassified.filter(t=>t.cat===null);
    const steps=[];
    if(subs.length>0)steps.push("📦 Subscriptions");
    if(unknowns.length>0)steps.push("🤔 Classify");
    if(isFirstUpload&&!user?.quickStart)steps.push("🎯 Budgets");
    setModalSteps(steps);
    setPending({txns:preClassified,filename});
    setDetectedSubs(subs);setUnknownTxns(unknowns);
    if(subs.length>0)setShowSubVerify(true);
    else if(unknowns.length>0)setShowCatReview(true);
    else finalizeTxns(preClassified,filename);
  },[finalizeTxns,isFirstUpload,merchantMemory,updateMemory,user]);

  const handleSubDone=useCallback((confirmed)=>{
    setShowSubVerify(false);
    confirmed.forEach(s=>setAutoPayments(ps=>ps.some(p=>p.name===s.name)?ps:[...ps,{id:Date.now()+Math.random(),name:s.name,amount:s.frequency==="yearly"?+(s.amount/12).toFixed(2):s.amount,day:s.day,frequency:s.frequency}]));
    if(unknownTxns.length>0)setShowCatReview(true);
    else if(pending)finalizeTxns(pending.txns,pending.filename);
  },[unknownTxns,pending,finalizeTxns]);

  const handleCatDone=useCallback((assignments,newCats)=>{
    setShowCatReview(false);
    if(newCats?.length){setCustomCats(c=>[...new Set([...c,...newCats])]);ALL_CATS=[...ALL_CATS,...newCats.filter(n=>!ALL_CATS.includes(n))];}
    if(!pending)return;
    const resolved=pending.txns.map(t=>t.cat===null?{...t,cat:assignments[t.id]||"Other"}:t);
    // Persist the merchant→category assignments to memory
    setMerchantMemory(prev=>{
      const next={...prev};
      for(const [txnId,cat] of Object.entries(assignments)){
        const t=resolved.find(x=>x.id===txnId);
        if(t){next[extractMerchant(t.desc)]=cat;}
      }
      return next;
    });
    finalizeTxns(resolved,pending.filename);
  },[pending,finalizeTxns]);

  const onCatChange=useCallback((id,cat)=>{
    setTransactions(ts=>{
      const t=ts.find(x=>x.id===id);
      if(!t) return ts;
      const merchant=extractMerchant(t.desc);
      setMerchantMemory(prev=>({...prev,[merchant]:cat}));
      // Update every transaction from the same merchant (not income)
      const updated=ts.map(x=>extractMerchant(x.desc)===merchant&&x.cat!=="Income"?{...x,cat}:x);
      const changedCount=updated.filter((x,i)=>x!==ts[i]).length;
      if(changedCount>1) setToast({msg:`Updated ${changedCount} transactions for "${merchant}" → ${cat}`,type:"info"});
      return updated;
    });
  },[]);
  const onCommentSave=useCallback((id,text)=>setComments(c=>({...c,[id]:text})),[]);
  const onAddReminder=useCallback(r=>setReminders(rs=>[...rs,r]),[]);
  const onMarkReimbursed=useCallback((id,data)=>setReimbursed(r=>data?{...r,[id]:data}:Object.fromEntries(Object.entries(r).filter(([k])=>k!==id))),[]);
  const handleExport=useCallback(()=>doExport(transactions,comments,{autoPayments,reminders,budgets,customCats,widgetConfig,profile:{userName:user?.name||"",lang,themeId:user?.themeId||"nature",avatar:user?.avatar||"",goal:user?.goal||"know"}}),[transactions,comments,autoPayments,reminders,budgets,customCats,widgetConfig,user,lang]);
  const isMobile=useIsMobile();

  if(!onboarded)return <Onboarding onDone={u=>{
    setUser(u);
    setOnboarded(true);
    const ul=u.lang||"es";
    setLang(ul);
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
  const uncategorizedCount=transactions.filter(t=>t.amount<0&&!t.cat).length;
  const txnCatsInUse=transactions.filter(t=>t.cat&&t.cat!=="Income").map(t=>t.cat);
  const allCats=[...new Set([...ALL_CATS,...customCats,...txnCatsInUse])].filter(c=>c!=="Income");
  const filtered    = filterTxns(transactions,timeFilter,customRange);
  const compKey     = compFilterKey(timeFilter);
  const compFiltered= compKey?filterTxns(transactions,compKey,null):null;
  // Effective expense amount accounts for partial reimbursements
  const effAmt=t=>{const r=reimbursed[t.id];if(!r)return Math.abs(t.amount);if(r.paidBack!==undefined)return Math.max(0,+(Math.abs(t.amount)-r.paidBack).toFixed(2));return 0;};
  const expenses    = filtered.filter(t=>t.amount<0&&!(reimbursed[t.id]&&reimbursed[t.id].paidBack===undefined));
  const incomeT     = filtered.filter(t=>t.amount>0);
  const totalExp    = -expenses.reduce((s,t)=>s+effAmt(t),0);
  const totalInc    = incomeT.reduce((s,t)=>s+t.amount,0);
  const net         = totalInc+totalExp;
  const biggestExp  = expenses.length?expenses.reduce((m,t)=>effAmt(t)>effAmt(m)?t:m):null;
  const catData     = Object.entries(expenses.reduce((acc,t)=>({...acc,[t.cat]:(acc[t.cat]||0)+effAmt(t)}),{})).map(([name,value])=>({name,value:+value.toFixed(2)})).sort((a,b)=>b.value-a.value);
  const paymentsWithCountdown=autoPayments.map(p=>{
    let n;
    if(p.frequency==="yearly"&&p.month){
      n=new Date(NOW.getFullYear(),p.month-1,p.day);
      if(n<=NOW)n=new Date(NOW.getFullYear()+1,p.month-1,p.day);
    } else {
      n=new Date(NOW.getFullYear(),NOW.getMonth(),p.day);
      if(n<=NOW)n.setMonth(n.getMonth()+1);
    }
    return{...p,days:Math.ceil((n-NOW)/86400000)};
  }).sort((a,b)=>a.days-b.days);
  const isWeekFilter = timeFilter==="week"||timeFilter==="lastWeek";
  const budgetWarnings=Object.entries(budgets).map(([cat,monthlyLimit])=>{
    const limit=isWeekFilter?+(monthlyLimit/4).toFixed(2):monthlyLimit;
    const spent=expenses.filter(t=>t.cat===cat).reduce((s,t)=>s+effAmt(t),0);
    return{cat,limit,spent:+spent.toFixed(2),pct:+(Math.min(limit?spent/limit*100:0,100)).toFixed(0),over:limit>0&&spent>limit};
  });

  // Current modal step index
  const subStepIdx  = modalSteps.indexOf("📦 Subscriptions");
  const catStepIdx  = modalSteps.indexOf("🤔 Classify");
  const budStepIdx  = modalSteps.indexOf("🎯 Budgets");

  const NAV=[{id:"dashboard",e:theme.emoji,label:w.home},{id:"budgets",e:"🎯",label:tr.budgets},{id:"reminders",e:"📋",label:tr.reminders},{id:"payments",e:"💳",label:tr.autoPay},{id:"data",e:"📂",label:tr.data}];

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
      {page==="dashboard"&&<Dashboard {...{theme:effectiveTheme,timeFilter,setTimeFilter,compareMode,setCompareMode,customRange,setCustomRange,filtered,compFiltered,totalInc,totalExp,net,biggestExp,catData,budgetWarnings,paymentsWithCountdown,reminders,setReminders,transactions,comments,onCommentSave,onCatChange,hasData:transactions.length>0,onAddReminder,allCats,reimbursed,onMarkReimbursed,budgets,widgetConfig,setWidgetConfig,onExport:handleExport,lang}}/>}
      {page==="budgets"  &&<BudgetsPage {...{theme:effectiveTheme,budgets,setBudgets,catGroups,setCatGroups,allTransactions:transactions,allCats,lang}}/>}
      {page==="reminders"&&<RemindersPage {...{theme:effectiveTheme,reminders,setReminders,lang}}/>}
      {page==="payments" &&<AutoPayPage {...{theme:effectiveTheme,autoPayments,setAutoPayments,paymentsWithCountdown,lang}}/>}
      {page==="data"     &&<DataPage {...{theme:effectiveTheme,transactions,onUpload:handleUpload,onCatChange,comments,onCommentSave,onAddReminder,allCats,reimbursed,onMarkReimbursed,merchantMemory,onClearMemory:()=>{setMerchantMemory({});showToast(lang==="es"?"Memoria borrada":"Memory cleared","info");},onExport:handleExport,lang}}/>}
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
    {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
  </div>;
}
