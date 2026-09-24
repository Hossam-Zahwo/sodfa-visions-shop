import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Package, Tags, ShoppingCart, MessageSquareHeart, LogOut, Store, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signOutAdmin } from "@/lib/admin";

const nav = [
  { to: "/admin", label: "الرئيسية", icon: LayoutDashboard },
  { to: "/admin/products", label: "المنتجات", icon: Package },
  { to: "/admin/categories", label: "التصنيفات", icon: Tags },
  { to: "/admin/orders", label: "الطلبات", icon: ShoppingCart },
  { to: "/admin/reviews", label: "تقييمات العملاء", icon: MessageSquareHeart },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const logout = async () => { await signOutAdmin(); await navigate({ to: "/admin/login" }); };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100">
      <button className="fixed right-4 top-4 z-50 rounded-lg border border-slate-700 bg-slate-900 p-2 lg:hidden" onClick={() => setOpen(!open)} aria-label="القائمة">
        {open ? <X size={20}/> : <Menu size={20}/>}
      </button>
      <aside className={`fixed inset-y-0 right-0 z-40 w-72 border-l border-slate-800 bg-slate-900 p-5 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="mb-8 flex items-center justify-between">
          <div><div className="text-xl font-extrabold">SODFA</div><div className="text-xs text-slate-400">لوحة التحكم</div></div>
          <Store className="text-slate-400"/>
        </div>
        <nav className="space-y-2">
          {nav.map(({to,label,icon:Icon}) => <Link key={to} to={to as any} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${location.pathname === to ? "bg-white text-slate-950" : "text-slate-300 hover:bg-slate-800"}`}><Icon size={19}/>{label}</Link>)}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 space-y-2">
          <Link to="/" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"><Store size={18}/>المتجر</Link>
          <Button variant="outline" className="w-full border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800" onClick={logout}><LogOut size={18}/>تسجيل الخروج</Button>
        </div>
      </aside>
      <main className="min-h-screen lg:mr-72"><div className="mx-auto max-w-7xl p-5 pt-20 lg:p-8">{children}</div></main>
    </div>
  );
}

export function AdminPage({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
