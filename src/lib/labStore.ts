import { create } from 'zustand';

export type LabData = {
  labId: string;
  labTitle: string;
  allowlist?: { exactCommands: string[] };
  nextLabHref: string | null;
  prevLabHref: string | null;
};

interface LabStore {
  labData: LabData | null;
  setLabData: (data: LabData) => void;
}

export const useLabStore = create<LabStore>((set) => ({
  labData: null,
  setLabData: (data) => set({ labData: data }),
}));
