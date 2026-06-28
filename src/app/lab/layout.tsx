import { requireSession } from '@/lib/session';
import LabShellClient from '@/components/LabShellClient';

export default async function LabLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="h-dvh overflow-hidden bg-[#F1F7D4] text-[#1e1d2e]">
      <LabShellClient username={session.username || ''}>
        {children}
      </LabShellClient>
    </div>
  );
}
