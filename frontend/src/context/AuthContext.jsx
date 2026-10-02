import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../api/endpoints.js';
import { clearToken, getToken, setToken, setUnauthorizedHandler } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  // 'loading' while validating a stored token, then 'authed' | 'anon' | 'error'
  const [status, setStatus] = useState(() => (getToken() ? 'loading' : 'anon'));
  const [bootError, setBootError] = useState(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  const boot = useCallback(async () => {
    if (!getToken()) {
      setStatus('anon');
      return;
    }
    setStatus('loading');
    setBootError(null);
    try {
      const me = await api.getMe();
      setUser(me);
      setStatus('authed');
    } catch (err) {
      if (err.status === 401 || err.code === 'UNAUTHORIZED') {
        clearToken();
        setUser(null);
        setStatus('anon');
      } else {
        setBootError(err);
        setStatus('error');
      }
    }
  }, []);

  useEffect(() => {
    boot();
  }, [boot]);

  // Client calls this after clearing the token on any 401 from a protected endpoint.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      const wasAuthed = statusRef.current === 'authed';
      setUser(null);
      setStatus('anon');
      if (wasAuthed) toast.info('Your session expired. Please sign in again.');
    });
    return () => setUnauthorizedHandler(null);
  }, [toast]);

  const signIn = useCallback(async (creds) => {
    const { token, user: u } = await api.login(creds);
    setToken(token);
    setUser(u);
    setStatus('authed');
    return u;
  }, []);

  const signUp = useCallback(async (body) => {
    // API returns { token, user }; we are logged in immediately after registering.
    const { token, user: u } = await api.register(body);
    setToken(token);
    setUser(u);
    setStatus('authed');
    return u;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* the client discards the token regardless */
    }
    clearToken();
    setUser(null);
    setStatus('anon');
  }, []);

  const signOutEverywhere = useCallback(async () => {
    await api.logoutAll(); // surface errors: the user should know if other sessions stayed valid
    clearToken();
    setUser(null);
    setStatus('anon');
  }, []);

  const value = useMemo(
    () => ({ user, status, bootError, retryBoot: boot, signIn, signUp, signOut, signOutEverywhere }),
    [user, status, bootError, boot, signIn, signUp, signOut, signOutEverywhere],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
