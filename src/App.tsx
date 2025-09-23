import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sun, Moon, Plus, Trash2, Download, Upload, Filter, Wallet, HelpCircle, X, ArrowLeftRight } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

const uid=()=>Math.random().toString(36).slice(2,10);
const cx=(...a:any[])=>a.filter(Boolean).join(" ");

const Button=({variant="primary",className="",children,...p}: any)=>(<button {...p} className={cx("inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-2",
  variant==="primary"&&"bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
  variant==="neutral"&&"bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700",
  variant==="danger"&&"bg-rose-500 text-white hover:bg-rose-600 focus:ring-rose-500",
  className)}>{children}</button>);

const Input=React.forwardRef<HTMLInputElement, any>((p,ref)=>(<input ref={ref} {...p} className={cx("w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700",p.className)} />));

const Card=({className="",children}: any)=>(<div className={cx("rounded-2xl border border-white/40 bg-white/90 backdrop-blur-xl shadow text-slate-900 dark:bg-slate-900/70 dark:border-slate-700 dark:text-slate-100",className)}>{children}</div>);

const Modal=({open,onClose,title,children}: any)=>!open?null:(<div className="fixed inset-0 z-50">
  <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[94vw] max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-white/30 bg-white dark:bg-slate-900 dark:border-slate-700">
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70 dark:border-slate-800">
      <div className="font-semibold">{title}</div>
      <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4"/></button>
    </div>
    <div className="p-4">{children}</div>
  </div>
</div>);

// Toast simple
function Toast({ open, message, onClose }: {open:boolean; message:string; onClose:()=>void}) {
  if(!open) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[70]">
      <div className="rounded-xl bg-indigo-600 text-white px-4 py-2 shadow-lg flex items-center gap-3">
        <span>{message}</span>
        <button onClick={onClose} className="text-white/80 hover:text-white">✕</button>
      </div>
    </div>
  );
}

function useLocalStorage<T>(key:string,initial:T){
  const [v,setV]=useState<T>(()=>{try{const r=localStorage.getItem(key);return r?JSON.parse(r):initial;}catch{return initial;}});
  useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(v));}catch{}},[key,v]);
  return [v,setV] as const;
}

const COLORS=["#2563eb","#16a34a","#f59e0b","#ef4444","#7c3aed","#06b6d4","#f97316","#22c55e"];
const pct=(n:number,d:number)=>d>0?Math.round((n/d)*100):0;
const daysInMonth=(y:number,m:number)=>new Date(y,m+1,0).getDate();

