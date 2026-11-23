import Image from "next/image";

export default function OfflinePage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#070b14] px-6 text-[#f8fafc]">
      <section className="w-full max-w-md text-center">
        <Image
          src="/icons/icon-192.png"
          alt="Veli"
          width={88}
          height={88}
          className="mx-auto rounded-2xl"
          priority
        />
        <h1 className="mt-6 text-2xl font-semibold">Você está offline</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          Conecte-se à internet para atualizar pedidos, alunos e os demais dados do backoffice.
        </p>
      </section>
    </main>
  );
}
