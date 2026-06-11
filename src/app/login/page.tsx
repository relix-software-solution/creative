"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { KeyboardEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { useLogin } from "@/features/auth/use-login";
import { LoginFormValues, loginSchema } from "@/features/auth/auth.schema";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const handleLogin = form.handleSubmit((values) => {
    loginMutation.mutate(values);
  });

  function handleEnterLogin(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;

    event.preventDefault();
    event.stopPropagation();

    handleLogin();
  }

  return (
    <main className="relative h-screen overflow-hidden bg-[#F8F8FF] text-[#4B4B4B]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(168,128,66,0.16),transparent_28%),radial-gradient(circle_at_90%_15%,rgba(0,0,0,0.06),transparent_24%),radial-gradient(circle_at_70%_95%,rgba(168,128,66,0.12),transparent_30%)]" />

      <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full border border-[#A88042]/20" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 rounded-full border border-[#A88042]/20" />
      <div className="pointer-events-none absolute right-24 top-24 h-2 w-2 rounded-full bg-[#A88042]" />
      <div className="pointer-events-none absolute right-40 top-36 h-3 w-3 rounded-full bg-[#A88042]/70" />
      <div className="pointer-events-none absolute right-56 top-20 h-1.5 w-1.5 rounded-full bg-[#A88042]/60" />

      <div className="relative grid h-screen lg:grid-cols-[1.02fr_0.98fr]">
        <section className="hidden h-screen overflow-hidden bg-black px-8 py-7 text-white lg:flex lg:flex-col lg:justify-between xl:px-10">
          <div className="shrink-0">
            <div className="flex items-center gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#050505] shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_30%,rgba(168,128,66,0.95),transparent_16%),radial-gradient(circle_at_58%_30%,rgba(168,128,66,0.8),transparent_12%),radial-gradient(circle_at_45%_62%,rgba(168,128,66,0.65),transparent_14%),radial-gradient(circle_at_70%_68%,rgba(168,128,66,0.42),transparent_10%)]" />
                <span className="relative text-xl font-extrabold text-[#A88042]">
                  C
                </span>
              </div>

              <div>
                <h1 className="text-xl font-extrabold">Creative Group</h1>
                <p className="mt-1 text-xs font-bold text-[#A88042]">
                  For Event Services
                </p>
              </div>
            </div>
          </div>

          <div className="my-8 max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#A88042]/30 bg-[#A88042]/10 px-4 py-2 text-xs font-bold text-[#D6B06E]">
              <Sparkles className="h-4 w-4" />
              منصة تشغيل الفعاليات والمعارض
            </div>

            <h2 className="max-w-xl text-4xl font-extrabold leading-[1.25] xl:text-5xl">
              إدارة فاخرة ومنظمة لكل تفاصيل الحدث.
            </h2>

            <p className="mt-5 max-w-xl text-sm font-bold leading-7 text-white/58 xl:text-base">
              تحكم كامل بالفعاليات، التسجيلات، أجهزة السكانر، QR، نقاط الدخول،
              والتقارير التشغيلية من لوحة واحدة بهوية احترافية.
            </p>
          </div>

          <div className="grid shrink-0 grid-cols-3 gap-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#A88042]/20 text-[#D6B06E]">
                <Building2 className="h-5 w-5" />
              </div>
              <p className="text-xl font-extrabold xl:text-2xl">24</p>
              <p className="mt-1 text-xs font-bold text-white/45">
                فعالية نشطة
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#A88042]/20 text-[#D6B06E]">
                <QrCode className="h-5 w-5" />
              </div>
              <p className="text-xl font-extrabold xl:text-2xl">41K</p>
              <p className="mt-1 text-xs font-bold text-white/45">عملية مسح</p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#A88042]/20 text-[#D6B06E]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-xl font-extrabold xl:text-2xl">99%</p>
              <p className="mt-1 text-xs font-bold text-white/45">
                جاهزية تشغيل
              </p>
            </div>
          </div>
        </section>

        <section className="flex h-screen items-center justify-center overflow-hidden p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-[430px]">
            <div className="mb-5 text-center lg:hidden">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-black text-xl font-extrabold text-[#A88042]">
                C
              </div>

              <h1 className="text-xl font-extrabold text-[#4B4B4B]">
                Creative Group
              </h1>

              <p className="mt-1 text-xs font-bold text-[#A88042]">
                For Event Services
              </p>
            </div>

            <div className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_24px_70px_rgba(0,0,0,0.10)] sm:p-6 xl:p-7">
              <div className="mb-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-[#A88042] shadow-xl shadow-black/10">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <p className="text-xs font-extrabold uppercase tracking-wide text-[#A88042]">
                  Admin Portal
                </p>

                <h2 className="mt-2 text-2xl font-extrabold text-[#4B4B4B]">
                  تسجيل الدخول
                </h2>

                <p className="mt-2 text-sm font-bold leading-6 text-[#4B4B4B]/58">
                  ادخل إلى لوحة التحكم لإدارة الفعاليات والتسجيلات وعمليات
                  الدخول.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-extrabold text-[#4B4B4B]">
                    البريد الإلكتروني أو رقم الهاتف
                  </label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#4B4B4B]/40" />

                    <input
                      {...form.register("identifier")}
                      className="h-[48px] w-full rounded-2xl border border-black/10 bg-[#F8F8FF] pr-12 pl-4 text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/35 focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10"
                      placeholder="admin@example.com"
                      autoComplete="username"
                      inputMode="email"
                      onKeyDown={handleEnterLogin}
                    />
                  </div>

                  {form.formState.errors.identifier ? (
                    <p className="text-sm font-bold text-red-600">
                      {form.formState.errors.identifier.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-extrabold text-[#4B4B4B]">
                    كلمة المرور
                  </label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#4B4B4B]/40" />

                    <input
                      {...form.register("password")}
                      className="h-[48px] w-full rounded-2xl border border-black/10 bg-[#F8F8FF] pr-12 pl-12 text-sm font-bold text-[#4B4B4B] outline-none transition placeholder:text-[#4B4B4B]/35 focus:border-[#A88042] focus:bg-white focus:ring-4 focus:ring-[#A88042]/10"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      onKeyDown={handleEnterLogin}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B4B4B]/45 transition hover:text-[#A88042]"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {form.formState.errors.password ? (
                    <p className="text-sm font-bold text-red-600">
                      {form.formState.errors.password.message}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  disabled={loginMutation.isPending}
                  onClick={() => handleLogin()}
                  className="flex h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#A88042] px-5 text-sm font-extrabold text-white shadow-lg shadow-[#A88042]/25 transition hover:bg-[#8F6D37] focus:outline-none focus:ring-4 focus:ring-[#A88042]/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ArrowLeft className="h-5 w-5" />
                  )}
                  دخول إلى النظام
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-[#A88042]/20 bg-[#A88042]/5 p-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#A88042]/10 text-[#A88042]">
                    <ShieldCheck className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-sm font-extrabold text-[#4B4B4B]">
                      دخول آمن للوحة الإدارة
                    </p>

                    <p className="mt-1 text-xs font-bold leading-5 text-[#4B4B4B]/55">
                      الطلبات الإدارية تستخدم Bearer Token، وتطبيق السكانر
                      يستخدم Device API Key منفصل.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-xs font-bold text-[#4B4B4B]/45">
              © Creative Group For Event Services
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
