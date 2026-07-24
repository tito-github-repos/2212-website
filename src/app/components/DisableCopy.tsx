// src/app/components/DisableCopy.tsx
'use client';

import { useEffect } from 'react';

export default function DisableCopy() {
  useEffect(() => {
    const blockContextMenu = (e: MouseEvent) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const blockedCombo =
        (e.ctrlKey || e.metaKey) && ['c', 'u', 's', 'p'].includes(key);
      if (blockedCombo || key === 'f12') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('keydown', blockKeys);

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('keydown', blockKeys);
    };
  }, []);

  return null;
}