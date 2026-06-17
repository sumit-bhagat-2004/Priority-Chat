'use client';
// components/UserProvider.tsx
// Session is managed via HttpOnly cookie on the server.
// We also store the token in sessionStorage as a fallback for in-flight requests
// right after login, before the browser fully propagates the cookie.
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@/lib/store';

interface UserContextType {
  user: User | null;
  setUser: (u: User | null) => void;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
  refetch: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data?.user) setUser(data.user);
        else setUser(null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, refetch: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
