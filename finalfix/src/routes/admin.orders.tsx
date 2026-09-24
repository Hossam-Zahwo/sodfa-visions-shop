import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminGuard } from "@/components/AdminGuard";
import { AdminPage } from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";

export const Route=createFileRoute("/admin/orders")({component:OrdersAdmin});
function OrdersAdmin(){const [items,setItems]=useState<any[]>([]),[error,setError]=useState("");useEffect(()=>{supabase.from("orders").select("*").order("created_at",{ascending:false}).then(({data,error})=>{if(error)setError(error.message);else setItems(data||[])})},[]);return <AdminGuard><AdminPage><div className="mb-6"><h1 className="text-3xl font-extrabold">الطلبات</h1><p className="text-slate-400">الطلبات المسجلة في Supabase</p></div>{error&&<div className="rounded-lg bg-red-950/40 p-3 text-red-300">{error}</div>}<div className="grid gap-4">{items.length===0&&!error?<Card className="border-slate-800 bg-slate-900"><CardContent className="p-8 text-center text-slate-400">لا توجد طلبات حتى الآن.</CardContent></Card>:items.map(o=><Card key={o.id} className="border-slate-800 bg-slate-900"><CardContent className="p-5"><div className="flex flex-wrap justify-between gap-3"><div><div className="font-bold">طلب #{String(o.id).slice(0,8)}</div><div className="text-sm text-slate-400">{o.customer_name||"بدون اسم"} · {o.customer_phone||"بدون هاتف"}</div></div><div className="font-bold">{o.total??0} جنيه</div></div><div className="mt-3 text-sm text-slate-400">الحالة: {o.status||"pending"}</div></CardContent></Card>)}</div></AdminPage></AdminGuard>}
