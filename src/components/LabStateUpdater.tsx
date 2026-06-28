'use client';

import { useEffect } from 'react';
import { useLabStore, LabData } from '@/lib/labStore';

export default function LabStateUpdater({ data }: { data: LabData }) {
  const setLabData = useLabStore((state) => state.setLabData);

  useEffect(() => {
    setLabData(data);
  }, [data, setLabData]);

  return null;
}
