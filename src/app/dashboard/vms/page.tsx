import VmMonitorClient from './VmMonitorClient';

export const metadata = {
  title: 'VM Monitor – VN Labs Admin',
  description: 'View and manage running Firecracker microVM instances',
};

export default function VmMonitorPage() {
  return <VmMonitorClient />;
}
