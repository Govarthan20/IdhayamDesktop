import React, { createContext, useContext, useState, useCallback } from 'react';

const SESSION_KEY = '@idhayam_session';

export interface SessionData {
  custId: string;
  branchId: string;
  userId: string;
  custName: string;
  custType: string;
  partyMudId: string;
  hubName: string;
  territoryName: string;
  gstNo: string;
  pan: string;
  mobile: string;
  branchName: string;
  accountCount: number;
  loginData: any;
}

interface SessionContextValue {
  session: SessionData | null;
  isRestoring: boolean;
  setSession: (data: SessionData) => Promise<void>;
  clearSession: () => Promise<void>;
}

export const DEFAULT_SESSION: SessionData = {
  custId: '', branchId: '', userId: '2937', custName: '',
  custType: 'CM', partyMudId: '', hubName: '', territoryName: '',
  gstNo: '', pan: '', mobile: '', branchName: '', accountCount: 0, loginData: null,
};

const SessionContext = createContext<SessionContextValue>({
  session: null, isRestoring: true,
  setSession: async () => {}, clearSession: async () => {},
});

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSessionState] = useState<SessionData | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [isRestoring] = useState(false);

  const setSession = useCallback(async (data: SessionData) => {
    setSessionState(data);
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch { }
  }, []);

  const clearSession = useCallback(async () => {
    setSessionState(null);
    try { localStorage.removeItem(SESSION_KEY); } catch { }
  }, []);

  return (
    <SessionContext.Provider value={{ session, isRestoring, setSession, clearSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextValue => useContext(SessionContext);
export default SessionContext;
