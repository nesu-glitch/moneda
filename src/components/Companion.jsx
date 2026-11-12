import { useEffect, useRef, useState, useCallback } from "react";
import { say } from "../utils/i18n.js";

// ── Companion: the avatar the user picked, living in the corner of the app ────
// Layers, outside → in: drift (follows the pointer / reacts to scroll, rAF) → act (one-shot
// moves: page change, tap, hide) → face (flips to look at the pointer) → idle (CSS float loop).
// Each layer owns its own transform, so the animations never overwrite each other.
// Uses the Web Animations API: no extra library in the bundle.

const FLYERS = ["🦋","🦉","🦅","🐉","🧚","🐬","🦢","🕊️"];
const WORLD_MOVE = { nature:"roll", adventure:"dash", princess:"twirl", finance:"glide" };
const moveFor = (avatar, themeId) => FLYERS.includes(avatar) ? "fly" : (WORLD_MOVE[themeId] || "glide");

const PAGE_MOVES = {
  roll:  { d:650, k:[{transform:"translateX(0) rotate(0) scale(1)"},{transform:"translateX(-40px) rotate(-200deg) scale(.8)",offset:.5},{transform:"translateX(0) rotate(-360deg) scale(1)"}] },
  dash:  { d:600, k:[{transform:"translateX(0) skewX(0)"},{transform:"translateX(-70px) skewX(12deg) scaleY(.92)",offset:.4},{transform:"translateX(-70px) skewX(-6deg)",offset:.55},{transform:"translateX(0) skewX(0)"}] },
  twirl: { d:700, k:[{transform:"translateY(0) rotateY(0)"},{transform:"translateY(-24px) rotateY(360deg)",offset:.6},{transform:"translateY(0) rotateY(720deg)"}] },
  glide: { d:600, k:[{transform:"translate(0,0) rotate(0)"},{transform:"translate(-30px,-30px) rotate(-8deg)",offset:.5},{transform:"translate(0,0) rotate(0)"}] },
  fly:   { d:750, k:[{transform:"translate(0,0) rotate(0)"},{transform:"translate(-50px,-60px) rotate(-15deg)",offset:.35},{transform:"translate(-20px,-80px) rotate(10deg)",offset:.65},{transform:"translate(0,0) rotate(0)"}] },
};
const TAP = [{transform:"translateY(0) scale(1,1)"},{transform:"translateY(0) scale(1.15,.8)",offset:.15},{transform:"translateY(-22px) scale(.9,1.12)",offset:.45},{transform:"translateY(0) scale(1.08,.92)",offset:.8},{transform:"translateY(0) scale(1,1)"}];
// Where it goes when it hides: hedgehog-style worlds burrow, the rest run or fly off-screen
const EXIT = { roll:"translateY(80px) scaleY(.3)", dash:"translateX(150px)", twirl:"translateX(150px) rotateY(180deg)", glide:"translateX(150px)", fly:"translate(130px,-140px) rotate(20deg)" };
const PEEK = { roll:"translateY(30px) scaleY(.8)", dash:"translateX(55px)", twirl:"translateX(55px)", glide:"translateX(55px)", fly:"translateX(55px)" };

const TAP_FACES = { nature:["😊","🍃","🌼"], adventure:["⚔️","😄","🪙"], princess:["✨","💖","👑"], finance:["📈","👍","💡"] };
const PARTICLES = { nature:["🌱","🍃","🌸","🌼"], adventure:["🪙","✨","⚔️","💰"], princess:["✨","💖","👑","💎"], finance:["📈","💶","✨","✅"] };

