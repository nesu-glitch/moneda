import { useState, useEffect } from "react";

export function useIsMobile() {
  const [mobile,setMobile]=useState(()=>typeof window!=="undefined"&&window.innerWidth<768);
  useEffect(()=>{
    let t;
    const h=()=>{clearTimeout(t);t=setTimeout(()=>setMobile(window.innerWidth<768),100);};
    window.addEventListener("resize",h);
    return()=>{window.removeEventListener("resize",h);clearTimeout(t);};
  },[]);
  return mobile;
}
