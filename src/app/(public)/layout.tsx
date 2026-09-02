export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center overflow-x-hidden bg-[#070b14] bg-[radial-gradient(circle_at_top,_#111827_0%,_#070b14_58%,_#05070d_100%)] px-4 py-8 text-[#F8FAFC] sm:px-6">
      {children}
    </div>
  );
}
