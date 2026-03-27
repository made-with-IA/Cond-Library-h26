import React, { createContext, useContext, useEffect, useState } from "react";
import { setBaseUrl, setAuthTokenGetter, type AdminProfile, type UserProfile, adminMe, readerMe } from "@workspace/api-client-react";

// Initialize base URL immediately
setBaseUrl(window.location.origin);

// Dynamic auth token getter that checks the current path context
setAuthTokenGetter(() => {
  const path = window.location.pathname;
  if (path.startsWith('/admin')) {
    return getValidToken('admin_token', ADMIN_TTL_MS);
  }
  if (path.startsWith('/reader')) {
    return getValidToken('reader_token', READER_TTL_MS);
  }
  return getValidToken('reader_token', READER_TTL_MS) || getValidToken('admin_token', ADMIN_TTL_MS);
});

const ADMIN_TTL_MS = 7 * 24 * 60 * 60 * 1000;   // 7 days
const READER_TTL_MS = 30 * 24 * 60 * 60 * 1000;  // 30 days

/** Returns the stored token only if it was issued within the allowed TTL. */
function getValidToken(key: string, ttlMs: number): string | null {
  const token = localStorage.getItem(key);
  const issuedAt = localStorage.getItem(`${key}_issued_at`);
  if (!token || !issuedAt) return null;
  const age = Date.now() - Number(issuedAt);
  if (age > ttlMs) {
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_issued_at`);
    return null;
  }
  return token;
}

function storeToken(key: string, token: string) {
  localStorage.setItem(key, token);
  localStorage.setItem(`${key}_issued_at`, String(Date.now()));
}

function clearToken(key: string) {
  localStorage.removeItem(key);
  localStorage.removeItem(`${key}_issued_at`);
}

// --- ADMIN AUTH ---
interface AdminAuthContextType {
  admin: AdminProfile | null;
  isLoading: boolean;
  login: (token: string, admin: AdminProfile) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getValidToken('admin_token', ADMIN_TTL_MS);
      if (token) {
        try {
          const data = await adminMe();
          setAdmin(data);
        } catch {
          clearToken('admin_token');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = (token: string, adminData: AdminProfile) => {
    storeToken('admin_token', token);
    setAdmin(adminData);
  };

  const logout = () => {
    clearToken('admin_token');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return context;
};


// --- READER AUTH ---
interface ReaderAuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
}

const ReaderAuthContext = createContext<ReaderAuthContextType | undefined>(undefined);

export function ReaderAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getValidToken('reader_token', READER_TTL_MS);
      if (token) {
        try {
          const data = await readerMe();
          setUser(data);
        } catch {
          clearToken('reader_token');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = (token: string, userData: UserProfile) => {
    storeToken('reader_token', token);
    setUser(userData);
  };

  const logout = () => {
    clearToken('reader_token');
    setUser(null);
  };

  return (
    <ReaderAuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </ReaderAuthContext.Provider>
  );
}

export const useReaderAuth = () => {
  const context = useContext(ReaderAuthContext);
  if (!context) throw new Error("useReaderAuth must be used within ReaderAuthProvider");
  return context;
};
