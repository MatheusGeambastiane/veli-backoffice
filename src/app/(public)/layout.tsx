export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-[#050816] bg-[radial-gradient(circle_at_top,_#0F172A_0%,_#050816_60%,_#02040A_100%)] px-4 py-8 text-[#F8FAFC] sm:px-6">
      {children}
    </div>
  );
}
