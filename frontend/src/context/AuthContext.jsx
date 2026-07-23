import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api.js';
import { AuthContext } from './auth-context.js';

const STORAGE_KEY = 'guadalupana_session';

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const [loading, setLoading] = useState(Boolean(session?.accessToken));

  const saveSession = useCallback((nextSession) => {
    setSession(nextSession);
    if (nextSession) localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = session?.refreshToken;
    saveSession(null);
    if (refreshToken) await apiRequest('/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => {});
  }, [saveSession, session?.refreshToken]);

  const accessToken = session?.accessToken;
  useEffect(() => {
    const expire = () => saveSession(null);
    window.addEventListener('guadalupana:session-expired', expire);
    return () => window.removeEventListener('guadalupana:session-expired', expire);
  }, [saveSession]);
  useEffect(() => {
    if (!accessToken) return;
    apiRequest('/auth/me', { token: accessToken })
      .then(({ data }) =>
        setSession((current) => {
          const next = { ...current, user: data.user };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        }),
      )
      .catch(() => {
        setSession(null);
        localStorage.removeItem(STORAGE_KEY);
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const login = useCallback(
    async (credentials) => {
      const { data } = await apiRequest('/auth/login', { method: 'POST', body: credentials });
      saveSession(data);
      return data.user;
    },
    [saveSession],
  );

  const value = useMemo(
    () => ({ user: session?.user || null, accessToken: session?.accessToken || null, loading, login, logout }),
    [session, loading, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
