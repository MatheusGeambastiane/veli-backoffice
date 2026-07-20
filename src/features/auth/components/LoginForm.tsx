"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/loginSchema";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    const result = await signIn("credentials", {
      redirect: false,
      email: values.email,
      password: values.password,
    });

    if (result?.error) {
      const normalized = result.error.replace(/^Error:\s*/i, "");
      setError(normalized);
      return;
    }

    router.push("/");
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2.5">
        <Label htmlFor="email" className="text-[13px] font-semibold text-[#E2E8F0]">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="mariaprofessora@example.com"
          autoComplete="email"
          className="h-12 rounded-xl border-white/[0.08] bg-[#111827] px-4 text-[15px] text-[#F8FAFC] placeholder:text-[#64748B] transition-colors duration-200 hover:border-[rgba(59,130,246,0.25)] focus-visible:border-[#3B82F6] focus-visible:ring-4 focus-visible:ring-[rgba(59,130,246,0.12)] sm:h-[52px] sm:text-base"
          {...register("email")}
        />
        {errors.email ? (
          <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {errors.email.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-[13px] font-semibold text-[#E2E8F0]">
            Senha
          </Label>
          <button
            type="button"
            className="rounded-md text-[13px] font-medium text-[#60A5FA] transition-colors duration-200 hover:text-[#93C5FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120]"
          >
            Esqueceu a senha?
          </button>
        </div>
        <div className="group relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Secret123!"
            autoComplete="current-password"
            className="h-12 rounded-xl border-white/[0.08] bg-[#111827] px-4 pr-12 text-[15px] text-[#F8FAFC] placeholder:text-[#64748B] transition-colors duration-200 hover:border-[rgba(59,130,246,0.25)] focus-visible:border-[#3B82F6] focus-visible:ring-4 focus-visible:ring-[rgba(59,130,246,0.12)] sm:h-[52px] sm:text-base"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md text-[#64748B] transition-colors duration-200 hover:text-[#3B82F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827] group-focus-within:text-[#3B82F6]"
            aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password ? (
          <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {errors.password.message}
          </p>
        ) : null}
      </div>
      {error ? (
        <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        className="h-12 w-full rounded-xl bg-[linear-gradient(90deg,_#2563EB,_#3B82F6)] text-[15px] font-semibold text-[#F8FAFC] shadow-none transition-all duration-200 hover:-translate-y-px hover:brightness-110 hover:shadow-[0_8px_30px_rgba(37,99,235,0.35)] active:translate-y-0 focus-visible:ring-4 focus-visible:ring-[rgba(59,130,246,0.18)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1120] sm:h-[52px]"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Entrando..." : "Entrar na plataforma"}
      </Button>
    </form>
  );
}
