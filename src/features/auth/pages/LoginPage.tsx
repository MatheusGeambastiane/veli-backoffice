import Image from "next/image";
import { Poppins } from "next/font/google";
import { Card, CardContent } from "@/shared/components/ui/card";
import { LoginForm } from "@/features/auth/components/LoginForm";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export function LoginPage() {
  return (
    <div className="login-panel-enter relative flex w-full max-w-[440px] flex-col items-center gap-8 sm:gap-9">
      <div className="pointer-events-none absolute left-1/2 top-[54%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(59,130,246,0.08)] blur-3xl" />

      <div className="relative z-10 flex items-center gap-3">
        <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-[#0B1120] shadow-[0_12px_32px_rgba(2,4,10,0.32)] ring-1 ring-white/10 sm:h-16 sm:w-16">
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

      <Card className="relative z-10 w-full rounded-[20px] border border-white/[0.08] bg-[#0B1120] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <CardContent className="space-y-8 p-6 sm:p-9">
          <div className="space-y-2.5 text-center">
            <h1 className="text-[26px] font-bold leading-tight text-[#F8FAFC] sm:text-[30px]">
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
