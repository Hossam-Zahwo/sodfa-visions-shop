import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LockKeyhole, Mail, ArrowRight, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCurrentAdmin } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/login")({ component: AdminLogin });

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("zahwohossam@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const checkExistingSession = async () => {
      const admin = await getCurrentAdmin();
      if (active && admin) await navigate({ to: "/admin", replace: true });
    };

    checkExistingSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        void getCurrentAdmin().then((admin) => {
          if (active && admin) void navigate({ to: "/admin", replace: true });
        });
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "بيانات الدخول غير صحيحة. لو كلمة المرور غير معروفة استخدم زر «إرسال رابط دخول للإيميل» بالأسفل، وسيتم الدخول بدون الحاجة لمعرفة كلمة المرور."
          : authError.message,
      );
      setLoading(false);
      return;
    }

    const admin = await getCurrentAdmin();
    if (!admin) {
      await supabase.auth.signOut();
      setError("تم تسجيل الدخول لكن هذا الحساب غير موجود كمدير نشط في admin_profiles.");
      setLoading(false);
      return;
    }

    await navigate({ to: "/admin", replace: true });
    setLoading(false);
  };

  const sendMagicLink = async () => {
    setError("");
    setNotice("");
    setMagicLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("اكتب البريد الإلكتروني أولًا.");
      setMagicLoading(false);
      return;
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/admin/login`,
      },
    });

    if (otpError) {
      setError(otpError.message);
    } else {
      setNotice("تم إرسال رابط دخول إلى بريدك الإلكتروني. افتح الرابط من نفس المتصفح لإكمال الدخول.");
    }

    setMagicLoading(false);
  };

  return (
    <div dir="rtl" className="grid min-h-screen place-items-center bg-slate-950 p-5 text-slate-100">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-white text-slate-950">
            <LockKeyhole />
          </div>
          <CardTitle className="text-2xl">دخول لوحة التحكم</CardTitle>
          <p className="text-sm text-slate-400">SODFA Admin</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-slate-700 bg-slate-950 pr-10"
                  type="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm">كلمة المرور</label>
              <Input
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-slate-700 bg-slate-950"
                type="password"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm leading-6 text-red-300">
                {error}
              </div>
            )}
            {notice && (
              <div className="rounded-lg border border-emerald-900 bg-emerald-950/40 p-3 text-sm leading-6 text-emerald-300">
                {notice}
              </div>
            )}

            <Button disabled={loading || magicLoading} className="w-full">
              {loading ? "جاري الدخول..." : <>دخول <ArrowRight size={17} /></>}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
            <div className="h-px flex-1 bg-slate-800" />
            <span>أو</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={loading || magicLoading}
            onClick={sendMagicLink}
            className="w-full border-slate-700 bg-transparent text-slate-100 hover:bg-slate-800"
          >
            <KeyRound size={17} />
            {magicLoading ? "جاري إرسال الرابط..." : "إرسال رابط دخول للإيميل"}
          </Button>

          <p className="mt-3 text-center text-xs leading-5 text-slate-500">
            استخدم رابط الدخول إذا كنت لا تعرف كلمة مرور حساب Supabase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