// Shown after the user saves their file: an encouragement and a goodbye, per world and language
const SAVE_MSG = {
  nature:{
    es:["¡Tu jardín está a salvo! 🌱","Sigue regando tus ahorros. ¡Hasta pronto!"],
    en:["Your garden is safe! 🌱","Keep watering those savings. See you soon!"],
    ca:["El teu jardí està a recer! 🌱","Continua regant els teus estalvis. Fins aviat!"],
    eu:["Zure lorategia salbu dago! 🌱","Jarraitu zure aurrezkiak ureztatzen. Laster arte!"],
    gl:["O teu xardín está a salvo! 🌱","Segue regando os teus aforros. Ata pronto!"]},
  adventure:{
    es:["¡Botín a salvo en el cofre! ⚔️","Buena misión, aventurero. ¡Hasta la próxima!"],
    en:["Loot safely stashed! ⚔️","Fine quest, adventurer. Until next time!"],
    ca:["Botí a recer al cofre! ⚔️","Bona missió, aventurer. Fins a la propera!"],
    eu:["Harrapakina kutxan gordeta! ⚔️","Misio bikaina, abenturazale. Hurrengora arte!"],
    gl:["Botín a salvo no cofre! ⚔️","Boa misión, aventureiro. Ata a próxima!"]},
  princess:{
    es:["¡El tesoro real está guardado! 👑","Has reinado con elegancia. ¡Hasta pronto!"],
    en:["The royal treasury is secured! 👑","You ruled with grace. See you soon!"],
    ca:["El tresor reial està desat! 👑","Has regnat amb elegància. Fins aviat!"],
    eu:["Errege-altxorra gordeta dago! 👑","Dotorezia handiz gobernatu duzu. Laster arte!"],
    gl:["O tesouro real está gardado! 👑","Reinaches con elegancia. Ata pronto!"]},
  finance:{
    es:["Sesión guardada. 📊","Datos claros, buenas decisiones. ¡Hasta pronto!"],
    en:["Session saved. 📊","Clear data, good decisions. See you soon!"],
    ca:["Sessió desada. 📊","Dades clares, bones decisions. Fins aviat!"],
    eu:["Saioa gordeta. 📊","Datu argiak, erabaki onak. Laster arte!"],
    gl:["Sesión gardada. 📊","Datos claros, boas decisións. Ata pronto!"]},
};

const TAPS_TO_HIDE = 5, TAP_WINDOW_MS = 2000, HIDE_MS = 5000;
const pick = a => a[Math.floor(Math.random()*a.length)];
const wait = ms => new Promise(r => setTimeout(r, ms));

