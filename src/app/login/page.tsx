"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useLogin } from "@/features/auth/use-login";
import { LoginFormValues, loginSchema } from "@/features/auth/auth.schema";

export default function LoginPage() {
  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm text-cyan-300">Creative Event Ops</p>
          <h1 className="text-3xl font-bold">تسجيل الدخول</h1>
          <p className="mt-2 text-sm text-slate-300">
            ادخل إلى لوحة التحكم لإدارة الفعاليات
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm text-slate-200">
              البريد الإلكتروني أو رقم الهاتف
            </label>
            <input
              {...form.register("identifier")}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              placeholder="admin@example.com"
              autoComplete="username"
            />
            {form.formState.errors.identifier ? (
              <p className="text-sm text-red-300">
                {form.formState.errors.identifier.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-200">كلمة المرور</label>
            <input
              {...form.register("password")}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-red-300">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loginMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : null}
            دخول
          </button>
        </form>
      </div>
    </main>
  );
}
