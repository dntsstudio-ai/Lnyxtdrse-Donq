import { useFirebaseAuth } from "@/contexts/AuthContext";
import { useAuth } from "@/_core/hooks/useAuth";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  Building2,
  CheckCircle2,
  FileUp,
  Loader2,
  LogIn,
  MessageSquare,
  Shield,
  Star,
  Upload,
  Trash2,
} from "lucide-react";
import { useRef, useState } from "react";

import { toast } from "sonner";

const REP_TABS = [
  { id: "profile", label: "Профиль учреждения", icon: Building2 },
  { id: "reviews", label: "Отзывы", icon: Star },
  { id: "documents", label: "Документы", icon: FileUp },
];

export default function Representative() {
  const { user, isAuthenticated, loading } = useAuth();
  const { openAuthModal } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const utils = trpc.useUtils();

  const { data: myInstData, isLoading: instLoading } = trpc.institutions.list.useQuery(
    { page: 1, limit: 1, representativeId: user?.id },
    { enabled: isAuthenticated && (user?.role === "representative" || user?.role === "admin") && !!user?.id }
  );
  const myInst = myInstData?.items?.[0] ?? null;

  const { data: reviews, isLoading: reviewsLoading } = trpc.reviews.list.useQuery(
    { institutionId: myInst?.id ?? 0 },
    { enabled: !!myInst?.id && activeTab === "reviews" }
  );

  const { data: instWithDocs, isLoading: docsLoading } = trpc.institutions.getByIdEditor.useQuery(
    { id: myInst?.id ?? 0 },
    { enabled: !!myInst?.id && activeTab === "documents" }
  );
  const docs = instWithDocs?.documents ?? [];

  const [form, setForm] = useState({
    shortDescription: myInst?.shortDescription ?? "",
    description: myInst?.description ?? "",
    phone: myInst?.phone ?? "",
    email: myInst?.email ?? "",
    website: myInst?.website ?? "",
    address: myInst?.address ?? "",
  });

  const updateInst = trpc.institutions.update.useMutation({
    onSuccess: () => {
      setSaved(true);
      utils.institutions.list.invalidate();
      toast.success("Профиль обновлён");
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err) => toast.error(err.message),
  });

  const replyReview = trpc.reviews.addReply.useMutation({
    onSuccess: () => {
      utils.reviews.list.invalidate();
      setReplyText({});
      toast.success("Ответ добавлен");
    },
  });

  const deleteDoc = trpc.institutions.deleteDocument.useMutation({
    onSuccess: () => {
      utils.institutions.getByIdEditor.invalidate({ id: myInst?.id ?? 0 });
      toast.success("Документ удалён");
    },
    onError: (err) => toast.error(err.message),
  });

  const getUploadUrl = trpc.uploads.getUploadUrl.useMutation();
  const addDoc = trpc.institutions.addDocument.useMutation({
    onSuccess: () => {
      utils.institutions.getByIdEditor.invalidate({ id: myInst?.id ?? 0 });
      toast.success("Документ добавлен");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !myInst) return;
    setUploading(true);
    try {
      const { uploadPath } = await getUploadUrl.mutateAsync({
        fileName: file.name,
        contentType: file.type,
        folder: "documents",
      });
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(uploadPath, { method: "POST", body: formData });
      const uploadedUrl = await response.text();
      
      const docType = file.name.split(".").pop()?.toLowerCase() || "other";
      const typeMap: Record<string, any> = {
        pdf: "brochure",
        doc: "certificate",
        docx: "certificate",
        jpg: "other",
        jpeg: "other",
        png: "other",
      };
      
      await addDoc.mutateAsync({
        institutionId: myInst.id,
        type: typeMap[docType] || "other",
        url: uploadedUrl,
        fileKey: file.name,
        name: file.name,
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      toast.error("Ошибка загрузки файла");
    } finally {
      setUploading(false);
    }
  };

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

  if (user?.role !== "representative" && user?.role !== "admin") {
    return (
      <PageLayout>
        <div className="container py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="font-serif text-2xl font-semibold mb-2">Доступ запрещён</h2>
          <p className="text-muted-foreground text-sm">Эта страница доступна только представителям учреждений</p>
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
            <Building2 className="w-4 h-4 text-[var(--color-brand-gold)]" />
            <span className="text-xs font-medium text-[var(--color-brand-gold)] uppercase tracking-wider">Портал представителя</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold">
            {instLoading ? "Загрузка..." : myInst?.name ?? "Учреждение не привязано"}
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-white sticky top-16 z-30">
        <div className="container">
          <div className="flex">
            {REP_TABS.map(({ id, label, icon: Icon }) => (
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
        {!myInst && !instLoading && (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <h3 className="font-serif text-lg font-semibold mb-1">Учреждение не привязано</h3>
            <p className="text-sm text-muted-foreground">
              Обратитесь к администратору для привязки учреждения к вашему аккаунту
            </p>
          </div>
        )}

        {/* ─── Profile Tab ─────────────────────────────────────────────────── */}
        {activeTab === "profile" && myInst && (
          <div className="max-w-xl">
            <h2 className="font-serif text-xl font-semibold mb-5">Редактирование профиля</h2>
            <div className="edu-card p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Краткое описание</label>
                <Textarea
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  placeholder="2-3 предложения об учреждении..."
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Полное описание</label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Подробное описание учреждения..."
                  rows={5}
                  className="resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Телефон</label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+7 (863) 000-00-00" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Email</label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="info@university.ru" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Сайт</label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://university.ru" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Адрес</label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="ул. Пушкинская, 1" />
              </div>
              <Button
                className="w-full bg-[var(--color-brand-navy)] text-white"
                disabled={updateInst.isPending}
                onClick={() =>
                  updateInst.mutate({
                    id: myInst.id,
                    shortDescription: form.shortDescription || undefined,
                    description: form.description || undefined,
                    phone: form.phone || undefined,
                    email: form.email || undefined,
                    website: form.website || undefined,
                    address: form.address || undefined,
                  })
                }
              >
                {updateInst.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Сохранение...</>
                ) : saved ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />Сохранено!</>
                ) : (
                  "Сохранить изменения"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ─── Reviews Tab ─────────────────────────────────────────────────── */}
        {activeTab === "reviews" && myInst && (
          <div className="max-w-2xl">
            <h2 className="font-serif text-xl font-semibold mb-5">Отзывы об учреждении</h2>
            {reviewsLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <div key={review.id} className="edu-card p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{review.user?.name ?? "Аноним"}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-[var(--color-brand-gold)] text-[var(--color-brand-gold)]" : "text-muted-foreground/30"}`} />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("ru-RU")}
                      </span>
                    </div>
                    {review.text && <p className="text-sm text-muted-foreground mb-3">{review.text}</p>}

                    {review.representativeReply ? (
                      <div className="bg-[var(--color-brand-navy)]/5 rounded-lg p-3">
                        <p className="text-xs font-medium text-[var(--color-brand-navy)] mb-1">Ответ представителя:</p>
                        <p className="text-sm text-muted-foreground">{review.representativeReply}</p>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <Textarea
                          placeholder="Написать ответ на отзыв..."
                          value={replyText[review.id] ?? ""}
                          onChange={(e) => setReplyText({ ...replyText, [review.id]: e.target.value })}
                          rows={2}
                          className="resize-none mb-2"
                        />
                        <Button
                          size="sm"
                          className="bg-[var(--color-brand-navy)] text-white"
                          disabled={!replyText[review.id] || replyReview.isPending}
                          onClick={() => replyReview.mutate({ reviewId: review.id, reply: replyText[review.id] ?? "" })}
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                          Ответить
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-xl">
                <Star className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Отзывов пока нет</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Documents Tab ───────────────────────────────────────────────── */}
        {activeTab === "documents" && myInst && (
          <div className="max-w-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-semibold">Документы</h2>
              <Button
                className="bg-[var(--color-brand-navy)] text-white"
                size="sm"
                disabled={uploading || addDoc.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading || addDoc.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Загрузка...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" />Загрузить файл</>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <div className="p-4 rounded-xl bg-[var(--color-brand-gold)]/8 border border-[var(--color-brand-gold)]/20 mb-5">
              <p className="text-xs text-muted-foreground">
                Поддерживаемые форматы: PDF, DOC, DOCX, JPG, PNG. Максимальный размер: 16 МБ.
                Загружайте лицензии, аккредитации, брошюры и другие документы.
              </p>
            </div>

            {docsLoading ? (
              <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
            ) : docs && docs.length > 0 ? (
              <div className="space-y-2">
                {docs.map((doc: any) => (
                  <div key={doc.id} className="edu-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-navy)]/8 flex items-center justify-center">
                        <FileUp className="w-4 h-4 text-[var(--color-brand-navy)]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.type} · {new Date(doc.createdAt).toLocaleDateString("ru-RU")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="text-xs h-7">Открыть</Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 text-red-500 hover:bg-red-50"
                        disabled={deleteDoc.isPending}
                        onClick={() => {
                          if (confirm("Удалить документ?")) {
                            deleteDoc.mutate({ id: doc.id });
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-xl">
                <FileUp className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Документов нет</p>
                <p className="text-xs text-muted-foreground mt-1">Загрузите лицензии, аккредитации, брошюры</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