export function Companion({ avatar, themeId, page, lang, motion, saveSignal, isMobile }) {
  const driftRef = useRef(null), actRef = useRef(null), faceRef = useRef(null), outerRef = useRef(null), jumpRef = useRef(null);
  const [bubble, setBubble] = useState(null);
  const [hidden, setHidden] = useState(false);
  const [celebrating, setCelebrating] = useState(0);
  const [side, setSide] = useState("right");
  const taps = useRef([]), busy = useRef(false), firstPage = useRef(true), firstSave = useRef(saveSignal);
  const move = moveFor(avatar, themeId);
  // Desktop with a mouse: trails the cursor. Phones and tablets keep the bottom-corner placement.
  const follow = !!motion && !isMobile && !!window.matchMedia?.("(pointer: fine)").matches;

  const say1 = useCallback((text, ms = 1100) => {
    setBubble({ text, id: Math.random() });
    setTimeout(() => setBubble(b => (b && b.text === text ? null : b)), ms);
  }, []);

  // ── Desktop: trail 60px behind the cursor, tilting the way it moves ──
  useEffect(() => {
    if (!follow) return;
    const outer = outerRef.current, driftEl = driftRef.current, faceEl = faceRef.current;
    const SIZE = 64, TRAIL = 60, EASE = 0.12;
    let cx = window.innerWidth * 0.8, cy = window.innerHeight * 0.8; // last cursor position
    let dirX = 1, dirY = 0;                                          // last movement direction
    let mx = cx - SIZE / 2, my = cy - SIZE / 2;                      // companion top-left
    let tx = mx, ty = my, rot = 0, face = 1, raf;
    // Page change: jump to a random spot; the next mouse move brings it back behind the cursor
    jumpRef.current = () => {
      tx = 16 + Math.random() * Math.max(0, window.innerWidth - SIZE - 32);
      ty = 16 + Math.random() * Math.max(0, window.innerHeight - SIZE - 32);
    };
    const onMove = e => {
      const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy);
      if (d > 1) { dirX = dx / d; dirY = dy / d; }
      cx = e.clientX; cy = e.clientY;
      tx = cx - dirX * TRAIL - SIZE / 2;
      ty = cy - dirY * TRAIL - SIZE / 2;
    };
    const tick = () => {
      const nx = mx + (tx - mx) * EASE, ny = my + (ty - my) * EASE;
      const vx = nx - mx;
      mx = nx; my = ny;
      rot += (Math.max(-12, Math.min(12, vx * 1.5)) - rot) * 0.15; // slight lean toward the movement
      if (Math.abs(vx) > 0.3) face = vx < 0 ? -1 : 1;
      if (outer) outer.style.transform = `translate3d(${mx.toFixed(1)}px,${my.toFixed(1)}px,0)`;
      if (driftEl) driftEl.style.transform = `rotate(${rot.toFixed(1)}deg)`;
      if (faceEl) faceEl.style.transform = `scaleX(${face})`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      jumpRef.current = null;
      window.removeEventListener("pointermove", onMove);
      if (outer) outer.style.transform = "";
      if (driftEl) driftEl.style.transform = "";
      if (faceEl) faceEl.style.transform = "";
    };
  }, [follow]);

  // ── Phones: lean with scrolling (no cursor to follow) ──
  useEffect(() => {
    if (!motion || follow) return;
    const driftEl = driftRef.current;
    let raf, y = 0, ty = 0, rot = 0, trot = 0, lastY = window.scrollY, lastT = performance.now();
    const onScroll = () => {
      const now = performance.now(), v = (window.scrollY - lastY) / Math.max(16, now - lastT);
      lastY = window.scrollY; lastT = now;
      trot = Math.max(-15, Math.min(15, v * 20)); ty = Math.max(-20, Math.min(20, -v * 15));
    };
    const tick = () => {
      y += (ty - y) * 0.1; rot += (trot - rot) * 0.1;
      trot *= 0.92; ty *= 0.92;
      if (driftEl) driftEl.style.transform = `translate(0px,${y.toFixed(1)}px) rotate(${rot.toFixed(1)}deg)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      if (driftEl) driftEl.style.transform = "";
    };
  }, [motion, follow]);

  // ── Page change: the world's signature move (runs beside the page, never blocks it) ──
  useEffect(() => {
    if (firstPage.current) { firstPage.current = false; return; }
    setSide(s => (s === "right" ? "left" : "right"));
    jumpRef.current?.();
    if (!motion || busy.current || !actRef.current?.animate) return;
    const m = PAGE_MOVES[move];
    actRef.current.animate(m.k, { duration: m.d, easing: "cubic-bezier(.45,.05,.35,1)" });
  }, [page, motion, move]);

  // ── Save: celebration card ──
  useEffect(() => {
    if (saveSignal === firstSave.current) return;
    firstSave.current = saveSignal;
    setCelebrating(saveSignal);
    const t = setTimeout(() => setCelebrating(0), 3800);
    return () => clearTimeout(t);
  }, [saveSignal]);

  // ── Tap: a happy hop; too many taps in a row and it runs off to hide ──
  const onTap = async () => {
    if (busy.current) return;
    const now = Date.now();
    taps.current = [...taps.current.filter(t => now - t < TAP_WINDOW_MS), now];
    const el = actRef.current;
    if (taps.current.length < TAPS_TO_HIDE) {
      say1(pick(TAP_FACES[themeId] || TAP_FACES.nature), 900);
      if (motion && el?.animate) el.animate(TAP, { duration: 450, easing: "ease-out" });
      return;
    }
    taps.current = [];
    busy.current = true;
    say1("😤", 700);
    await wait(500);
    if (motion && el?.animate) await el.animate([{ transform: "none", opacity: 1 }, { transform: EXIT[move], opacity: 0 }], { duration: 450, easing: "ease-in", fill: "forwards" }).finished.catch(() => {});
    setHidden(true);
    await wait(HIDE_MS);
    setHidden(false);
    if (motion && el?.animate) {
      el.getAnimations().forEach(a => a.cancel());
      await el.animate([{ transform: EXIT[move], opacity: 0 }, { transform: PEEK[move], opacity: 1 }], { duration: 400, easing: "ease-out", fill: "forwards" }).finished.catch(() => {});
      say1("👀", 900);
      await wait(900);
      await el.animate([{ transform: PEEK[move] }, { transform: "none" }], { duration: 350, easing: "ease-out" }).finished.catch(() => {});
      el.getAnimations().forEach(a => a.cancel());
    }
    busy.current = false;
  };

  const idle = motion ? { nature:"compBob 2.4s ease-in-out infinite", adventure:"compStep 1.6s ease-in-out infinite", princess:"compSway 3s ease-in-out infinite", finance:"compHover 2.8s ease-in-out infinite" }[themeId] || "compBob 2.4s ease-in-out infinite" : "none";
  const label = say(lang, "Tu compañero — tócalo", "Your companion — tap it");

  return <>
    <style>{`
      @keyframes compBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
      @keyframes compStep{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-5px) rotate(-5deg)}50%{transform:translateY(0) rotate(0)}75%{transform:translateY(-5px) rotate(5deg)}}
      @keyframes compSway{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-9px) rotate(4deg)}}
      @keyframes compHover{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      @keyframes compBubble{from{opacity:0;transform:translate(-50%,6px) scale(.7)}to{opacity:1;transform:translate(-50%,0) scale(1)}}
      @keyframes compCard{from{opacity:0;transform:translateY(24px) scale(.92)}to{opacity:1;transform:none}}
    `}</style>
    {/* Only the character itself takes taps; the box around it lets clicks through */}
    <div ref={outerRef} style={{ position:"fixed", zIndex:300, width:64, height:64, pointerEvents:"none", visibility:celebrating?"hidden":"visible",
      ...(follow ? { left:0, top:0 } : { left:side==="left"?(isMobile?10:22):`calc(100vw - ${64+(isMobile?10:22)}px)`, bottom:isMobile?"calc(66px + env(safe-area-inset-bottom, 0px))":22, transition:motion?"left .6s cubic-bezier(.45,.05,.35,1)":"none" }) }}>
      <div ref={driftRef} style={{ width:"100%", height:"100%", willChange:"transform" }}>
        <div ref={actRef} style={{ width:"100%", height:"100%", perspective:400 }}>
          {bubble && <div key={bubble.id} style={{ position:"absolute", left:"50%", bottom:"100%", marginBottom:4, transform:"translate(-50%,0)", background:"white", borderRadius:14, padding:"3px 9px", fontSize:20, boxShadow:"0 4px 14px rgba(0,0,0,.18)", animation:motion?"compBubble .18s ease-out":"none", whiteSpace:"nowrap" }}>{bubble.text}</div>}
          <button type="button" onClick={onTap} aria-label={label} title={label} disabled={hidden}
            style={{ pointerEvents:hidden?"none":"auto", width:"100%", height:"100%", border:"none", background:"transparent", padding:0, cursor:"pointer", WebkitTapHighlightColor:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span ref={faceRef} style={{ display:"inline-block" }}>
              <span style={{ display:"inline-block", fontSize:44, lineHeight:1, animation:idle, filter:"drop-shadow(0 6px 6px rgba(0,0,0,.18))" }}>{avatar}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
    {celebrating > 0 && <SaveCelebration key={celebrating} avatar={avatar} themeId={themeId} lang={lang} motion={motion} move={move} onClose={() => setCelebrating(0)}/>}
  </>;
}

function SaveCelebration({ avatar, themeId, lang, motion, move, onClose }) {
  const heroRef = useRef(null), burstRef = useRef(null);
  const [title, sub] = (SAVE_MSG[themeId] || SAVE_MSG.nature)[lang] || (SAVE_MSG[themeId] || SAVE_MSG.nature).es;
  useEffect(() => {
    if (!motion) return;
    const m = PAGE_MOVES[move];
    heroRef.current?.animate?.(m.k, { duration: m.d * 1.4, delay: 150, easing: "cubic-bezier(.45,.05,.35,1)" });
    const set = PARTICLES[themeId] || PARTICLES.nature;
    [...(burstRef.current?.children || [])].forEach((p, i) => {
      const ang = (i / 14) * Math.PI * 2 + Math.random() * 0.4, dist = 90 + Math.random() * 70;
      p.textContent = set[i % set.length];
      p.animate([{ transform: "translate(-50%,-50%) scale(.3)", opacity: 0 }, { opacity: 1, offset: .2 },
        { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(1) rotate(${(Math.random() - .5) * 120}deg)`, opacity: 0 }],
        { duration: 1300 + Math.random() * 500, delay: 150 + Math.random() * 200, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });
    });
  }, [motion, move, themeId]);
  return <div role="status" aria-live="polite" onClick={onClose}
    style={{ position:"fixed", inset:0, zIndex:900, display:"flex", alignItems:"center", justifyContent:"center", padding:20, background:"rgba(0,0,0,.35)", cursor:"pointer" }}>
    <div style={{ position:"relative", background:"white", borderRadius:24, padding:"30px 26px 24px", maxWidth:340, width:"100%", textAlign:"center", boxShadow:"0 24px 60px rgba(0,0,0,.35)", animation:motion?"compCard .35s cubic-bezier(.2,.8,.3,1.2)":"none" }}>
      <div style={{ position:"relative", height:96, marginBottom:8, perspective:500 }}>
        <div ref={burstRef} aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <span key={i} style={{ position:"absolute", left:"50%", top:"50%", fontSize:20, opacity:0, pointerEvents:"none" }}/>)}</div>
        <div ref={heroRef} style={{ fontSize:72, lineHeight:"96px" }}>{avatar}</div>
      </div>
      <div style={{ fontSize:20, fontWeight:800, color:"#111827", marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:14, color:"#4b5563", lineHeight:1.5 }}>{sub}</div>
    </div>
  </div>;
}
