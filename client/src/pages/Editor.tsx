import { useFirebaseAuth } from "@/contexts/AuthContext";
import { useAuth } from "@/_core/hooks/useAuth";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  Building2,
  CheckCircle2,
  Edit3,
  FileText,
  Loader2,
  LogIn,
  PenLine,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useParams } from "wouter";
import { toast } from "sonner";

const EDITOR_TABS = [
  { id: "institutions", label: "Учреждения", icon: Building2 },
  { id: "news", label: "Новости", icon: BookOpen },
];

const INSTITUTION_TYPES = ["university", "college", "institute", "academy", "school", "other"];
const TYPE_LABELS: Record<string, string> = {
  university: "Университет", college: "Колледж", institute: "Институт",
  academy: "Академия", school: "Школа", other: "Другое",
};

export default function Editor() {
  const { user, isAuthenticated, loading } = useAuth();
  const { openAuthModal } = useFirebaseAuth();
  const params = useParams<{ section?: string; id?: string }>();
  const [activeTab, setActiveTab] = useState(() => {
    if (params.section === "news") return "news";
    if (params.section === "institutions") return "institutions";
    return "institutions";
  });
  const utils = trpc.useUtils();

  // Institution form state
  const [instForm, setInstForm] = useState({
    name: "", type: "university", city: "", address: "", phone: "", email: "",
    website: "", shortDescription: "", description: "", foundedYear: "",
    tuitionMin: "", tuitionMax: "", isFree: false, slug: "",
  });
  const [instSaved, setInstSaved] = useState(false);

  // News form state
  const [newsForm, setNewsForm] = useState({
    title: "", slug: "", excerpt: "", content: "", status: "draft" as "draft" | "published",
  });
  const [newsSaved, setNewsSaved] = useState(false);

  // Lists
  const { data: myInsts, isLoading: instsLoading } = trpc.institutions.list.useQuery(
    { page: 1, limit: 20 },
    { enabled: isAuthenticated && (user?.role === "editor" || user?.role === "admin") && activeTab === "institutions" }
  );

  const { data: myNews, isLoading: newsLoading } = trpc.news.list.useQuery(
    { page: 1, limit: 20 },
    { enabled: isAuthenticated && (user?.role === "editor" || user?.role === "admin") && activeTab === "news" }
  );

  const submitForReview = trpc.institutions.submitForReview.useMutation({
    onSuccess: () => {
      utils.institutions.list.invalidate();
      toast.success("Заявка на публикацию отправлена администратору");
    },
    onError: (err) => toast.error(err.message),
  });

  const createInstitution = trpc.institutions.create.useMutation({
    onSuccess: () => {
      setInstSaved(true);
      utils.institutions.list.invalidate();
      toast.success("Учреждение создано и отправлено на проверку администратору");
      setInstForm({ name: "", type: "university", city: "", address: "", phone: "", email: "", website: "", shortDescription: "", description: "", foundedYear: "", tuitionMin: "", tuitionMax: "", isFree: false, slug: "" });
      setTimeout(() => setInstSaved(false), 3000);
    },
    onError: (err) => toast.error(err.message),
  });

  const createNews = trpc.news.create.useMutation({
    onSuccess: () => {
      setNewsSaved(true);
      utils.news.list.invalidate();
      toast.success("Статья создана");
      setNewsForm({ title: "", slug: "", excerpt: "", content: "", status: "draft" });
      setTimeout(() => setNewsSaved(false), 3000);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteInst = trpc.institutions.delete.useMutation({
    onSuccess: () => { utils.institutions.list.invalidate(); toast.success("Учреждение удалено"); },
  });

  const deleteNews = trpc.news.delete.useMutation({
    onSuccess: () => { utils.news.list.invalidate(); toast.success("Новость удалена"); },
  });

  // Auto-generate slug from name
  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[а-яёa-z0-9]+/gi, (m) => m).replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 64);

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

  if (user?.role !== "editor" && user?.role !== "admin") {
    return (
      <PageLayout>
        <div className="container py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="font-serif text-2xl font-semibold mb-2">Доступ запрещён</h2>
          <p className="text-muted-foreground text-sm">Эта страница доступна только редакторам и администраторам</p>
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
            <PenLine className="w-4 h-4 text-[var(--color-brand-gold)]" />
            <span className="text-xs font-medium text-[var(--color-brand-gold)] uppercase tracking-wider">Панель редактора</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold">Управление контентом</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-white sticky top-16 z-30">
        <div className="container">
          <div className="flex">
            {EDITOR_TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
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
        {/* ─── Institutions ──────────────────────────────────────────────────── */}
        {activeTab === "institutions" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Plus className="w-4.5 h-4.5 text-[var(--color-brand-gold)]" />
                <h2 className="font-serif text-lg font-semibold">Добавить учреждение</h2>
              </div>
              <div className="edu-card p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                    Название <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={instForm.name}
                    onChange={(e) => setInstForm({ ...instForm, name: e.target.value, slug: generateSlug(e.target.value) })}
                    placeholder="Ростовский государственный университет"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Тип</label>
                    <Select value={instForm.type} onValueChange={(v) => setInstForm({ ...instForm, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INSTITUTION_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                      Город <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={instForm.city}
                      onChange={(e) => setInstForm({ ...instForm, city: e.target.value })}
                      placeholder="Ростов-на-Дону"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Адрес</label>
                  <Input
                    value={instForm.address}
                    onChange={(e) => setInstForm({ ...instForm, address: e.target.value })}
                    placeholder="ул. Пушкинская, 1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Телефон</label>
                    <Input value={instForm.phone} onChange={(e) => setInstForm({ ...instForm, phone: e.target.value })} placeholder="+7 (863) 000-00-00" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Email</label>
                    <Input type="email" value={instForm.email} onChange={(e) => setInstForm({ ...instForm, email: e.target.value })} placeholder="info@university.ru" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Сайт</label>
                  <Input value={instForm.website} onChange={(e) => setInstForm({ ...instForm, website: e.target.value })} placeholder="https://university.ru" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Краткое описание</label>
                  <Textarea
                    value={instForm.shortDescription}
                    onChange={(e) => setInstForm({ ...instForm, shortDescription: e.target.value })}
                    placeholder="2-3 предложения об учреждении..."
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Полное описание</label>
                  <Textarea
                    value={instForm.description}
                    onChange={(e) => setInstForm({ ...instForm, description: e.target.value })}
                    placeholder="Подробное описание учреждения, история, достижения..."
                    rows={4}
                    className="resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Год основания</label>
                    <Input type="number" value={instForm.foundedYear} onChange={(e) => setInstForm({ ...instForm, foundedYear: e.target.value })} placeholder="1915" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">URL-slug</label>
                    <Input value={instForm.slug} onChange={(e) => setInstForm({ ...instForm, slug: e.target.value })} placeholder="rostov-university" />
                  </div>
                </div>
                <Button
                  className="w-full bg-[var(--color-brand-navy)] text-white"
                  disabled={createInstitution.isPending || !instForm.name || !instForm.city}
                  onClick={() =>
                    createInstitution.mutate({
                      name: instForm.name,
                      type: instForm.type as any,
                      city: instForm.city,
                      address: instForm.address || undefined,
                      phone: instForm.phone || undefined,
                      email: instForm.email || undefined,
                      website: instForm.website || undefined,
                      shortDescription: instForm.shortDescription || undefined,
                      description: instForm.description || undefined,
                      foundedYear: instForm.foundedYear ? parseInt(instForm.foundedYear) : undefined,
                      slug: instForm.slug || generateSlug(instForm.name) || instForm.name.slice(0, 64),
                    })
                  }
                >
                  {createInstitution.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Сохранение...</>
                  ) : instSaved ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />Сохранено!</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" />Создать учреждение</>
                  )}
                </Button>
              </div>
            </div>

            {/* List */}
            <div>
              <h2 className="font-serif text-lg font-semibold mb-5">Мои учреждения</h2>
              {instsLoading ? (
                <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
              ) : myInsts?.items.length ? (
                <div className="space-y-2">
                  {myInsts.items.map((inst: any) => (
                    <div key={inst.id} className="edu-card p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{inst.name}</p>
                        <p className="text-xs text-muted-foreground">{inst.city} · {TYPE_LABELS[inst.type] ?? inst.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          inst.status === "published" ? "bg-green-100 text-green-700" :
                          inst.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                          inst.status === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {inst.status === "published" ? "Опубл." :
                           inst.status === "pending" ? "На проверке" :
                           inst.status === "rejected" ? "Отклонено" : "Черновик"}
                        </span>
                        {(inst.status === "draft" || inst.status === "rejected") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-blue-600 hover:bg-blue-50 px-2"
                            disabled={submitForReview.isPending}
                            onClick={() => submitForReview.mutate({ id: inst.id })}
                          >
                            Отправить
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => { if (confirm("Удалить?")) deleteInst.mutate({ id: inst.id }); }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-border rounded-xl">
                  <Building2 className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Нет учреждений</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── News ──────────────────────────────────────────────────────────── */}
        {activeTab === "news" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Plus className="w-4.5 h-4.5 text-[var(--color-brand-gold)]" />
                <h2 className="font-serif text-lg font-semibold">Новая статья</h2>
              </div>
              <div className="edu-card p-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                    Заголовок <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={newsForm.title}
                    onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value, slug: generateSlug(e.target.value) })}
                    placeholder="Новости образования..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">URL-slug</label>
                  <Input value={newsForm.slug} onChange={(e) => setNewsForm({ ...newsForm, slug: e.target.value })} placeholder="novosti-obrazovaniya" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Краткое описание</label>
                  <Textarea
                    value={newsForm.excerpt}
                    onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })}
                    placeholder="Краткое описание статьи..."
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                    Текст статьи <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    value={newsForm.content}
                    onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                    placeholder="Полный текст статьи..."
                    rows={8}
                    className="resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Статус</label>
                  <Select value={newsForm.status} onValueChange={(v) => setNewsForm({ ...newsForm, status: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Черновик</SelectItem>
                      <SelectItem value="published">Опубликовать сразу</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full bg-[var(--color-brand-navy)] text-white"
                  disabled={createNews.isPending || !newsForm.title || !newsForm.content}
                  onClick={() =>
                    createNews.mutate({
                      title: newsForm.title,
                      slug: newsForm.slug || generateSlug(newsForm.title) || newsForm.title.slice(0, 64),
                      excerpt: newsForm.excerpt || undefined,
                      content: newsForm.content,
                      status: newsForm.status,
                    })
                  }
                >
                  {createNews.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Сохранение...</>
                  ) : newsSaved ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />Сохранено!</>
                  ) : (
                    <><FileText className="w-4 h-4 mr-2" />Создать статью</>
                  )}
                </Button>
              </div>
            </div>

            {/* List */}
            <div>
              <h2 className="font-serif text-lg font-semibold mb-5">Мои статьи</h2>
              {newsLoading ? (
                <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
              ) : myNews?.items.length ? (
                <div className="space-y-2">
                  {myNews.items.map((article: any) => (
                    <div key={article.id} className="edu-card p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm line-clamp-1">{article.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("ru-RU") : "Черновик"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          article.status === "published" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {article.status === "published" ? "Опубл." : "Черновик"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => { if (confirm("Удалить?")) deleteNews.mutate({ id: article.id }); }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-border rounded-xl">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Нет статей</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
