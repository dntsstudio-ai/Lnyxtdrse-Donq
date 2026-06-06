/**
 * AuthContext — глобальный контекст Firebase Auth.
 * Оборачивает всё приложение, слушает onAuthStateChanged,
 * синхронизирует сессию с сервером и предоставляет openAuthModal().
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { auth, onAuthStateChanged, firebaseSignOut, type FirebaseUser } from "@/lib/firebase";
import { AuthModal } from "@/components/AuthModal";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  openAuthModal: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const syncedRef = useRef<string | null>(null); // uid последней синхронизации

  // Синхронизация Firebase сессии с Express-сервером
  const syncSession = useCallback(async (user: FirebaseUser) => {
    if (syncedRef.current === user.uid) return;
    try {
      const idToken = await user.getIdToken();
      await fetch("/api/auth/firebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });
      syncedRef.current = user.uid;
    } catch {
      // Не критично — следующий tRPC запрос вернёт 401 и попросит войти снова
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await syncSession(user);
      } else {
        syncedRef.current = null;
        // Сбрасываем серверную сессию
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [syncSession]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    await firebaseSignOut();
    syncedRef.current = null;
    window.location.reload();
  }, []);

  const openAuthModal = useCallback(() => setModalOpen(true), []);

  return (
    <AuthContext.Provider value={{ firebaseUser, loading, openAuthModal, logout }}>
      {children}
      <AuthModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => window.location.reload()}
      />
    </AuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useFirebaseAuth must be used inside AuthProvider");
  return ctx;
}
