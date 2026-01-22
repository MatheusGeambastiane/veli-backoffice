export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.12),_transparent_55%)] p-6">
      {children}
    </div>
  );
}
