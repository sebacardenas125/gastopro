import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sun, Moon, Plus, Trash2, Download, Upload, Filter, Wallet, HelpCircle, X, ArrowLeftRight } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

const uid=()=>Math.random().toString(36).slice(2,10);
const cx=(...a)=>a.filter(Boolean).join(" ");

const Button=({variant="primary",className="",children,...p})=>(<button {...p} className={cx("inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2",
  variant==="primary"&&"bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
  variant==="neutral"&&"bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700",
  variant==="danger"&&"bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-500",
  className)}>{children}</button>);

const Input=React.forwardRef((p,ref)=>(<input ref={ref} {...p} className={cx("w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700",p.className)} />));

const Card=({className="",children})=>(<div className={cx("rounded-2xl border border-white/40 bg-white/90 backdrop-blur-xl shadow text-slate-900 dark:bg-slate-900/70 dark:border-slate-700 dark:text-slate-100",className)}>{children}</div>);

const Modal=({open,onClose,title,children})=>!open?null:(<div className="fixed inset-0 z-50"><div className="absolute inset-0 bg-black/40" onClick={onClose}/><div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[94vw] max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-white/30 bg-white dark:bg-slate-900 dark:border-slate-700"><div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70 dark:border-slate-800"><div className="font-semibold">{title}</div><button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4"/></button></div><div className="p-4">{children}</div></div></div>);

// 👇 Nuevo componente Toast
function Toast({ open, message, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
      {message}
      <button className="ml-2" onClick={onClose}>✕</button>
    </div>
  );
}

function useLocalStorage(key,initial){const [v,setV]=useState(()=>{try{const r=localStorage.getItem(key);return r?JSON.parse(r):initial;}catch{return initial;}});useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(v));}catch{}},[key,v]);return [v,setV];}

export default function ExpenseTracker(){
  const [theme,setTheme]=useLocalStorage("gastopro.theme","light");
  const [currency,setCurrency]=useLocalStorage("gastopro.currency","CLP");
  const [items,setItems]=useLocalStorage("gastopro.tx",[]);

  // 👇 Estado del Toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const add=(e)=>{
    e?.preventDefault();
    const n=100; // demo monto fijo
    const row={id:uid(),date:new Date().toISOString().slice(0,10),type:"expense",category:"alimentos",note:"Demo",amount:n,tags:["demo"],accountId:"cash"};
    setItems(p=>[row,...p]);

    // 👇 Mostrar toast
    setToastMsg("✅ Movimiento guardado");
    setToastOpen(true);
    setTimeout(()=>setToastOpen(false),3000);
  };

  return (
    <div className={theme==='dark'?'dark':''}>
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">GastoPro</h1>
        <Button onClick={add}><Plus className="w-4 h-4"/> Guardar demo</Button>
        <ul className="list-disc pl-5">
          {items.map(i=><li key={i.id}>{i.date} — {i.note} — {i.amount}</li>)}
        </ul>
      </main>

      {/* 👇 Toast visible */}
      <Toast open={toastOpen} message={toastMsg} onClose={()=>setToastOpen(false)} />
    </div>
  );
}
