import { PasswordRecovery } from "@/features/auth/password-recovery";

export const metadata = { title: "Recuperar acesso | Véli", robots: { index: false, follow: false }, referrer: "no-referrer" as const };

export default function Page() {
  return <PasswordRecovery mode="request" />;
}
