"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./password-recovery.module.css";

const project = "backoffice";
const loginPath = "/login";
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "https://api.escolaveli.com").replace(/\/$/, "");
type RecoveryLink = { uid: string; token: string };
const rules = [
  { label: "Entre 8 e 128 caracteres", test: (value: string) => value.length >= 8 && value.length <= 128 },
  { label: "Uma letra maiúscula", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Uma letra minúscula", test: (value: string) => /[a-z]/.test(value) },
  { label: "Um número", test: (value: string) => /[0-9]/.test(value) },
  { label: "Um símbolo, como !, @ ou #", test: (value: string) => /[^a-zA-Z0-9\s]/.test(value) },
];

async function send(action: string, data: Record<string, string>, signal?: AbortSignal) {
  const response = await fetch(`${apiBase}/auth/password-recovery/${action}/`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, project }), cache: "no-store", credentials: "omit", signal,
    referrerPolicy: "no-referrer",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 429) throw new Error("Muitas tentativas. Aguarde antes de tentar novamente.");
    const detail = Object.values(body).flat().find((value) => typeof value === "string");
    throw new Error(typeof detail === "string" ? detail : "Não foi possível concluir. Tente novamente.");
  }
}

export function PasswordRecovery({ mode }: { mode: "request" | "confirm" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [linkStatus, setLinkStatus] = useState<"checking" | "valid" | "invalid">("checking");
  const link = useRef<RecoveryLink | null>(null);
  const score = rules.filter((rule) => rule.test(password)).length;
  const strength = !password ? "Não informada" : score < 3 ? "Fraca" : score < 5 ? "Moderada" : password.length < 12 ? "Boa" : "Forte";

  useEffect(() => {
    if (mode !== "confirm") return;
    if (!link.current) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      link.current = { uid: params.get("uid") || "", token: params.get("token") || "" };
      window.history.replaceState(window.history.state, "", window.location.pathname);
    }
    const controller = new AbortController();
    void send("validate", link.current, controller.signal).then(() => {
      setLinkStatus("valid");
    }).catch((cause) => {
      if (controller.signal.aborted) return;
      setLinkStatus("invalid");
      setError(cause instanceof Error ? cause.message : "Não foi possível validar este link.");
    });
    return () => controller.abort();
  }, [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (mode === "confirm" && (score !== rules.length || password !== confirmation)) {
      setError(password !== confirmation ? "As senhas não coincidem." : "Confira os requisitos da nova senha.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "request") await send("request", { email });
      else {
        if (!link.current || linkStatus !== "valid") throw new Error("Solicite um novo link para continuar.");
        await send("confirm", { ...link.current, new_password: password, confirm_password: confirmation });
        link.current = null;
        setPassword(""); setConfirmation("");
      }
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível conectar. Tente novamente.");
    } finally { setBusy(false); }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="recovery-title">
        <div className={styles.intro}>
          <p className={styles.brand}>Véli<span>Escola de idiomas</span></p>
          <p className={styles.eyebrow}>Sua conta, seu próximo passo</p>
          <h1 id="recovery-title">{done ? mode === "request" ? "Confira seu e-mail." : "Tudo pronto para voltar." : mode === "request" ? "Vamos recuperar seu acesso?" : "Uma nova senha. A mesma jornada."}</h1>
        </div>
        <div className={styles.content}>
          {done ? <div role="status">
            <p>{mode === "request" ? "Se houver uma conta com este e-mail, você receberá um link para redefinir sua senha. Confira também a caixa de spam." : "Sua senha foi redefinida com sucesso. Entre com a nova senha para continuar."}</p>
            {mode === "request" ? <p>O link é válido por 60 minutos e abre este mesmo projeto.</p> : null}
          </div> : mode === "confirm" && linkStatus === "checking" ? <p role="status">Verificando seu link…</p> : mode === "confirm" && linkStatus === "invalid" ? <div>
            <p role="alert">{error}</p>
            <Link className={styles.button} href="/recuperar-senha">Solicitar um novo link</Link>
          </div> : <form onSubmit={submit}>
            {mode === "request" ? <>
              <p>Informe o e-mail usado na sua conta. Enviaremos as instruções por lá.</p>
              <label htmlFor="recovery-email">E-mail</label>
              <input id="recovery-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} disabled={busy} />
            </> : <>
              <label htmlFor="new-password">Nova senha</label>
              <input id="new-password" type={visible ? "text" : "password"} autoComplete="new-password" required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} disabled={busy} aria-describedby="password-rules password-strength" />
              <label htmlFor="confirm-password">Confirme a nova senha</label>
              <input id="confirm-password" type={visible ? "text" : "password"} autoComplete="new-password" required maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={busy} aria-invalid={!!confirmation && password !== confirmation} />
              <button className={styles.visibility} type="button" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? "Ocultar senhas" : "Mostrar senhas"}</button>
              {confirmation && password !== confirmation ? <p role="status">As senhas não coincidem.</p> : null}
              <div className={styles.rules}>
                <p id="password-strength" aria-live="polite">Força estimada: <strong>{strength}</strong></p>
                <meter min={0} max={6} value={password ? score + (score === 5 && password.length >= 12 ? 1 : 0) : 0} aria-label="Força estimada da senha" />
                <ul id="password-rules">{rules.map((rule) => <li key={rule.label} data-met={rule.test(password)}><span aria-label={rule.test(password) ? "Atendido:" : "Pendente:"}>{rule.test(password) ? "✓" : "○"}</span> {rule.label}</li>)}</ul>
                <p>Evite senhas comuns ou parecidas com seus dados pessoais. Prefira 12 caracteres ou mais.</p>
              </div>
            </>}
            {error ? <p role="alert" className={styles.error}>{error}</p> : null}
            <button className={styles.button} disabled={busy} type="submit">{busy ? "Aguarde…" : mode === "request" ? "Enviar link por e-mail" : "Salvar nova senha"}</button>
          </form>}
          <Link className={styles.back} href={loginPath}>Voltar para entrar</Link>
        </div>
      </section>
    </main>
  );
}