export default function ExpenseTracker(){
  const [theme,setTheme]=useLocalStorage<"light"|"dark">("gastopro.theme","light");
  const [currency,setCurrency]=useLocalStorage<"CLP"|"USD"|"EUR">("gastopro.currency","CLP");
  const [items,setItems]=useLocalStorage<any[]>("gastopro.tx",[]);
  const [accounts,setAccounts]=useLocalStorage<{id:string;name:string}[]>("gastopro.accounts",[
    {id:"cash",name:"Efectivo"},{id:"debit",name:"Débito"},{id:"credit",name:"Crédito"}
  ]);

  const [budgets,setBudgets]=useLocalStorage<Record<string,number>>("gastopro.budgets",{alimentos:0,servicios:0,transporte:0,vivienda:0,salud:0,entretenimiento:0,otros:0});
  const [templates,setTemplates]=useLocalStorage<any[]>("gastopro.recurring",[]);
  const [presets,setPresets]=useLocalStorage<any>("gastopro.presets",{type:"expense",category:"alimentos",accountId:"cash"});

  const [month,setMonth]=useState(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`});
  const [type,setType]=useState<"expense"|"income">(presets.type);
  const [cat,setCat]=useState<string>(presets.category);
  const [accountId,setAccountId]=useState<string>(presets.accountId||accounts[0]?.id||"cash");
  const [amt,setAmt]=useState<any>(0);
  const [note,setNote]=useState("");
  const [tags,setTags]=useState("");
  const [recurring,setRecurring]=useState(false);

  const [search,setSearch]=useState("");
  const [typeFilter,setTypeFilter]=useState<"all"|"income"|"expense">("all");

  const [accOpen,setAccOpen]=useState(false);
  const [transferOpen,setTransferOpen]=useState(false);
  const [fromAcc,setFromAcc]=useState(accounts[0]?.id||"cash");
  const [toAcc,setToAcc]=useState(accounts[1]?.id||"debit");
  const [transferAmt,setTransferAmt]=useState<any>(0);
  const [transferNote,setTransferNote]=useState("");

  const [toastMsg,setToastMsg]=useState("");
  const [toastOpen,setToastOpen]=useState(false);

  const searchRef=useRef<HTMLInputElement>(null);
  const formRef=useRef<HTMLFormElement>(null);

  useEffect(()=>{document.documentElement.classList.toggle('dark',theme==='dark')},[theme]);

  const fmt=useMemo(()=>new Intl.NumberFormat(currency==='CLP'?'es-CL':currency==='USD'?'en-US':'de-DE',{style:'currency',currency,maximumFractionDigits:currency==='CLP'?0:2}).format,[currency]);

  // Atajos
  useEffect(()=>{const onKey=(e:KeyboardEvent)=>{const t=(e.target as HTMLElement)?.tagName; if(t==='INPUT'||t==='TEXTAREA') return; if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();formRef.current?.requestSubmit();} if(e.key.toLowerCase()==='g') setType('expense'); if(e.key.toLowerCase()==='i') setType('income'); if(e.key==='/'){e.preventDefault();searchRef.current?.focus();}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[]);

  const ensureAccount=(id:string)=> accounts.some(a=>a.id===id)?id:(accounts[0]?.id||"cash");

  const add=(e?:React.FormEvent)=>{e?.preventDefault();const n=Number(amt);if(!n) return;
    const acc=ensureAccount(accountId);
    const row={id:uid(),date:new Date().toISOString().slice(0,10),type,category:cat,note,amount:n,tags:tags.split(',').map(t=>t.trim()).filter(Boolean),accountId:acc};
    setItems(p=>[row,...p]); setAmt(0); setNote(""); setTags(""); setPresets({type,category:cat,accountId:acc});
    if(recurring){ setTemplates(p=>[...p,{id:uid(),type,category:cat,amount:n,note,accountId:acc}]); setRecurring(false); }
    setToastMsg("✅ Movimiento guardado"); setToastOpen(true); setTimeout(()=>setToastOpen(false),2500);
  };

  const del=(id:string)=>setItems(p=>p.filter(x=>x.id!==id));

  const [y,m]=month.split('-').map(Number);
  const start=new Date(y,m-1,1);const end=new Date(y,m,1);
  const inMonth=items.filter(t=>{const d=new Date((t.date||"")+"T00:00:00");return d>=start&&d<end});
  const filtered=inMonth.filter(t=>{if(typeFilter!=='all'&&t.type!==typeFilter) return false; const q=search.toLowerCase(); if(!q) return true; const txt=`${t.note||''} ${t.category} ${(t.tags||[]).join(' ')} ${(t.accountId||'')}`.toLowerCase(); return txt.includes(q)});

  useEffect(()=>{if(!templates.length) return; const first=`${month}-01`;
    const exists=(tpl:any)=>inMonth.some(t=>t.date===first&&t.type===tpl.type&&t.category===tpl.category&&t.amount===tpl.amount&&t.note===tpl.note&&t.accountId===tpl.accountId);
    const toAdd=templates.filter(tpl=>!exists(tpl)).map(tpl=>({...tpl,id:uid(),date:first}));
    if(toAdd.length) setItems(p=>[...toAdd,...p]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[month,templates]);

  const totalIn=inMonth.filter(i=>i.type==='income'&&i.category!=='transfer').reduce((a:number,b:any)=>a+b.amount,0);
  const totalOut=inMonth.filter(i=>i.type==='expense'&&i.category!=='transfer').reduce((a:number,b:any)=>a+b.amount,0);
  const totalNet=totalIn-totalOut;

  const byCat=useMemo(()=>{const m=new Map<string,number>();inMonth.filter(t=>t.type==='expense'&&t.category!=='transfer').forEach(t=>m.set(t.category,(m.get(t.category)||0)+t.amount));return Array.from(m,([name,value])=>({name,value})).sort((a,b)=>b.value-a.value)},[inMonth]);

  const history=useMemo(()=>{const now=new Date(y,m-1,1);const pts:any[]=[];for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const sy=d.getFullYear(), sm=d.getMonth();const s=new Date(sy,sm,1), e=new Date(sy,sm+1,1);const inM=items.filter(t=>{const td=new Date((t.date||"")+"T00:00:00");return td>=s&&td<e});const inc=inM.filter(t=>t.type==='income'&&t.category!=='transfer').reduce((a:number,b:any)=>a+b.amount,0);const exp=inM.filter(t=>t.type==='expense'&&t.category!=='transfer').reduce((a:number,b:any)=>a+b.amount,0);pts.push({mes:`${sy}-${String(sm+1).padStart(2,'0')}`,ingresos:inc,gastos:exp,saldo:inc-exp});}return pts},[items,month]);

  const spentById=useMemo(()=>{const r:Record<string,number>={};inMonth.forEach((t:any)=>{if(t.type!=='expense'||t.category==='transfer') return;r[t.category]=(r[t.category]||0)+t.amount});return r},[inMonth]);

  const today=new Date();
  const dim=daysInMonth(y,m-1);
  const isCurrent=today.getFullYear()===y&&(today.getMonth()+1)===m;
  const dayIdx=isCurrent?Math.max(1,today.getDate()):Math.min(15,dim);
  const avgDaily=dayIdx?totalNet/dayIdx:0;
  const projected=Math.round(avgDaily*dim);

  const accountBalance=(id:string)=> items.reduce((acc:number,t:any)=>{
    const a = t.amount||0; if((t.accountId||accounts[0]?.id)===id){ return acc + (t.type==='income'?a:-a); } return acc; },0);
  const totalsByAccount=accounts.map(a=>({id:a.id,name:a.name,balance:accountBalance(a.id)}));

  const downloadJSON=()=>{const blob=new Blob([JSON.stringify({items,budgets,templates,accounts},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`gastopro-${month}.json`;a.click();URL.revokeObjectURL(url)};
  const downloadCSV=()=>{const headers=['id','type','category','amount','date','note','tags','accountId'];const rows=items.map((t:any)=>headers.map(h=>h==='tags'?`"${(t.tags||[]).join(' ')}"`:String(t[h]??'')).join(','));const csv=[headers.join(','),...rows].join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`gastopro-${month}.csv`;a.click();URL.revokeObjectURL(url)};
  const onImport=async(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f) return;try{const j=JSON.parse(await f.text());if(Array.isArray(j.items)) setItems(j.items);if(j.budgets) setBudgets(j.budgets);if(Array.isArray(j.templates)) setTemplates(j.templates);if(Array.isArray(j.accounts)) setAccounts(j.accounts);}catch{alert('Archivo no válido')}};

  const setBudget=(id:string,val:any)=>setBudgets(p=>({...p,[id]:Math.max(0,Number(val)||0)}));

  const addAccount=()=>setAccounts(p=>[...p,{id:uid(),name:`Cuenta ${p.length+1}`}]);
  const renameAccount=(id:string,name:string)=>setAccounts(p=>p.map(a=>a.id===id?{...a,name}:a));
  const removeAccount=(id:string)=>{ if(items.some(t=>t.accountId===id)) return alert('No puedes eliminar una cuenta con movimientos.'); setAccounts(p=>p.filter(a=>a.id!==id)); };

  const submitTransfer=(e:React.FormEvent)=>{e.preventDefault(); const n=Number(transferAmt); if(!n||fromAcc===toAcc) return alert('Verifica cuentas y monto'); const todayStr=new Date().toISOString().slice(0,10); const outTx={id:uid(),date:todayStr,type:'expense',category:'transfer',note:transferNote||`Transferencia a ${toAcc}`,amount:n,tags:['transfer'],accountId:fromAcc}; const inTx={id:uid(),date:todayStr,type:'income',category:'transfer',note:transferNote||`Transferencia desde ${fromAcc}`,amount:n,tags:['transfer'],accountId:toAcc}; setItems(p=>[outTx,inTx,...p]); setTransferAmt(0); setTransferNote(""); setTransferOpen(false); setToastMsg("🔁 Transferencia registrada"); setToastOpen(true); setTimeout(()=>setToastOpen(false),2500); };

  // Toast por metas alcanzadas (80/100/120%)
  useEffect(()=>{
    const hits:string[]=[];
    for(const id of Object.keys(budgets)){
      const b=budgets[id]||0; if(b<=0) continue;
      const spent=spentById[id]||0;
      const p=pct(spent,b);
      if(p===80||p===100||p===120) hits.push(`${id} ${p}%`);
    }
    if(hits.length){ setToastMsg(`Aviso: metas alcanzadas → ${hits.join(", ")}`); setToastOpen(true); const t=setTimeout(()=>setToastOpen(false),3000); return ()=>clearTimeout(t); }
  },[spentById,budgets]);

  return (
    <div className={theme==='dark'?'dark':''}>
      <section className="bg-gradient-to-br from-indigo-600 via-sky-500 to-cyan-400 text-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-3xl font-bold">GastoPro</h1>
            <div className="flex items-center gap-2">
              <select value={currency} onChange={e=>setCurrency(e.target.value as any)} className="rounded-xl bg-white/90 text-slate-900 px-2 py-1 text-sm">
                {['CLP','USD','EUR'].map(c=> <option key={c}>{c}</option>)}
              </select>
              <Button variant="neutral" onClick={()=>setTheme(theme==='dark'?'light':'dark')}>{theme==='dark'?<Sun className="w-4 h-4"/>:<Moon className="w-4 h-4"/>} Tema</Button>
            </div>
          </div>
          <p className="mt-2 text-white/90">Control profesional de gastos con metas, gráficos, cuentas y transferencias.</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 text-sm">
            <Card><div className="p-3"><div className="opacity-90">Ingresos</div><div className="text-xl font-semibold">{fmt(totalIn)}</div></div></Card>
            <Card><div className="p-3"><div className="opacity-90">Gastos</div><div className="text-xl font-semibold">{fmt(totalOut)}</div></div></Card>
            <Card><div className="p-3"><div className="opacity-90">Saldo</div><div className="text-xl font-semibold">{fmt(totalNet)}</div></div></Card>
            <Card><div className="p-3"><div className="opacity-90">Proyección</div><div className="text-xl font-semibold">{fmt(projected)}</div><div className="text-[11px] opacity-80">Promedio diario</div></div></Card>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <Card>
          <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 font-medium"><Wallet className="w-5 h-5"/> Cuentas</div>
            <div className="flex items-center gap-2 flex-wrap">
              {totalsByAccount.map(a=> (
                <div key={a.id} className="rounded-xl px-3 py-2 text-sm bg-white/80 border border-white/40 dark:bg-slate-900/60 dark:border-slate-700">
                  <div className="font-medium">{a.name}</div>
                  <div className="opacity-80">{fmt(a.balance)}</div>
                </div>
              ))}
              <Button variant="neutral" onClick={()=>setAccOpen(true)}>Administrar</Button>
              <Button variant="neutral" onClick={()=>setTransferOpen(true)}><ArrowLeftRight className="w-4 h-4"/> Transferir</Button>
            </div>
          </div>
        </Card>

        <Card>
          <form ref={formRef} onSubmit={add} className="p-4 grid lg:grid-cols-8 gap-3">
            <select value={type} onChange={e=>setType(e.target.value as any)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"><option value="expense">Gasto</option><option value="income">Ingreso</option></select>
            <select value={cat} onChange={e=>setCat(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">{"alimentos,servicios,transporte,vivienda,salud,entretenimiento,otros,ingresos".split(',').map(c=><option key={c}>{c}</option>)}</select>
            <select value={accountId} onChange={e=>setAccountId(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
            <Input type="number" inputMode="numeric" placeholder="Monto" value={amt} onChange={e=>setAmt(e.target.value)} />
            <Input placeholder="Detalle" value={note} onChange={e=>setNote(e.target.value)} />
            <Input placeholder="tags (coma)" value={tags} onChange={e=>setTags(e.target.value)} />
            <Input type="month" value={month} onChange={e=>setMonth(e.target.value)} />
            <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"><input type="checkbox" checked={recurring} onChange={e=>setRecurring(e.target.checked)}/> Recurrente</label>
            <Button type="submit"><Plus className="w-4 h-4"/> Guardar</Button>
          </form>
          <div className="px-4 pb-4 grid md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2"><Filter className="w-4 h-4"/><select value={typeFilter} onChange={e=>setTypeFilter(e.target.value as any)} className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"><option value="all">Todos</option><option value="expense">Gasto</option><option value="income">Ingreso</option></select></div>
            <Input ref={searchRef} placeholder="/ para buscar…" value={search} onChange={e=>setSearch(e.target.value)} className="md:col-span-2"/>
            <div className="flex gap-2 justify-end"><Button variant="neutral" onClick={downloadJSON}><Download className="w-4 h-4"/> JSON</Button><Button variant="neutral" onClick={downloadCSV}><Download className="w-4 h-4"/> CSV</Button><label className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm ring-1 ring-slate-200 bg-white dark:ring-slate-700 dark:bg-slate-800 cursor-pointer"><Upload className="w-4 h-4"/> Importar<input type="file" accept="application/json" className="hidden" onChange={onImport}/></label></div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-4 items-stretch">
          <Card><div className="p-4 h-[300px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={byCat} dataKey="value" nameKey="name" outerRadius={110} label>{byCat.map((_,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]}/>))}</Pie><Tooltip formatter={(v:any)=>fmt(v)}/></PieChart></ResponsiveContainer></div></Card>
          <Card className="lg:col-span-2"><div className="p-4 h-[300px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={history}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="mes"/><YAxis tickFormatter={(v:number)=>fmt(v)} width={80}/><Tooltip formatter={(v:any)=>fmt(v)}/><Line type="monotone" dataKey="ingresos"/><Line type="monotone" dataKey="gastos"/><Line type="monotone" dataKey="saldo"/></LineChart></ResponsiveContainer></div></Card>
        </div>

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
                {filtered.length===0&&(<tr><td colSpan={8} className="p-8 text-center text-slate-600 dark:text-slate-300">Sin resultados</td></tr>)}
                {filtered.map((i:any)=> {
                  const acc=accounts.find(a=>a.id===(i.accountId||accounts[0]?.id));
                  return (
                  <tr key={i.id} className="border-t border-slate-200/70 dark:border-slate-700 hover:bg-slate-50/70 dark:hover:bg-slate-800/60">
                    <td className="p-2 whitespace-nowrap" data-label="Fecha">{i.date}</td>
                    <td className="p-2 whitespace-nowrap" data-label="Tipo">{i.type==='income'?"Ingreso":"Gasto"}</td>
                    <td className="p-2 whitespace-nowrap" data-label="Cuenta">{acc?.name||'—'}</td>
                    <td className="p-2 whitespace-nowrap" data-label="Categoría">{i.category}</td>
                    <td className="p-2 max-w-[28ch] truncate" title={i.note} data-label="Detalle">{i.note||"—"}</td>
                    <td className="p-2 whitespace-nowrap" data-label="Tags">{(i.tags||[]).slice(0,4).map((t:string)=> <span key={t} className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 mr-1 dark:bg-slate-800 dark:text-slate-200">{t}</span>)}</td>
                    <td className="p-2 text-right font-medium" data-label="Monto">{i.type==='expense'?`- ${fmt(i.amount)}`:fmt(i.amount)}</td>
                    <td className="p-2 text-right" data-label="Acción"><button onClick={()=>del(i.id)} className="rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800" title="Eliminar"><Trash2 className="w-4 h-4"/></button></td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3"><Wallet className="w-5 h-5"/><div className="font-semibold">Metas por categoría</div></div>
            <div className="grid md:grid-cols-2 gap-3">
              {"alimentos,servicios,transporte,vivienda,salud,entretenimiento,otros".split(',').map(id=>{
                const spent=spentById[id]||0; const b=budgets[id]||0; const ratio=b>0?spent/b:0; const bar=Math.min(100,Math.round(ratio*100)); const cls=ratio>=1?"bg-green-500":ratio>=0.8?"bg-amber-500":"bg-red-500";
                return (
                  <div key={id} className="rounded-xl border border-slate-200/70 dark:border-slate-700 p-3 bg-white/80 dark:bg-slate-900/60">
                    <div className="flex items-center justify-between text-sm"><div className="font-medium capitalize">{id}</div><div className="text-slate-600 dark:text-slate-300">{fmt(spent)} / {fmt(b)}</div></div>
                    <div className="h-2 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden mt-2"><div className={cx("h-2",cls)} style={{width:`${bar}%`}}/></div>
                    <div className="mt-2 flex items-end gap-2"><Input type="number" value={b} onChange={e=>setBudget(id,e.target.value)} /><div className="w-16 text-right text-xs font-medium">{pct(spent,b)}%</div></div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </main>

      <footer className="text-center text-xs text-slate-600 py-6 dark:text-slate-400">Hecho contigo 💙 · Tus datos quedan en tu navegador</footer>

      {/* Modales */}
      <Modal open={accOpen} onClose={()=>setAccOpen(false)} title="Administrar cuentas">
        <div className="space-y-2">
          {accounts.map(a=> (
            <div key={a.id} className="flex items-center gap-2">
              <Input value={a.name} onChange={e=>renameAccount(a.id,(e.target as HTMLInputElement).value)} />
              <Button variant="danger" onClick={()=>removeAccount(a.id)}>Eliminar</Button>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2"><Button variant="neutral" onClick={addAccount}>Agregar cuenta</Button><div className="text-xs text-slate-600 dark:text-slate-300">No puedes eliminar cuentas con movimientos.</div></div>
        </div>
      </Modal>

      <Modal open={transferOpen} onClose={()=>setTransferOpen(false)} title="Transferir entre cuentas">
        <form onSubmit={submitTransfer} className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <select value={fromAcc} onChange={e=>setFromAcc(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
            <select value={toAcc} onChange={e=>setToAcc(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700">{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
          </div>
          <Input type="number" inputMode="numeric" placeholder="Monto" value={transferAmt} onChange={e=>setTransferAmt((e.target as HTMLInputElement).value)} />
          <Input placeholder="Nota (opcional)" value={transferNote} onChange={e=>setTransferNote((e.target as HTMLInputElement).value)} />
          <div className="flex justify-end gap-2"><Button variant="neutral" type="button" onClick={()=>setTransferOpen(false)}>Cancelar</Button><Button type="submit"><ArrowLeftRight className="w-4 h-4"/> Transferir</Button></div>
        </form>
      </Modal>

      {/* Ayuda flotante muy simple */}
      <button aria-label="Ayuda" onClick={()=>alert('Escríbenos: soporte@gastopro.app')} className="fixed bottom-6 right-6 z-40 rounded-full p-3 shadow-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <HelpCircle className="w-5 h-5"/>
      </button>

      {/* Toast global */}
      <Toast open={toastOpen} message={toastMsg} onClose={()=>setToastOpen(false)} />
    </div>
  );
}

