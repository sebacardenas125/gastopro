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

function useLocalStorage(key,initial){const [v,setV]=useState(()=>{try{const r=localStorage.getItem(key);return r?JSON.parse(r):initial;}catch{return initial;}});useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(v));}catch{}},[key,v]);return [v,setV];}

export default function ExpenseTracker(){
  const [theme,setTheme]=useLocalStorage("gastopro.theme","light");
  const [currency,setCurrency]=useLocalStorage("gastopro.currency","CLP");
  const [items,setItems]=useLocalStorage("gastopro.tx",[]);
  const [accounts,setAccounts]=useLocalStorage("gastopro.accounts",[
    {id:"cash",name:"Efectivo"},{id:"debit",name:"Débito"},{id:"credit",name:"Crédito"}
  ]);
  const [month,setMonth]=useState(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`});
  const [type,setType]=useState("expense");
  const [cat,setCat]=useState("alimentos");
  const [accountId,setAccountId]=useState(accounts[0]?.id||"cash");
  const [amt,setAmt]=useState(0);
  const [note,setNote]=useState("");
  const [tags,setTags]=useState("");
  const [search,setSearch]=useState("");
  const [typeFilter,setTypeFilter]=useState("all");
  const searchRef=useRef(null);
  const formRef=useRef(null);

  useEffect(()=>{document.documentElement.classList.toggle('dark',theme==='dark')},[theme]);

  const fmt=useMemo(()=>new Intl.NumberFormat(currency==='CLP'?'es-CL':'en-US',{style:'currency',currency,maximumFractionDigits:currency==='CLP'?0:2}).format,[currency]);

  const add=e=>{e?.preventDefault();const n=Number(amt);if(!n) return;const row={id:uid(),date:new Date().toISOString().slice(0,10),type,category:cat,note,amount:n,tags:tags.split(',').map(t=>t.trim()).filter(Boolean),accountId};setItems(p=>[row,...p]);setAmt(0);setNote("");setTags("");};

  const del=id=>setItems(p=>p.filter(x=>x.id!==id));

  const [y,m]=month.split('-').map(Number);
  const start=new Date(y,m-1,1);const end=new Date(y,m,1);
  const inMonth=items.filter(t=>{const d=new Date((t.date||"")+"T00:00:00");return d>=start&&d<end});
  const filtered=inMonth.filter(t=>{if(typeFilter!=='all'&&t.type!==typeFilter) return false; const q=search.toLowerCase(); if(!q) return true; const txt=`${t.note||''} ${t.category} ${(t.tags||[]).join(' ')} ${(t.accountId||'')}`.toLowerCase(); return txt.includes(q)});

  return (
    <div className={theme==='dark'?'dark':''}>
      <main className="max-w-6xl mx-auto p-6 space-y-6">

        <Card>
          <div className="p-4 overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-700 dark:text-slate-200">
                <tr>
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Cuenta</th>
                  <th className="text-left p-2">Categoría</th>
                  <th className="text-left p-2">Detalle</th>
                  <th className="text-left p-2">Tags</th>
                  <th className="text-right p-2">Monto</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-600 dark:text-slate-300">
                      Sin resultados
                    </td>
                  </tr>
                )}
                {filtered.map(i => {
                  const acc=accounts.find(a=>a.id===(i.accountId||accounts[0]?.id));
                  return (
                    <tr key={i.id} className="border-t border-slate-200/70 dark:border-slate-700 hover:bg-slate-50/70 dark:hover:bg-slate-800/60">
                      <td className="p-2 whitespace-nowrap" data-label="Fecha">{i.date}</td>
                      <td className="p-2 whitespace-nowrap" data-label="Tipo">{i.type==='income'?"Ingreso":"Gasto"}</td>
                      <td className="p-2 whitespace-nowrap" data-label="Cuenta">{acc?.name||'—'}</td>
                      <td className="p-2 whitespace-nowrap" data-label="Categoría">{i.category}</td>
                      <td className="p-2 max-w-[28ch] truncate" title={i.note} data-label="Detalle">{i.note||"—"}</td>
                      <td className="p-2 whitespace-nowrap" data-label="Tags">
                        {(i.tags||[]).slice(0,4).map(t=> (
                          <span key={t} className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 mr-1 dark:bg-slate-800 dark:text-slate-200">{t}</span>
                        ))}
                      </td>
                      <td className="p-2 text-right font-medium" data-label="Monto">
                        {i.type==='expense'?`- ${fmt(i.amount)}`:fmt(i.amount)}
                      </td>
                      <td className="p-2 text-right" data-label="Acción">
                        <button onClick={()=>del(i.id)} className="rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800" title="Eliminar">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

      </main>
    </div>
  );
}
