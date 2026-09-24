import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package, Tags, ShoppingCart, RefreshCw } from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPage } from "@/components/AdminShell";
import { dashboardStats } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const [stats,setStats] = useState({products:0,categories:0,orders:0});
  const [loading,setLoading] = useState(true);
  const load=()=>{setLoading(true);dashboardStats().then(setStats).finally(()=>setLoading(false));};
  useEffect(load,[]);
  return <AdminGuard><AdminPage><div className="mb-8 flex items-center justify-between"><div><h1 className="text-3xl font-extrabold">لوحة التحكم</h1><p className="mt-1 text-slate-400">نظرة عامة على متجر SODFA</p></div><Button variant="outline" className="border-slate-700 bg-transparent" onClick={load}><RefreshCw size={17}/>تحديث</Button></div>
    <div className="grid gap-5 md:grid-cols-3">
      <Stat icon={<Package/>} title="المنتجات" value={stats.products}/>
      <Stat icon={<Tags/>} title="التصنيفات" value={stats.categories}/>
      <Stat icon={<ShoppingCart/>} title="الطلبات" value={stats.orders}/>
    </div>
    <Card className="mt-6 border-slate-800 bg-slate-900"><CardContent className="p-6"><h2 className="text-xl font-bold">ابدأ من هنا</h2><p className="mt-2 text-slate-400">أضف التصنيفات أولًا، ثم المنتجات واربطها بالتصنيف المناسب. البيانات تُحفظ مباشرة في Supabase.</p></CardContent></Card>
  </AdminPage></AdminGuard>;
}
function Stat({icon,title,value}:{icon:React.ReactNode;title:string;value:number}){return <Card className="border-slate-800 bg-slate-900"><CardContent className="flex items-center gap-4 p-6"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-800">{icon}</div><div><div className="text-sm text-slate-400">{title}</div><div className="mt-1 text-3xl font-extrabold">{value}</div></div></CardContent></Card>}
