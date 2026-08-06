import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { MoreMenuSheet } from '../components/MoreMenuSheet';

type MoreMenuContextValue = {
  openMoreMenu: () => void;
  closeMoreMenu: () => void;
};

const MoreMenuContext = createContext<MoreMenuContextValue | null>(null);

export const MoreMenuProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);

  const openMoreMenu = useCallback(() => setVisible(true), []);
  const closeMoreMenu = useCallback(() => setVisible(false), []);

  const value = useMemo<MoreMenuContextValue>(
    () => ({ openMoreMenu, closeMoreMenu }),
    [openMoreMenu, closeMoreMenu],
  );

  return (
    <MoreMenuContext.Provider value={value}>
      {children}
      <MoreMenuSheet visible={visible} onClose={closeMoreMenu} />
    </MoreMenuContext.Provider>
  );
};

export function useMoreMenu(): MoreMenuContextValue {
  const ctx = useContext(MoreMenuContext);
  if (!ctx) {
    throw new Error('useMoreMenu must be used within MoreMenuProvider');
  }
  return ctx;
}
