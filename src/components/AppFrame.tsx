import { TopAppBar } from '@/components/vn-ui';

export function StudentFrame({
  name,
  active,
  children,
}: {
  name: string;
  active?: 'Class' | 'Module' | 'Profile';
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-surface-container-lowest text-on-surface">
      <TopAppBar active={active} name={name} />
      {children}
    </div>
  );
}
