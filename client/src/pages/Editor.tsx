import { useFirebaseAuth } from "@/contexts/AuthContext";
import { useAuth } from "@/_core/hooks/useAuth";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  BookOpen, Building2, CheckCircle2, Edit3, FileText, Loader2,
  LogIn, PenLine, Plus, Send, Shield, Trash2, X, ChevronRight,
  Image, Phone, Globe, MapPin, Calendar, Users,
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

const EMPTY_FORM = {
  name: "", type: "university", city: "", address: "", phone: "", email: "",
  website: "", shortDescription: "", description: "", foundedYear: "",
  slug: "", directorName: "", socialVk: "", socialTelegram: "", socialInstagram: "",
  lat: "", lng: "",
};

// ─── Модальное окно редактирования карточки ───────────────────────────────────

function InstitutionEditModal({
  instId,
  onClose,
}: {
  instId: number;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const { data: inst, isLoading } = trpc.institutions.getById.useQuery({ id: instId });

  const [tab, setTab] = useState<"main" | "contacts" | "photos" | "specializations">("main");
  const [form, setForm] = useState(EMPTY_FORM);
  const [specs, setSpecs] = useState<Array<{ name: string; cost: string; description: string }>>([]);
  const [newSpec, setNewSpec] = useState({ name: "", cost: "free", description: "" });
  const [saved, setSaved] = useState(false);

  // Заполняем форму данными учреждения
  useEffect(() => {
    if (!inst) return;
    setForm({
      name: inst.name ?? "",
      type: inst.type ?? "university",
      city: inst.city ?? "",
      address: inst.address ?? "",
      phone: inst.phone ?? "",
      email: inst.email ?? "",
      website: inst.website ?? "",
      shortDescription: inst.shortDescription ?? "",
      description: inst.description ?? "",
      foundedYear: inst.foundedYear ? String(inst.foundedYear) : "",
      slug: inst.slug ?? "",
      directorName: inst.directorName ?? "",
      socialVk: inst.socialVk ?? "",
      socialTelegram: inst.socialTelegram ?? "",
      socialInstagram: inst.socialInstagram ?? "",
      lat: inst.lat ?? "",
      lng: inst.lng ?? "",
    });
    if (inst.specializations) {
      setSpecs(inst.specializations.map((s: any) => ({
        name: s.name,
        cost: s.cost ?? "free",
        description: s.description ?? "",
      })));
    }
  }, [inst]);

  const updateInst = trpc.institutions.update.useMutation({
    onSuccess: () => {
      setSaved(true);
      utils.institutions.list.invalidate();
      utils.institutions.getById.invalidate({ id: instId });
      toast.success("Карточка сохранена");
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateSpecs = trpc.institutions.updateSpecializations.useMutation({
    onSuccess: () => {
      utils.institutions.getById.invalidate({ id: instId });
      toast.success("Специальности сохранены");
    },
    onError: (e) => toast.error(e.message),
  });

  const deletePhoto = trpc.institutions.deletePhoto.useMutation({
    onSuccess: () => utils.institutions.getById.invalidate({ id: instId }),
  });

  const submitForReview = trpc.institutions.submitForReview.useMutation({
    onSuccess: () => {
      utils.institutions.list.invalidate();
      toast.success("Отправлено на проверку администратору");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSaveMain = () => {
    updateInst.mutate({
      id: instId,
      name: form.name,
      type: form.type as any,
      city: form.city,
      address: form.address || undefined,
      shortDescription: form.shortDescription || undefined,
      description: form.description || undefined,
      foundedYear: form.foundedYear ? parseInt(form.foundedYear) : undefined,
      slug: form.slug || undefined,
      directorName: form.directorName || undefined,
      lat: form.lat || undefined,
      lng: form.lng || undefined,
    });
  };

  const handleSaveContacts = () => {
    updateInst.mutate({
      id: instId,
      phone: form.phone || undefined,
      email: form.email || undefined,
      website: form.website || undefined,
      socialVk: form.socialVk || undefined,
      socialTelegram: form.socialTelegram || undefined,
      socialInstagram: form.socialInstagram || undefined,
    });
  };

  const handleSaveSpecs = () => {
    updateSpecs.mutate({
      institutionId: instId,
      specializations: specs.map((s) => ({
        name: s.name,
        cost: s.cost as any,
        description: s.description || undefined,
      })),
    });
  };

  const addSpec = () => {
    if (!newSpec.name.trim()) return;
    setSpecs((prev) => [...prev, { ...newSpec }]);
    setNewSpec({ name: "", cost: "free", description: "" });
  };

  const TABS = [
    { id: "main", label: "Основное", icon: Building2 },
    { id: "contacts", label: "Контакты", icon: Phone },
    { id: "photos", label: "Фото", icon: Image },
    { id: "specializations", label: "Специальности", icon: Users },
  ] as const;

  const statusColor =
    inst?.status === "published" ? "bg-green-100 text-green-700" :
    inst?.status === "pending" ? "bg-yellow-100 text-yellow-700" :
    inst?.status === "rejected" ? "bg-red-100 text-red-700" :
    "bg-gray-100 text-gray-600";

  const statusLabel =
    inst?.status === "published" ? "Опубликовано" :
    inst?.status === "pending" ? "На проверке" :
    inst?.status === "rejected" ? "Отклонено" : "Черновик";

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-serif text-lg">
                {isLoading ? "Загрузка..." : inst?.name ?? "Карточка учреждения"}
              </DialogTitle>
              {inst && (
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
                    {statusLabel}
                  </span>
                  {inst.city && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{inst.city}
                    </span>
                  )}
                </div>
              )}
            </div>
            {/* Кнопка «Отправить на проверку» если черновик или отклонено */}
            {inst && (inst.status === "draft" || inst.status === "rejected") && (
              <Button
                size="sm"
                className="bg-[var(--color-brand-navy)] text-white shrink-0"
                disabled={submitForReview.isPending}
                onClick={() => submitForReview.mutate({ id: instId })}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {submitForReview.isPending ? "Отправка..." : "Отправить на проверку"}
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Sub-tabs */}
        <div className="flex border-b border-border bg-[var(--color-brand-warm)] shrink-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? "border-[var(--color-brand-navy)] text-[var(--color-brand-navy)] bg-white"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : (
            <>
              {/* ── Основное ── */}
              {tab === "main" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">
                        Название <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Ростовский государственный университет"
                      />
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">Тип</Label>
                      <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {INSTITUTION_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">
                        Город <span className="text-destructive">*</span>
                      </Label>
                      <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ростов-на-Дону" />
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">Год основания</Label>
                      <Input type="number" value={form.foundedYear} onChange={(e) => setForm({ ...form, foundedYear: e.target.value })} placeholder="1915" />
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">Директор / Ректор</Label>
                      <Input value={form.directorName} onChange={(e) => setForm({ ...form, directorName: e.target.value })} placeholder="Иванов Иван Иванович" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">Адрес</Label>
                      <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="ул. Пушкинская, 1" />
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">Широта (lat)</Label>
                      <Input value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} placeholder="47.2357" />
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">Долгота (lng)</Label>
                      <Input value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} placeholder="39.7015" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">Краткое описание</Label>
                      <Textarea
                        value={form.shortDescription}
                        onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                        placeholder="2–3 предложения об учреждении..."
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">Полное описание</Label>
                      <Textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="История, достижения, особенности..."
                        rows={5}
                        className="resize-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">URL-slug</Label>
                      <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="rostov-university" />
                    </div>
                  </div>
                  <Button
                    className="w-full bg-[var(--color-brand-navy)] text-white"
                    disabled={updateInst.isPending || !form.name || !form.city}
                    onClick={handleSaveMain}
                  >
                    {updateInst.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4 mr-2 text-green-400" /> : null}
                    {saved ? "Сохранено!" : "Сохранить основную информацию"}
                  </Button>
                </div>
              )}

              {/* ── Контакты ── */}
              {tab === "contacts" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">Телефон</Label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+7 (863) 000-00-00" />
                    </div>
                    <div>
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">Email</Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="info@university.ru" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">Сайт</Label>
                      <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://university.ru" />
                    </div>
                    <div className="col-span-2 pt-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Социальные сети</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">ВКонтакте</Label>
                      <Input value={form.socialVk} onChange={(e) => setForm({ ...form, socialVk: e.target.value })} placeholder="https://vk.com/university" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">Telegram</Label>
                      <Input value={form.socialTelegram} onChange={(e) => setForm({ ...form, socialTelegram: e.target.value })} placeholder="https://t.me/university" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5 block">Instagram</Label>
                      <Input value={form.socialInstagram} onChange={(e) => setForm({ ...form, socialInstagram: e.target.value })} placeholder="https://instagram.com/university" />
                    </div>
                  </div>
                  <Button
                    className="w-full bg-[var(--color-brand-navy)] text-white"
                    disabled={updateInst.isPending}
                    onClick={handleSaveContacts}
                  >
                    {updateInst.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Сохранить контакты
                  </Button>
                </div>
              )}

              {/* ── Фото ── */}
              {tab === "photos" && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Для загрузки фотографий используйте ссылки на уже загруженные изображения.
                    В будущем здесь появится загрузка файлов.
                  </p>

                  {/* Существующие фото */}
                  {inst?.photos && inst.photos.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Фотографии ({inst.photos.length})
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {inst.photos.map((photo: any) => (
                          <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-border aspect-video bg-muted">
                            <img src={photo.url} alt={photo.caption ?? ""} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={() => deletePhoto.mutate({ id: photo.id })}
                                className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {photo.caption && (
                              <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">{photo.caption}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Добавить фото по URL */}
                  <AddPhotoByUrl institutionId={instId} onAdded={() => utils.institutions.getById.invalidate({ id: instId })} />

                  {/* Обложка */}
                  <div className="border-t pt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Обложка и логотип</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">URL обложки</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://..."
                            id="coverUrl"
                            className="text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const val = (document.getElementById("coverUrl") as HTMLInputElement)?.value;
                              if (val) updateInst.mutate({ id: instId, coverImageUrl: val, coverImageKey: "manual" });
                            }}
                          >
                            ОК
                          </Button>
                        </div>
                        {inst?.coverImageUrl && (
                          <div className="mt-2 rounded-lg overflow-hidden aspect-video bg-muted">
                            <img src={inst.coverImageUrl} alt="Обложка" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">URL логотипа</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://..."
                            id="logoUrl"
                            className="text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const val = (document.getElementById("logoUrl") as HTMLInputElement)?.value;
                              if (val) updateInst.mutate({ id: instId, logoUrl: val, logoKey: "manual" });
                            }}
                          >
                            ОК
                          </Button>
                        </div>
                        {inst?.logoUrl && (
                          <div className="mt-2 w-16 h-16 rounded-lg border border-border overflow-hidden bg-white p-1">
                            <img src={inst.logoUrl} alt="Логотип" className="w-full h-full object-contain" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Специальности ── */}
              {tab === "specializations" && (
                <div className="space-y-4">
                  {/* Список */}
                  {specs.length > 0 ? (
                    <div className="space-y-2">
                      {specs.map((spec, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-[var(--color-brand-warm)]">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{spec.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {spec.cost === "free" ? "Бюджет" : spec.cost === "paid" ? "Платное" : "Бюджет / Платное"}
                              {spec.description ? ` · ${spec.description}` : ""}
                            </p>
                          </div>
                          <button
                            onClick={() => setSpecs((prev) => prev.filter((_, j) => j !== i))}
                            className="text-red-400 hover:text-red-600 shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">Специальностей пока нет</p>
                  )}

                  {/* Добавить новую */}
                  <div className="border-t pt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Добавить специальность</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Input
                          value={newSpec.name}
                          onChange={(e) => setNewSpec({ ...newSpec, name: e.target.value })}
                          placeholder="Название специальности"
                        />
                      </div>
                      <Select value={newSpec.cost} onValueChange={(v) => setNewSpec({ ...newSpec, cost: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Бюджет</SelectItem>
                          <SelectItem value="paid">Платное</SelectItem>
                          <SelectItem value="mixed">Бюджет + Платное</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={newSpec.description}
                        onChange={(e) => setNewSpec({ ...newSpec, description: e.target.value })}
                        placeholder="Описание (необязательно)"
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="mt-3 w-full"
                      onClick={addSpec}
                      disabled={!newSpec.name.trim()}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить в список
                    </Button>
                  </div>

                  <Button
                    className="w-full bg-[var(--color-brand-navy)] text-white"
                    disabled={updateSpecs.isPending}
                    onClick={handleSaveSpecs}
                  >
                    {updateSpecs.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Сохранить специальности
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Добавление фото по URL
function AddPhotoByUrl({ institutionId, onAdded }: { institutionId: number; onAdded: () => void }) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const addPhoto = trpc.institutions.addPhoto.useMutation({
    onSuccess: () => { setUrl(""); setCaption(""); onAdded(); toast.success("Фото добавлено"); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="border rounded-xl p-4 space-y-3 bg-[var(--color-brand-warm)]">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Добавить фото по ссылке</p>
      <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/photo.jpg" />
      <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Подпись (необязательно)" />
      <Button
        size="sm"
        variant="outline"
        disabled={!url.trim() || addPhoto.isPending}
        onClick={() => addPhoto.mutate({ institutionId, url, fileKey: "manual", caption: caption || undefined })}
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Добавить фото
      </Button>
    </div>
  );
}

// ─── Основная страница редактора ──────────────────────────────────────────────

export default function Editor() {
  const { user, isAuthenticated, loading } = useAuth();
  const { openAuthModal } = useFirebaseAuth();
  const params = useParams<{ section?: string; id?: string }>();
  const [activeTab, setActiveTab] = useState(() => {
    if (params.section === "news") return "news";
    return "institutions";
  });
  const utils = trpc.useUtils();

  // ID выбранного учреждения для редактирования
  const [editInstId, setEditInstId] = useState<number | null>(null);

  // Форма создания нового учреждения
  const [instForm, setInstForm] = useState(EMPTY_FORM);
  const [instSaved, setInstSaved] = useState(false);

  // Форма новости
  const [newsForm, setNewsForm] = useState({
    title: "", slug: "", excerpt: "", content: "", status: "draft" as "draft" | "published",
  });
  const [newsSaved, setNewsSaved] = useState(false);

  // Список моих учреждений
  const { data: myInsts, isLoading: instsLoading } = trpc.institutions.list.useQuery(
    { page: 1, limit: 50, editorView: true },
    { enabled: isAuthenticated && (user?.role === "editor" || user?.role === "admin" || user?.role === "representative") && activeTab === "institutions" }
  );

  const { data: myNews, isLoading: newsLoading } = trpc.news.list.useQuery(
    { page: 1, limit: 20 },
    { enabled: isAuthenticated && (user?.role === "editor" || user?.role === "admin") && activeTab === "news" }
  );

  const submitForReview = trpc.institutions.submitForReview.useMutation({
    onSuccess: () => {
      utils.institutions.list.invalidate();
      toast.success("Заявка отправлена администратору");
    },
    onError: (err) => toast.error(err.message),
  });

  const createInstitution = trpc.institutions.create.useMutation({
    onSuccess: (data) => {
      setInstSaved(true);
      utils.institutions.list.invalidate();
      toast.success("Учреждение создано! Заполните карточку.");
      setInstForm(EMPTY_FORM);
      setTimeout(() => { setInstSaved(false); setEditInstId(data.id); }, 800);
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

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 64);

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
          <Button className="bg-[var(--color-brand-navy)] text-white mt-4" onClick={openAuthModal}>Войти</Button>
        </div>
      </PageLayout>
    );
  }

  const allowedRoles = ["editor", "admin", "representative"];
  if (!allowedRoles.includes(user?.role ?? "")) {
    return (
      <PageLayout>
        <div className="container py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="font-serif text-2xl font-semibold mb-2">Доступ запрещён</h2>
          <p className="text-muted-foreground text-sm">Только для редакторов и администраторов</p>
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

        {/* ─── Institutions ────────────────────────────────────────────────── */}
        {activeTab === "institutions" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Форма создания */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Plus className="w-4.5 h-4.5 text-[var(--color-brand-gold)]" />
                <h2 className="font-serif text-lg font-semibold">Создать новое учреждение</h2>
              </div>
              <div className="edu-card p-6 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Укажите минимальную информацию — название и город. После создания нажмите на карточку чтобы заполнить все поля.
                </p>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                    Название <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={instForm.name}
                    onChange={(e) => setInstForm({ ...instForm, name: e.target.value, slug: generateSlug(e.target.value) })}
                    placeholder="Ростовский государственный университет"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Тип</Label>
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
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                      Город <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={instForm.city}
                      onChange={(e) => setInstForm({ ...instForm, city: e.target.value })}
                      placeholder="Ростов-на-Дону"
                    />
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
                      slug: instForm.slug || generateSlug(instForm.name) || `inst-${Date.now()}`,
                    })
                  }
                >
                  {createInstitution.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Создание...</>
                  ) : instSaved ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2 text-green-400" />Создано!</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" />Создать учреждение</>
                  )}
                </Button>
              </div>
            </div>

            {/* Список учреждений */}
            <div>
              <h2 className="font-serif text-lg font-semibold mb-5">Мои учреждения</h2>
              {instsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
              ) : myInsts?.items.length ? (
                <div className="space-y-2">
                  {myInsts.items.map((inst: any) => (
                    <div
                      key={inst.id}
                      className="edu-card p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-[var(--color-brand-navy)]/30 hover:shadow-md transition-all group"
                      onClick={() => setEditInstId(inst.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm group-hover:text-[var(--color-brand-navy)] transition-colors">
                          {inst.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {inst.city} · {TYPE_LABELS[inst.type] ?? inst.type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
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
                        <div className="flex items-center gap-1 text-[var(--color-brand-navy)] opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Заполнить</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-[var(--color-brand-navy)] transition-colors" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Удалить учреждение?")) deleteInst.mutate({ id: inst.id });
                          }}
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
                  <p className="text-xs text-muted-foreground/70 mt-1">Создайте первое учреждение слева</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── News ──────────────────────────────────────────────────────────── */}
        {activeTab === "news" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Plus className="w-4.5 h-4.5 text-[var(--color-brand-gold)]" />
                <h2 className="font-serif text-lg font-semibold">Новая статья</h2>
              </div>
              <div className="edu-card p-6 space-y-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                    Заголовок <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={newsForm.title}
                    onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value, slug: generateSlug(e.target.value) })}
                    placeholder="Новости образования..."
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">URL-slug</Label>
                  <Input value={newsForm.slug} onChange={(e) => setNewsForm({ ...newsForm, slug: e.target.value })} placeholder="novosti-obrazovaniya" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Краткое описание</Label>
                  <Textarea
                    value={newsForm.excerpt}
                    onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })}
                    placeholder="Краткое описание статьи..."
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                    Текст статьи <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={newsForm.content}
                    onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                    placeholder="Полный текст статьи..."
                    rows={8}
                    className="resize-none"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">Статус</Label>
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
                      slug: newsForm.slug || generateSlug(newsForm.title) || `news-${Date.now()}`,
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

      {/* Модальное окно редактирования карточки */}
      {editInstId !== null && (
        <InstitutionEditModal
          instId={editInstId}
          onClose={() => setEditInstId(null)}
        />
      )}
    </PageLayout>
  );
}
