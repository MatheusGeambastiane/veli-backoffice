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
    <div className="flex w-full max-w-lg flex-col items-center gap-6">
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-[#0b1c2c] shadow-lg shadow-blue-900/20">
          <Image
            src="/Veli_simbolo fundo azul escuro.png"
            alt="Veli"
            fill
            className="object-cover"
            sizes="64px"
            priority
          />
        </div>
        <span className={`${poppins.className} veli-logo-text text-3xl font-semibold tracking-wide`}>
          Veli
        </span>
      </div>

      <Card className="w-full rounded-2xl border border-border bg-card/95 shadow-xl shadow-slate-200/70">
        <CardContent className="space-y-6 p-8">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold text-foreground">Bem-vindo de volta</h1>
            <p className="text-sm text-muted-foreground">
              Insira suas credenciais para acessar sua conta
            </p>
          </div>
          <LoginForm />
          <div className="space-y-4 text-center text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span>OU CONTINUE COM</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-full border border-border bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground"
                disabled
              >
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 rounded-full border border-border bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground"
                disabled
              >
                Apple
              </button>
            </div>
            <p>
              Nao tem uma conta? <span className="text-primary">Fale com o suporte</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
