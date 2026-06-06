import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  signInWithGoogle,
  loginWithEmail,
  registerWithEmail,
  resetPassword,
} from "@/lib/firebase";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Screen = "main" | "login" | "register" | "reset";

export function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const [screen, setScreen] = useState<Screen>("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const reset = () => {
    setScreen("main");
    setEmail("");
    setPassword("");
    setName("");
    setError("");
    setLoading(false);
    setResetSent(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  /** После получения Firebase токена — отправляем на сервер */
  const syncWithServer = async () => {
    const user = (await import("@/lib/firebase")).auth.currentUser;
    if (!user) return;
    const idToken = await user.getIdToken();
    const res = await fetch("/api/auth/firebase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) throw new Error("Ошибка синхронизации с сервером");
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      await syncWithServer();
      handleClose(false);
      onSuccess?.();
    } catch (e: unknown) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await loginWithEmail(email, password);
      await syncWithServer();
      handleClose(false);
      onSuccess?.();
    } catch (e: unknown) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await registerWithEmail(email, password);
      await syncWithServer();
      handleClose(false);
      onSuccess?.();
    } catch (e: unknown) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (e: unknown) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl bg-white">

        {/* Шапка */}
        <div className="bg-gradient-to-br from-[var(--color-brand-navy)] to-[var(--color-brand-blue,#2563eb)] px-6 pt-8 pb-6 text-white">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg font-bold">
              Э
            </div>
            <span className="font-semibold text-sm opacity-90">ЭдуДон</span>
          </div>
          <DialogTitle className="text-xl font-bold mt-3 text-white">
            {screen === "main" && "Войдите в аккаунт"}
            {screen === "login" && "Вход по email"}
            {screen === "register" && "Регистрация"}
            {screen === "reset" && "Сброс пароля"}
          </DialogTitle>
          <p className="text-sm text-white/70 mt-1">
            {screen === "main" && "Образовательный портал Ростовской области"}
            {screen === "login" && "Введите данные вашего аккаунта"}
            {screen === "register" && "Создайте аккаунт, чтобы начать"}
            {screen === "reset" && "Отправим ссылку на почту"}
          </p>
        </div>

        <div className="px-6 py-5 space-y-3">

          {/* ── Главный экран ── */}
          {screen === "main" && (
            <>
              <Button
                onClick={handleGoogle}
                disabled={loading}
                variant="outline"
                className="w-full h-11 flex items-center gap-3 border-gray-200 hover:bg-gray-50 font-medium"
              >
                <GoogleIcon />
                Войти через Google
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">
                  или через email
                </div>
              </div>

              <Button
                onClick={() => setScreen("login")}
                className="w-full h-11 bg-[var(--color-brand-navy)] hover:bg-[var(--color-brand-navy)]/90 text-white font-medium"
              >
                Войти с паролем
              </Button>

              <p className="text-center text-sm text-gray-500">
                Нет аккаунта?{" "}
                <button
                  onClick={() => setScreen("register")}
                  className="text-[var(--color-brand-navy)] font-medium hover:underline"
                >
                  Зарегистрироваться
                </button>
              </p>
            </>
          )}

          {/* ── Вход по email ── */}
          {screen === "login" && (
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm text-gray-700">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-10"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[var(--color-brand-navy)] hover:bg-[var(--color-brand-navy)]/90 text-white font-medium"
              >
                {loading ? "Вхожу..." : "Войти"}
              </Button>
              <div className="flex justify-between text-sm pt-1">
                <button
                  type="button"
                  onClick={() => setScreen("reset")}
                  className="text-gray-500 hover:underline"
                >
                  Забыли пароль?
                </button>
                <button
                  type="button"
                  onClick={() => setScreen("main")}
                  className="text-gray-500 hover:underline"
                >
                  ← Назад
                </button>
              </div>
            </form>
          )}

          {/* ── Регистрация ── */}
          {screen === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="reg-email" className="text-sm text-gray-700">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reg-password" className="text-sm text-gray-700">Пароль</Label>
                <Input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  required
                  minLength={6}
                  className="h-10"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[var(--color-brand-navy)] hover:bg-[var(--color-brand-navy)]/90 text-white font-medium"
              >
                {loading ? "Создаю аккаунт..." : "Зарегистрироваться"}
              </Button>
              <p className="text-center text-sm text-gray-500">
                Уже есть аккаунт?{" "}
                <button
                  type="button"
                  onClick={() => setScreen("login")}
                  className="text-[var(--color-brand-navy)] font-medium hover:underline"
                >
                  Войти
                </button>
              </p>
            </form>
          )}

          {/* ── Сброс пароля ── */}
          {screen === "reset" && (
            <form onSubmit={handleReset} className="space-y-3">
              {resetSent ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-green-700 font-medium text-sm">Письмо отправлено!</p>
                  <p className="text-green-600 text-xs mt-1">Проверьте почту {email}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="reset-email" className="text-sm text-gray-700">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="h-10"
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-[var(--color-brand-navy)] hover:bg-[var(--color-brand-navy)]/90 text-white font-medium"
                  >
                    {loading ? "Отправляю..." : "Отправить ссылку"}
                  </Button>
                </>
              )}
              <p className="text-center">
                <button
                  type="button"
                  onClick={() => setScreen("login")}
                  className="text-sm text-gray-500 hover:underline"
                >
                  ← Назад
                </button>
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

/** Перевод Firebase ошибок на русский */
function friendlyError(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/email-already-in-use": "Этот email уже зарегистрирован",
    "auth/invalid-email": "Некорректный email адрес",
    "auth/weak-password": "Пароль слишком простой (минимум 6 символов)",
    "auth/user-not-found": "Пользователь не найден",
    "auth/wrong-password": "Неверный пароль",
    "auth/invalid-credential": "Неверный email или пароль",
    "auth/too-many-requests": "Слишком много попыток. Попробуйте позже",
    "auth/popup-closed-by-user": "Окно входа было закрыто",
    "auth/network-request-failed": "Ошибка сети. Проверьте интернет",
    "auth/user-disabled": "Аккаунт заблокирован",
  };
  return map[code] ?? "Произошла ошибка. Попробуйте снова";
}
