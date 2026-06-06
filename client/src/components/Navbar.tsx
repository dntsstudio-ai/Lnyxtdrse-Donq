import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  Bell,
  BookOpen,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Phone,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const navLinks = [
  { href: "/", label: "Главная" },
  { href: "/catalog", label: "Каталог" },
  { href: "/news", label: "Новости" },
  { href: "/contacts", label: "Контакты" },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const { data: notifData } = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const unreadCount = notifData?.count ?? 0;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const roleLabel: Record<string, string> = {
    admin: "Администратор",
    editor: "Редактор",
    representative: "Представитель",
    user: "Пользователь",
  };

  const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
    admin: "default",
    editor: "secondary",
    representative: "outline",
    user: "outline",
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <header
      ref={navRef}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-border/60"
          : "bg-white/80 backdrop-blur-sm"
      )}
      style={{ boxShadow: scrolled ? "var(--shadow-nav)" : "none" }}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-navy)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <GraduationCap className="w-4.5 h-4.5 text-[var(--color-brand-gold)]" />
            </div>
            <span className="font-serif font-semibold text-lg text-[var(--color-brand-navy)] tracking-tight">
              EduRostov
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3.5 py-2 rounded-md text-sm font-medium transition-colors duration-150",
                  location === link.href
                    ? "text-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Link href="/catalog" className="hidden sm:flex">
              <Button variant="ghost" size="icon" className="w-9 h-9 text-muted-foreground hover:text-foreground">
                <Search className="w-4 h-4" />
              </Button>
            </Link>

            {isAuthenticated && user ? (
              <>
                {/* Notifications */}
                <Link href="/profile/notifications">
                  <Button variant="ghost" size="icon" className="w-9 h-9 relative text-muted-foreground hover:text-foreground">
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--color-brand-gold)] rounded-full text-[10px] font-bold text-white flex items-center justify-center leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={user.avatar ?? undefined} />
                        <AvatarFallback className="text-xs bg-[var(--color-brand-navy)] text-[var(--color-brand-gold)]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
                        {user.name ?? "Профиль"}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 animate-scale-in">
                    <DropdownMenuLabel className="pb-1">
                      <div className="font-medium text-sm">{user.name ?? "Пользователь"}</div>
                      <div className="text-xs text-muted-foreground font-normal mt-0.5">{user.email}</div>
                      <Badge variant={roleBadgeVariant[user.role] ?? "outline"} className="mt-1.5 text-xs">
                        {roleLabel[user.role] ?? user.role}
                      </Badge>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        Мой профиль
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile/bookmarks" className="flex items-center gap-2 cursor-pointer">
                        <BookOpen className="w-4 h-4" />
                        Сохранённые
                      </Link>
                    </DropdownMenuItem>
                    {(user.role === "editor" || user.role === "admin") && (
                      <DropdownMenuItem asChild>
                        <Link href="/editor" className="flex items-center gap-2 cursor-pointer">
                          <Newspaper className="w-4 h-4" />
                          Панель редактора
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === "representative" && (
                      <DropdownMenuItem asChild>
                        <Link href="/representative" className="flex items-center gap-2 cursor-pointer">
                          <Settings className="w-4 h-4" />
                          Портал представителя
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                          <LayoutDashboard className="w-4 h-4" />
                          Консоль администратора
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onClick={() => logout()}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Выйти
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                size="sm"
                className="bg-[var(--color-brand-navy)] text-white hover:bg-[var(--color-brand-navy-light)] font-medium"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Войти
              </Button>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden w-9 h-9"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white animate-slide-up">
          <nav className="container py-3 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  location === link.href
                    ? "text-[var(--color-brand-navy)] bg-[var(--color-brand-navy)]/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <Button
                className="mt-2 bg-[var(--color-brand-navy)] text-white"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                Войти / Зарегистрироваться
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
