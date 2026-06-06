import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import InstitutionCard from "@/components/InstitutionCard";
import PageLayout from "@/components/PageLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Loader2,
  LogIn,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";

const TABS = [
  { id: "profile", label: "Профиль", icon: User },
  { id: "bookmarks", label: "Сохранённые", icon: BookOpen },
  { id: "recommendations", label: "Рекомендации", icon: Sparkles },
  { id: "notifications", label: "Уведомления", icon: Bell },
];

const EDUCATION_TYPES = [
  { value: "university", label: "Университет" },
  { value: "college", label: "Колледж" },
  { value: "institute", label: "Институт" },
  { value: "academy", label: "Академия" },
  { value: "school", label: "Школа" },
];

const STUDY_FORMATS = [
  { value: "full_time", label: "Очно" },
  { value: "part_time", label: "Заочно" },
  { value: "evening", label: "Вечернее" },
  { value: "online", label: "Онлайн" },
];

const CITIES = [
  "Ростов-на-Дону", "Таганрог", "Новочеркасск", "Шахты", "Волгодонск",
  "Батайск", "Новошахтинск", "Каменск-Шахтинский", "Аксай", "Азов",
];

export default function Profile() {
  const { tab } = useParams<{ tab?: string }>();
  const activeTab = tab ?? "profile";
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();

  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Questionnaire state
  const [preferredTypes, setPreferredTypes] = useState<string[]>([]);
  const [preferredCities, setPreferredCities] = useState<string[]>([]);
  const [studyFormats, setStudyFormats] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [interests, setInterests] = useState("");
  const [goals, setGoals] = useState("");
  const [questionnaireSaved, setQuestionnaireSaved] = useState(false);

  const { data: profileData, isLoading: profileLoading } = trpc.users.me.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: prefsData } = trpc.recommendations.getPreferences.useQuery(undefined, {
    enabled: isAuthenticated,
    onSuccess: (data: any) => {
      if (data) {
        setPreferredTypes(data.preferredTypes ?? []);
        setPreferredCities(data.preferredCities ?? []);
        setStudyFormats(data.studyFormats ?? []);
        setBudget(data.budget ?? "");
        setInterests(data.additionalInfo ?? "");
        setGoals("");
      }
    },
  } as any);

  const { data: bookmarksData, isLoading: bookmarksLoading } = trpc.bookmarks.list.useQuery(undefined, {
    enabled: isAuthenticated && activeTab === "bookmarks",
  });

  const { data: notificationsData, isLoading: notifLoading } = trpc.notifications.list.useQuery(
    undefined,
    { enabled: isAuthenticated && activeTab === "notifications" }
  );

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  const updateProfile = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      setIsEditingProfile(false);
      utils.users.me.invalidate();
      toast.success("Профиль обновлён");
    },
  });

  const saveQuestionnaire = trpc.recommendations.savePreferences.useMutation({
    onSuccess: () => {
      setQuestionnaireSaved(true);
      toast.success("Анкета сохранена");
      setTimeout(() => setQuestionnaireSaved(false), 3000);
    },
  });

  const getRecommendations = trpc.recommendations.generate.useMutation({
    onMutate: () => { setRecLoading(true); setRecError(null); },
    onSuccess: (data: any) => { setRecommendations(data.recommendations ?? []); setRecLoading(false); },
    onError: (err: any) => { setRecError(err.message); setRecLoading(false); },
  });

  const markNotifRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  });

  const removeBookmark = trpc.bookmarks.toggle.useMutation({
    onSuccess: () => utils.bookmarks.list.invalidate(),
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
          <h2 className="font-serif text-2xl font-semibold mb-2">Войдите в аккаунт</h2>
          <p className="text-muted-foreground text-sm mb-6">Для доступа к профилю необходима авторизация</p>
          <Button
            className="bg-[var(--color-brand-navy)] text-white"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Войти
          </Button>
        </div>
      </PageLayout>
    );
  }

  const toggleMulti = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const roleLabel: Record<string, string> = {
    admin: "Администратор",
    editor: "Редактор",
    representative: "Представитель",
    user: "Пользователь",
  };

  return (
    <PageLayout>
      {/* Header */}
      <div className="bg-[var(--color-brand-navy)] text-white py-10">
        <div className="container">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-[var(--color-brand-gold)]/40">
              <AvatarImage src={user?.avatar ?? undefined} />
              <AvatarFallback className="text-xl bg-[var(--color-brand-gold)]/20 text-[var(--color-brand-gold)]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-serif text-2xl font-semibold">{user?.name ?? "Пользователь"}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="border-white/20 text-white/70 text-xs">
                  {roleLabel[user?.role ?? "user"]}
                </Badge>
                {user?.email && <span className="text-white/50 text-sm">{user.email}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-white sticky top-16 z-30">
        <div className="container">
          <div className="flex overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <a
                key={id}
                href={id === "profile" ? "/profile" : `/profile/${id}`}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === id
                    ? "border-[var(--color-brand-navy)] text-[var(--color-brand-navy)]"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* ─── Profile Tab ─────────────────────────────────────────────────── */}
        {activeTab === "profile" && (
          <div className="max-w-xl">
            <div className="edu-card p-6 mb-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif text-lg font-semibold">Личные данные</h2>
                {!isEditingProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditName(user?.name ?? "");
                      setEditBio(profileData?.bio ?? "");
                      setIsEditingProfile(true);
                    }}
                  >
                    Редактировать
                  </Button>
                )}
              </div>

              {isEditingProfile ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Имя</label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">О себе</label>
                    <Textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={3}
                      placeholder="Расскажите о себе..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-[var(--color-brand-navy)] text-white"
                      disabled={updateProfile.isPending}
                      onClick={() => updateProfile.mutate({ name: editName })}
                    >
                      {updateProfile.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                      Сохранить
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingProfile(false)}>
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Имя</p>
                    <p className="text-sm font-medium">{user?.name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                    <p className="text-sm">{user?.email ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Роль</p>
                    <p className="text-sm">{roleLabel[user?.role ?? "user"]}</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Дата регистрации</p>
                    <p className="text-sm">{profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString("ru-RU") : "—"}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Questionnaire */}
            <div className="edu-card p-6">
              <div className="flex items-center gap-2 mb-1.5">
                <GraduationCap className="w-4.5 h-4.5 text-[var(--color-brand-gold)]" />
                <h2 className="font-serif text-lg font-semibold">Анкета предпочтений</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Заполните анкету — ИИ подберёт учреждения именно для вас
              </p>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                    Тип учреждения
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EDUCATION_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => toggleMulti(preferredTypes, setPreferredTypes, t.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          preferredTypes.includes(t.value)
                            ? "bg-[var(--color-brand-navy)] text-white border-[var(--color-brand-navy)]"
                            : "bg-white text-muted-foreground border-border hover:border-[var(--color-brand-navy)]/30"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                    Предпочтительный город
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CITIES.slice(0, 6).map((city) => (
                      <button
                        key={city}
                        onClick={() => toggleMulti(preferredCities, setPreferredCities, city)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          preferredCities.includes(city)
                            ? "bg-[var(--color-brand-navy)] text-white border-[var(--color-brand-navy)]"
                            : "bg-white text-muted-foreground border-border hover:border-[var(--color-brand-navy)]/30"
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                    Формат обучения
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STUDY_FORMATS.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => toggleMulti(studyFormats, setStudyFormats, f.value)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          studyFormats.includes(f.value)
                            ? "bg-[var(--color-brand-navy)] text-white border-[var(--color-brand-navy)]"
                            : "bg-white text-muted-foreground border-border hover:border-[var(--color-brand-navy)]/30"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                    Интересующие специальности / направления
                  </label>
                  <Textarea
                    placeholder="Например: программирование, медицина, экономика, дизайн..."
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                    Ваши цели
                  </label>
                  <Textarea
                    placeholder="Что вы хотите получить от обучения? Карьера, саморазвитие, смена профессии..."
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <Button
                  className="bg-[var(--color-brand-navy)] text-white w-full"
                  disabled={saveQuestionnaire.isPending}
                  onClick={() =>
                    saveQuestionnaire.mutate({
                      preferredTypes,
                      preferredCities,
                      additionalInfo: interests + (goals ? " Цели: " + goals : ""),
                    })
                  }
                >
                  {saveQuestionnaire.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : questionnaireSaved ? (
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />
                  ) : (
                    <GraduationCap className="w-4 h-4 mr-2" />
                  )}
                  {questionnaireSaved ? "Анкета сохранена!" : "Сохранить анкету"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Bookmarks Tab ───────────────────────────────────────────────── */}
        {activeTab === "bookmarks" && (
          <div>
            <h2 className="font-serif text-xl font-semibold mb-5">Сохранённые учреждения</h2>
            {bookmarksLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
              </div>
            ) : bookmarksData && bookmarksData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {bookmarksData.map((inst: any) => (
                  <div key={inst.id} className="relative">
                    <button
                      onClick={() => removeBookmark.mutate({ institutionId: inst.id })}
                      className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-white/90 border border-border flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <InstitutionCard {...inst} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">Нет сохранённых учреждений</p>
                <a href="/catalog">
                  <Button variant="outline" className="mt-4">Перейти в каталог</Button>
                </a>
              </div>
            )}
          </div>
        )}

        {/* ─── Recommendations Tab ─────────────────────────────────────────── */}
        {activeTab === "recommendations" && (
          <div className="max-w-3xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-serif text-xl font-semibold mb-1">Персональные рекомендации</h2>
                <p className="text-sm text-muted-foreground">
                  На основе вашей анкеты ИИ подберёт подходящие учреждения с объяснением
                </p>
              </div>
              <Button
                className="bg-[var(--color-brand-navy)] text-white shrink-0"
                onClick={() => getRecommendations.mutate()}
                disabled={recLoading}
              >
                {recLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Анализирую...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />Получить рекомендации</>
                )}
              </Button>
            </div>

            {recError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm mb-5">
                {recError}
              </div>
            )}

            {recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((rec: any, i: number) => (
                  <div key={rec.id ?? i} className="edu-card p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-brand-gold)]/15 flex items-center justify-center shrink-0 font-bold text-[var(--color-brand-gold)] text-sm">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <a href={`/institutions/${rec.slug}`} className="font-serif font-semibold text-base hover:text-[var(--color-brand-navy)] transition-colors">
                            {rec.name}
                          </a>
                          {rec.matchScore && (
                            <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--color-brand-gold)]/15 text-[var(--color-brand-gold)]">
                              {rec.matchScore}% совпадение
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{rec.explanation}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{rec.city}</span>
                          <span>·</span>
                          <span>{rec.type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !recLoading && (
              <div className="text-center py-16 border border-dashed border-border rounded-2xl">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <h3 className="font-serif text-lg font-semibold mb-1">Рекомендации не получены</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Заполните анкету предпочтений в разделе «Профиль», затем нажмите кнопку выше
                </p>
                <a href="/profile">
                  <Button variant="outline" size="sm">Заполнить анкету</Button>
                </a>
              </div>
            )}
          </div>
        )}

        {/* ─── Notifications Tab ───────────────────────────────────────────── */}
        {activeTab === "notifications" && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-semibold">Уведомления</h2>
              {notificationsData && Array.isArray(notificationsData) && notificationsData.some((n: any) => !n.isRead) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                >
                  Прочитать все
                </Button>
              )}
            </div>

            {notifLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : Array.isArray(notificationsData) && notificationsData.length ? (
              <div className="space-y-2">
                {notificationsData.map((notif: any) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      notif.isRead
                        ? "border-border bg-white"
                        : "border-[var(--color-brand-navy)]/20 bg-[var(--color-brand-navy)]/4"
                    }`}
                    onClick={() => !notif.isRead && markNotifRead.mutate({ id: notif.id })}
                  >
                    <div className="flex items-start gap-3">
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-[var(--color-brand-gold)] mt-1.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {new Date(notif.createdAt).toLocaleDateString("ru-RU", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">Нет уведомлений</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
