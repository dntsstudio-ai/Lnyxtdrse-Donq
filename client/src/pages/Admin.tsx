import { useFirebaseAuth } from "@/contexts/AuthContext";
import { useAuth } from "@/_core/hooks/useAuth";
import PageLayout from "@/components/PageLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  BarChart3,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  LogIn,
  Search,
  Shield,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { toast } from "sonner";

const ADMIN_TABS = [
  { id: "stats", label: "Статистика", icon: BarChart3 },
  { id: "institutions", label: "Учреждения", icon: Building2 },
  { id: "users", label: "Пользователи", icon: Users },
  { id: "publications", label: "Публикации", icon: FileText },
  { id: "news", label: "Новости", icon: BookOpen },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  editor: "Редактор",
  representative: "Представитель",
  user: "Пользователь",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  editor: "bg-blue-100 text-blue-700",
  representative: "bg-purple-100 text-purple-700",
  user: "bg-gray-100 text-gray-600",
};

export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();
  const { openAuthModal } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState("stats");
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [instPage, setInstPage] = useState(1);
  const [instSearch, setInstSearch] = useState("");
  const [newsPage, setNewsPage] = useState(1);
  const [rejectDialog, setRejectDialog] = useState<{ pubId: number; institutionId: number } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [viewPub, setViewPub] = useState<any | null>(null);
  const utils = trpc.useUtils();

  // Stats
  const { data: stats, isLoading: statsLoading } = trpc.stats.getSiteStats.useQuery(undefined, {
    enabled: isAuthenticated && (user?.role === "admin") && activeTab === "stats",
  });

  // Users
  const { data: usersData, isLoading: usersLoading } = trpc.users.list.useQuery(
    { page: userPage, limit: 15 },
    { enabled: isAuthenticated && user?.role === "admin" && activeTab === "users" }
  );

  // Institutions
  const { data: instsData, isLoading: instsLoading } = trpc.institutions.list.useQuery(
    { page: instPage, limit: 10, search: instSearch || undefined },
    { enabled: isAuthenticated && user?.role === "admin" && activeTab === "institutions" }
  );

  // All published institutions for representative binding dropdown
  const { data: allInstsData } = trpc.institutions.list.useQuery(
    { limit: 200, status: "published" as const },
    { enabled: isAuthenticated && user?.role === "admin" && activeTab === "users" }
  );

  const assignRepresentative = trpc.institutions.assignRepresentative.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); toast.success("Представитель привязан"); },
    onError: () => toast.error("Ошибка привязки"),
  });

  // Publications (moderation)
  const { data: pubsData, isLoading: pubsLoading } = trpc.publications.list.useQuery(
    { status: "pending" },
    { enabled: isAuthenticated && user?.role === "admin" && activeTab === "publications" }
  );

  // News
  const { data: newsData, isLoading: newsLoading } = trpc.news.list.useQuery(
    { page: newsPage, limit: 10 },
    { enabled: isAuthenticated && user?.role === "admin" && activeTab === "news" }
  );

  const updateRole = trpc.users.updateRole.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); toast.success("Роль обновлена"); },
    onError: () => toast.error("Ошибка обновления роли"),
  });

  const blockUser = trpc.users.blockUser.useMutation({
    onSuccess: () => { utils.users.list.invalidate(); toast.success("Статус пользователя изменён"); },
  });

  const approvePublication = trpc.publications.approve.useMutation({
    onSuccess: () => { utils.publications.list.invalidate(); toast.success("Публикация одобрена"); },
  });

  const rejectPublication = trpc.publications.reject.useMutation({
    onSuccess: () => { utils.publications.list.invalidate(); toast.success("Публикация отклонена"); },
  });

  const deleteInstitution = trpc.institutions.delete.useMutation({
    onSuccess: () => { utils.institutions.list.invalidate(); toast.success("Учреждение удалено"); },
    onError: () => toast.error("Ошибка удаления"),
  });

  const deleteNews = trpc.news.delete.useMutation({
    onSuccess: () => { utils.news.list.invalidate(); toast.success("Новость удалена"); },
    onError: () => toast.error("Ошибка удаления"),
  });

  if (loading) {
    return (
      <PageLayout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </PageLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageLayout>
        <div className="container py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-navy)]/8 flex items-center justify-center mx-auto mb-5">
            <LogIn className="w-8 h-8 text-[var(--color-brand-navy)]" />
          </div>
          <h2 className="font-serif text-2xl font-semibold mb-2">Требуется авторизация</h2>
          <Button className="bg-[var(--color-brand-navy)] text-white mt-4" onClick={() => (openAuthModal())}>
            Войти
          </Button>
        </div>
      </PageLayout>
    );
  }

  if (user?.role !== "admin") {
    return (
      <PageLayout>
        <div className="container py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="font-serif text-2xl font-semibold mb-2">Доступ запрещён</h2>
          <p className="text-muted-foreground text-sm">Эта страница доступна только администраторам</p>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>Назад</Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Header */}
      <div className="bg-[var(--color-brand-navy)] text-white py-8">
        <div className="container">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-[var(--color-brand-gold)]" />
            <span className="text-xs font-medium text-[var(--color-brand-gold)] uppercase tracking-wider">Консоль администратора</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold">Управление платформой</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-white sticky top-16 z-30">
        <div className="container">
          <div className="flex overflow-x-auto">
            {ADMIN_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? "border-[var(--color-brand-navy)] text-[var(--color-brand-navy)]"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* ─── Stats ─────────────────────────────────────────────────────────── */}
        {activeTab === "stats" && (
          <div>
            <h2 className="font-serif text-xl font-semibold mb-6">Статистика платформы</h2>
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Учреждений", value: stats.totalInstitutions, icon: Building2, color: "text-[var(--color-brand-navy)]" },
                  { label: "Пользователей", value: stats.totalUsers, icon: Users, color: "text-blue-600" },
                  { label: "Городов", value: stats.totalCities, icon: BookOpen, color: "text-green-600" },
                  { label: "Опубликовано", value: stats.totalPublished, icon: FileText, color: "text-purple-600" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="edu-card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                      <Icon className={`w-4.5 h-4.5 ${color}`} />
                    </div>
                    <p className={`font-serif text-3xl font-bold ${color}`}>{value?.toLocaleString("ru-RU") ?? "—"}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* ─── Institutions ──────────────────────────────────────────────────── */}
        {activeTab === "institutions" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-semibold">Учреждения</h2>
              <a href="/editor/institutions">
                <Button className="bg-[var(--color-brand-navy)] text-white" size="sm">
                  + Добавить
                </Button>
              </a>
            </div>
            <div className="relative mb-4 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию..."
                className="pl-9"
                value={instSearch}
                onChange={(e) => { setInstSearch(e.target.value); setInstPage(1); }}
              />
            </div>
            {instsLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
            ) : (
              <div className="edu-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-brand-warm)] border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Название</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Город</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Тип</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Статус</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {instsData?.items.map((inst: any) => (
                      <tr key={inst.id} className="hover:bg-[var(--color-brand-warm)]/50 transition-colors">
                        <td className="px-4 py-3">
                          <a href={`/institutions/${inst.slug}`} className="font-medium hover:text-[var(--color-brand-navy)] transition-colors">
                            {inst.name}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{inst.city}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{inst.type}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            inst.status === "published" ? "bg-green-100 text-green-700" :
                            inst.status === "draft" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {inst.status === "published" ? "Опубликовано" : inst.status === "draft" ? "Черновик" : inst.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a href={`/editor/institutions/${inst.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs h-7">Редактировать</Button>
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => {
                                if (confirm(`Удалить "${inst.name}"?`)) {
                                  deleteInstitution.mutate({ id: inst.id });
                                }
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {instsData && instsData.total > 10 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-[var(--color-brand-warm)]/50">
                    <span className="text-xs text-muted-foreground">Всего: {instsData.total}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setInstPage((p) => Math.max(1, p - 1))} disabled={instPage === 1}>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <span className="text-xs px-2 py-1">{instPage}</span>
                      <Button variant="outline" size="sm" onClick={() => setInstPage((p) => p + 1)} disabled={instPage * 10 >= instsData.total}>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── Users ─────────────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div>
            <h2 className="font-serif text-xl font-semibold mb-5">Управление пользователями</h2>
            <div className="relative mb-4 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени или email..."
                className="pl-9"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            {usersLoading ? (
              <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : (
              <div className="edu-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-brand-warm)] border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Пользователь</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Роль</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {usersData?.items
                      .filter((u: any) =>
                        !userSearch ||
                        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.email?.toLowerCase().includes(userSearch.toLowerCase())
                      )
                      .map((u: any) => (
                        <tr key={u.id} className="hover:bg-[var(--color-brand-warm)]/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar className="w-7 h-7">
                                <AvatarFallback className="text-xs bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)]">
                                  {u.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) ?? "?"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{u.name ?? "—"}</span>
                              {u.isBlocked && <span className="text-xs text-red-500 font-medium">(заблокирован)</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{u.email ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                              {ROLE_LABELS[u.role] ?? u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {u.id !== user?.id && (
                                <>
                                  <Select
                                    value={u.role}
                                    onValueChange={(role) => updateRole.mutate({ userId: u.id, role: role as any })}
                                  >
                                    <SelectTrigger className="h-7 text-xs w-36">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="user">Пользователь</SelectItem>
                                      <SelectItem value="editor">Редактор</SelectItem>
                                      <SelectItem value="representative">Представитель</SelectItem>
                                      <SelectItem value="admin">Администратор</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {u.role === "representative" && (
                                    <Select
                                      onValueChange={(instId) =>
                                        assignRepresentative.mutate({ userId: u.id, institutionId: parseInt(instId) })
                                      }
                                    >
                                      <SelectTrigger className="h-7 text-xs w-44">
                                        <SelectValue placeholder="Учреждение..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {allInstsData?.items.map((inst: any) => (
                                          <SelectItem key={inst.id} value={String(inst.id)}>
                                            {inst.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`text-xs h-7 ${u.isBlocked ? "text-green-600 hover:bg-green-50" : "text-red-500 hover:bg-red-50"}`}
                                    onClick={() => blockUser.mutate({ userId: u.id, isBlocked: !u.isBlocked })}
                                  >
                                    {u.isBlocked ? "Разблокировать" : "Заблокировать"}
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {usersData && usersData.total > 15 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-[var(--color-brand-warm)]/50">
                    <span className="text-xs text-muted-foreground">Всего: {usersData.total}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setUserPage((p) => Math.max(1, p - 1))} disabled={userPage === 1}>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <span className="text-xs px-2 py-1">{userPage}</span>
                      <Button variant="outline" size="sm" onClick={() => setUserPage((p) => p + 1)} disabled={userPage * 15 >= usersData.total}>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── Publications (Moderation) ─────────────────────────────────────── */}
        {activeTab === "publications" && (
          <div>
            <h2 className="font-serif text-xl font-semibold mb-5">Модерация публикаций</h2>
            {pubsLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : pubsData && pubsData.length > 0 ? (
              <div className="space-y-4">
                {pubsData.map((pub: any) => (
                  <div key={pub.id} className="edu-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{pub.institution?.name ?? "Учреждение"}</span>
                          <Badge variant="outline" className="text-xs">
                            {pub.type === "new" ? "Новое" : pub.type === "edit" ? "Правка" : pub.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Редактор: {pub.editor?.name ?? "—"} · {new Date(pub.createdAt).toLocaleDateString("ru-RU")}
                        </p>
                        {pub.notes && <p className="text-sm text-muted-foreground">{pub.notes}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => setViewPub(pub)}
                        >
                          Просмотреть
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white h-8"
                          onClick={() => approvePublication.mutate({ id: pub.id, institutionId: pub.institutionId })}
                          disabled={approvePublication.isPending}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          Одобрить
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 h-8"
                          onClick={() => {
                            setRejectReason("");
                            setRejectDialog({ pubId: pub.id, institutionId: pub.institutionId });
                          }}
                          disabled={rejectPublication.isPending}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1.5" />
                          Отклонить
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-border rounded-2xl">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-400/50" />
                <h3 className="font-serif text-lg font-semibold mb-1">Нет ожидающих публикаций</h3>
                <p className="text-sm text-muted-foreground">Все материалы проверены</p>
              </div>
            )}
          </div>
        )}

        {/* ─── News ──────────────────────────────────────────────────────────── */}
        {activeTab === "news" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-semibold">Управление новостями</h2>
              <a href="/editor/news">
                <Button className="bg-[var(--color-brand-navy)] text-white" size="sm">
                  + Новая статья
                </Button>
              </a>
            </div>
            {newsLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
            ) : (
              <div className="edu-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-brand-warm)] border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Заголовок</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Дата</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Статус</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {newsData?.items.map((article: any) => (
                      <tr key={article.id} className="hover:bg-[var(--color-brand-warm)]/50 transition-colors">
                        <td className="px-4 py-3">
                          <a href={`/news/${article.slug}`} className="font-medium hover:text-[var(--color-brand-navy)] transition-colors line-clamp-1">
                            {article.title}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                          {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("ru-RU") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            article.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {article.status === "published" ? "Опубликовано" : "Черновик"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a href={`/editor/news/${article.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs h-7">Редактировать</Button>
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => {
                                if (confirm(`Удалить "${article.title}"?`)) {
                                  deleteNews.mutate({ id: article.id });
                                }
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {newsData && newsData.total > 10 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-[var(--color-brand-warm)]/50">
                    <span className="text-xs text-muted-foreground">Всего: {newsData.total}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setNewsPage((p) => Math.max(1, p - 1))} disabled={newsPage === 1}>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <span className="text-xs px-2 py-1">{newsPage}</span>
                      <Button variant="outline" size="sm" onClick={() => setNewsPage((p) => p + 1)} disabled={newsPage * 10 >= newsData.total}>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Диалог просмотра заявки */}
      <Dialog open={!!viewPub} onOpenChange={(v) => { if (!v) setViewPub(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Заявка на публикацию #{viewPub?.id}</DialogTitle>
            <DialogDescription>
              Редактор: {viewPub?.editor?.name ?? "—"} · {viewPub?.createdAt ? new Date(viewPub.createdAt).toLocaleDateString("ru-RU") : ""}
            </DialogDescription>
          </DialogHeader>
          {viewPub?.institution && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground mb-0.5">Название</p><p className="font-medium">{viewPub.institution.name}</p></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">Тип</p><p>{viewPub.institution.type}</p></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">Город</p><p>{viewPub.institution.city}</p></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">Статус</p><p>{viewPub.institution.status}</p></div>
              </div>
              {viewPub.institution.shortDescription && (
                <div><p className="text-xs text-muted-foreground mb-0.5">Краткое описание</p><p>{viewPub.institution.shortDescription}</p></div>
              )}
              {viewPub.institution.address && (
                <div><p className="text-xs text-muted-foreground mb-0.5">Адрес</p><p>{viewPub.institution.address}</p></div>
              )}
              {viewPub.institution.phone && (
                <div><p className="text-xs text-muted-foreground mb-0.5">Телефон</p><p>{viewPub.institution.phone}</p></div>
              )}
              {viewPub.institution.website && (
                <div><p className="text-xs text-muted-foreground mb-0.5">Сайт</p>
                  <a href={viewPub.institution.website} target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand-navy)] hover:underline">{viewPub.institution.website}</a>
                </div>
              )}
              <div className="pt-2">
                <a href={`/institution/${viewPub.institution.slug}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">Открыть страницу учреждения ↗</Button>
                </a>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setViewPub(null)}>Закрыть</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                approvePublication.mutate({ id: viewPub.id, institutionId: viewPub.institutionId });
                setViewPub(null);
              }}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Одобрить
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-600"
              onClick={() => {
                setViewPub(null);
                setRejectReason("");
                setRejectDialog({ pubId: viewPub.id, institutionId: viewPub.institutionId });
              }}
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Отклонить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог отказа с причиной */}
      <Dialog
        open={!!rejectDialog}
        onOpenChange={(open) => { if (!open) setRejectDialog(null); }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Отклонить заявку</DialogTitle>
            <DialogDescription>
              Укажите причину отказа — редактор увидит её в своих уведомлениях.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Например: не заполнены обязательные поля, некорректное описание..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setRejectDialog(null)}
            >
              Отмена
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!rejectReason.trim() || rejectPublication.isPending}
              onClick={() => {
                if (!rejectDialog) return;
                rejectPublication.mutate({
                  id: rejectDialog.pubId,
                  institutionId: rejectDialog.institutionId,
                  reason: rejectReason.trim(),
                });
                setRejectDialog(null);
              }}
            >
              {rejectPublication.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <XCircle className="w-4 h-4 mr-1.5" />
              )}
              Отклонить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
