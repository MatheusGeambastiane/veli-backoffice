import Image from "next/image";
import { Card, CardContent } from "@/shared/components/ui/card";
import { LoginForm } from "@/features/auth/components/LoginForm";

export function LoginPage() {
  return (
    <div className="login-panel-enter flex w-full max-w-[420px] flex-col items-center gap-7">
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-[#0B1120] ring-1 ring-white/10">
          <Image
            src="/Veli_simbolo fundo azul escuro.png"
            alt="Veli"
            fill
            className="object-cover"
            sizes="64px"
            priority
          />
        </div>
      </div>

      <Card className="w-full rounded-lg border border-white/10 bg-[#0B1120] shadow-[0_18px_48px_rgba(0,0,0,0.3)]">
        <CardContent className="space-y-8 p-6 sm:p-8">
          <div className="space-y-2.5 text-center">
            <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-[#F8FAFC] sm:text-[28px]">
              Bem-vindo de volta
            </h1>
            <p className="text-sm leading-6 text-[#94A3B8] sm:text-[15px]">
              Insira suas credenciais para acessar sua conta
            </p>
          </div>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
