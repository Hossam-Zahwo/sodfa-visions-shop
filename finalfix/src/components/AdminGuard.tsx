import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getCurrentAdmin, type AdminProfile } from "@/lib/admin";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getCurrentAdmin().then((value) => {
      if (!alive) return;
      if (!value) navigate({ to: "/admin/login" });
      else setAdmin(value);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [navigate]);

  if (loading) return <div dir="rtl" className="grid min-h-screen place-items-center bg-slate-950 text-slate-200">جاري التحقق من الصلاحيات...</div>;
  if (!admin) return null;
  return <>{children}</>;
}
