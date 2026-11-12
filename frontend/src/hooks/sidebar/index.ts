import { useCallback, useState } from 'react';

const STORAGE_KEY = 'sidebar-collapsed';

const readCollapsed = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

// The desktop sidebar shrinks to icons; the choice is remembered.
export const useSidebarCollapsed = (): {
  collapsed: boolean;
  toggleCollapsed: () => void;
} => {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      try {
        localStorage.setItem(STORAGE_KEY, value ? '0' : '1');
      } catch {
        // Storage can be blocked; the choice still applies for this visit.
      }
      return !value;
    });
  }, []);

  return { collapsed, toggleCollapsed };
};
