import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// -----------------------------------------------------------------------------
// Prototype access gate ONLY. This check runs in the browser, so it is NOT real
// security: the credentials below ship in the client bundle and can be read or
// bypassed by anyone with dev tools. It exists to deter casual access to the
// demo. Replace with SSO / OIDC for production (see the production-readiness
// checklist). Change or extend these demo accounts as needed.
// -----------------------------------------------------------------------------
const USERS: {
  username: string;
  password: string;
  name: string;
  role: "Admin" | "User";
}[] = [
  { username: "admin", password: "see2026", name: "Admin", role: "Admin" },
  { username: "originator", password: "see2026", name: "Originator", role: "User" },
];

const KEY = "deal-scout.auth.v1";

export type AuthUser = { username: string; name: string; role: "Admin" | "User" };

type AuthValue = {
  user: AuthUser | null;
  ready: boolean; // localStorage hydrated (client only)
  signIn: (username: string, password: string) => AuthUser | null;
  signOut: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      // ignore malformed storage
    }
    setReady(true);
  }, []);

  const signIn = (username: string, password: string): AuthUser | null => {
    const match = USERS.find(
      (u) =>
        u.username.toLowerCase() === username.trim().toLowerCase() &&
        u.password === password,
    );
    if (!match) return null;
    const au: AuthUser = { username: match.username, name: match.name, role: match.role };
    setUser(au);
    try {
      localStorage.setItem(KEY, JSON.stringify(au));
    } catch {
      // ignore quota errors
    }
    return au;
  };

  const signOut = () => {
    setUser(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
