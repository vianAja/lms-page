export default function LoadingLabPage() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-start justify-center px-4 py-8 md:px-8 md:py-10">
      <div className="w-full max-w-4xl rounded-2xl border border-[#c8dfc9] bg-white px-6 py-8 shadow-[0_16px_40px_rgba(74,68,102,0.08)] md:px-8 md:py-10">
        <div className="mb-6 h-9 w-2/5 animate-pulse rounded bg-[#4A4466]/10" />
        <div className="mb-8 h-px w-full bg-[#c8dfc9]" />

        <div className="space-y-4">
          <div className="h-4 w-full animate-pulse rounded bg-[#6EADBC]/15" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-[#6EADBC]/15" />
          <div className="h-4 w-10/12 animate-pulse rounded bg-[#6EADBC]/15" />
          <div className="h-4 w-8/12 animate-pulse rounded bg-[#6EADBC]/15" />
        </div>

        <div className="mt-10 rounded-xl border border-dashed border-[#c8dfc9] bg-[#F1F7D4]/50 px-4 py-4 text-sm text-[#4A4466]">
          Loading lab content and route state...
        </div>
      </div>
    </div>
  );
}
