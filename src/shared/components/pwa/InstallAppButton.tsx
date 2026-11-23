"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isRunningStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [isInstalled, setIsInstalled] = useState(true);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsInstalled(isRunningStandalone());
      setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    });

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setIsInstalled(false);
    }

    function handleAppInstalled() {
      setInstallPrompt(null);
      setShowIosHelp(false);
      setIsInstalled(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (isInstalled || (!installPrompt && !isIos)) return null;

  async function handleInstall() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstallPrompt(null);
      }
      return;
    }

    setShowIosHelp((current) => !current);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void handleInstall()}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        aria-expanded={showIosHelp}
      >
        <Download aria-hidden="true" className="h-4 w-4" />
        <span className="hidden md:inline">Instalar app</span>
      </button>
      {showIosHelp ? (
        <div
          role="status"
          className="absolute right-0 top-12 z-30 w-72 rounded-xl border border-border bg-popover p-4 text-sm text-popover-foreground shadow-xl"
        >
          <p className="font-semibold">Instalar no iPhone ou iPad</p>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            No Safari, toque em <Share aria-label="Compartilhar" className="mx-1 inline h-4 w-4" />
            e escolha “Adicionar à Tela de Início”.
          </p>
        </div>
      ) : null}
    </div>
  );
}
