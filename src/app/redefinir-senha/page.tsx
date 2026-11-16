import { PasswordRecovery } from "@/features/auth/password-recovery";

export const metadata = { title: "Redefinir senha | Véli", robots: { index: false, follow: false }, referrer: "no-referrer" as const };

export default function Page() {
  return <PasswordRecovery mode="confirm" />;
}
