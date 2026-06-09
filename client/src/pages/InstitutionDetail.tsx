import { useAuth } from "@/_core/hooks/useAuth";
import { MapView } from "@/components/Map";
import PageLayout from "@/components/PageLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  PenLine,
  Phone,
  Send,
  Share2,
  Star,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = {
  university: "Университет",
  college: "Колледж",
  institute: "Институт",
  academy: "Академия",
  school: "Школа",
  other: "Учреждение",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  brochure: "Брошюра",
  certificate: "Сертификат",
  accreditation: "Аккредитация",
  other: "Документ",
};

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          className={cn(
            "transition-colors",
            onChange ? "cursor-pointer" : "cursor-default"
          )}
          disabled={!onChange}
        >
          <Star
            className={cn(
              "w-5 h-5 transition-colors",
              (hover || value) >= star
                ? "fill-amber-400 stroke-amber-400"
                : "stroke-muted-foreground/40 fill-transparent"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function InstitutionDetail() {
  const params = useParams<{ slug?: string; numId?: string }>();
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [galleryIndex, setGalleryIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [showReplyFor, setShowReplyFor] = useState<number | null>(null);

  // Поддержка двух режимов: /institution/:slug и /institution/id/:numId
  const numericId = params.numId ? parseInt(params.numId) : null;
  const slugParam = params.slug ?? null;

  const { data: instBySlug, isLoading: loadingBySlug, isError: errorBySlug } =
    trpc.institutions.getBySlug.useQuery(
      { slug: slugParam ?? "" },
      { enabled: !!slugParam && !numericId, retry: false }
    );

  const { data: instById, isLoading: loadingById, isError: errorById } =
    trpc.institutions.getById.useQuery(
      { id: numericId ?? 0 },
      { enabled: !!numericId, retry: false }
    );

  const inst = instBySlug ?? instById ?? null;
  const isLoading = loadingBySlug || loadingById;
  const isError = (!numericId && errorBySlug) || (!!numericId && errorById);

  const { data: reviews } = trpc.reviews.list.useQuery(
    { institutionId: inst?.id ?? 0 },
    { enabled: !!inst?.id }
  );

  const incrementView = trpc.institutions.incrementView.useMutation();
  const bookmarkToggle = trpc.bookmarks.toggle.useMutation({
    onSuccess: () => utils.institutions.getBySlug.invalidate({ slug: slugParam ?? "" }),
  });
  const createReview = trpc.reviews.create.useMutation({
    onSuccess: () => {
      setReviewText("");
      setReviewRating(0);
      utils.reviews.list.invalidate({ institutionId: inst?.id ?? 0 });
      toast.success("Отзыв добавлен");
    },
  });
  const deleteReview = trpc.reviews.delete.useMutation({
    onSuccess: () => {
      utils.reviews.list.invalidate({ institutionId: inst?.id ?? 0 });
      toast.success("Отзыв удалён");
    },
  });
  const addReply = trpc.reviews.addReply.useMutation({
    onSuccess: () => {
      setShowReplyFor(null);
      setReplyText({});
      utils.reviews.list.invalidate({ institutionId: inst?.id ?? 0 });
      toast.success("Ответ добавлен");
    },
  });

  useEffect(() => {
    if (inst?.id) incrementView.mutate({ id: inst.id });
  }, [inst?.id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Ссылка скопирована");
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container py-10">
          <Skeleton className="h-72 rounded-2xl mb-6" />
          <Skeleton className="h-8 w-64 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </PageLayout>
    );
  }

  if (!inst || isError) {
    // Для редакторов и админов показываем кнопку «Заполнить карточку»
    const isEditorOrAdmin = (user?.role === "editor" || user?.role === "admin");
    const slugOrId = slugParam ?? (numericId ? String(numericId) : null);

    return (
      <PageLayout>
        <div className="container py-24 text-center max-w-lg mx-auto">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
            isEditorOrAdmin ? "bg-[var(--color-brand-navy)]/8" : "bg-muted"
          }`}>
            <Building2 className={`w-10 h-10 ${
              isEditorOrAdmin ? "text-[var(--color-brand-navy)]" : "text-muted-foreground/40"
            }`} />
          </div>

          {isEditorOrAdmin ? (
            <>
              <h2 className="font-serif text-2xl font-semibold mb-2">Карточка не заполнена</h2>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                Учреждение создано, но информация ещё не добавлена. Перейдите в панель редактора чтобы заполнить карточку.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={`/editor/institutions/${numericId ?? ""}`}>
                  <Button className="bg-[var(--color-brand-navy)] text-white px-6">
                    <PenLine className="w-4 h-4 mr-2" />
                    Заполнить карточку
                  </Button>
                </Link>
                <Link href="/catalog">
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    В каталог
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="font-serif text-2xl font-semibold mb-2">Информация не заполнена</h2>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                Страница этого учреждения ещё не опубликована или находится на модерации. Попробуйте зайти позже.
              </p>
              <Link href="/catalog">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Вернуться в каталог
                </Button>
              </Link>
            </>
          )}
        </div>
      </PageLayout>
    );
  }

  const allPhotos = [
    ...(inst.coverImageUrl ? [{ url: inst.coverImageUrl, caption: inst.name }] : []),
    ...inst.photos.map((p) => ({ url: p.url, caption: p.caption ?? "" })),
  ];

  const avgRating = inst.avgRating ?? 0;
  const reviewCount = reviews?.length ?? 0;
  const foundedYear = inst.foundedYear;
  const age = foundedYear ? new Date().getFullYear() - foundedYear : null;

  const isRepresentative = user?.role === "representative" && inst.representativeId === user.id;
  const isEditorOrAdmin = user?.role === "editor" || user?.role === "admin";

  // Карточка пустая — нет основной информации
  const isEmpty = !inst.shortDescription && !inst.description && (!inst.photos || inst.photos.length === 0) && !inst.address && !inst.phone && !inst.email && (!inst.specializations || inst.specializations.length === 0);

  return (
    <PageLayout>
      {/* Баннер «Заполнить карточку» для редакторов когда карточка пустая */}
      {(isEditorOrAdmin || isRepresentative) && isEmpty && (
        <div className="bg-[var(--color-brand-navy)] text-white">
          <div className="container py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-sm">
              <PenLine className="w-4 h-4 text-[var(--color-brand-gold)] shrink-0" />
              <span>Карточка пустая — добавьте описание, контакты и фотографии</span>
            </div>
            {isRepresentative ? (
              <Link href="/representative">
                <Button size="sm" className="bg-[var(--color-brand-gold)] hover:bg-[var(--color-brand-gold)]/90 text-[var(--color-brand-navy)] font-semibold shrink-0">
                  Заполнить карточку
                </Button>
              </Link>
            ) : (
              <Link href={`/editor/institutions/${inst.id}`}>
                <Button size="sm" className="bg-[var(--color-brand-gold)] hover:bg-[var(--color-brand-gold)]/90 text-[var(--color-brand-navy)] font-semibold shrink-0">
                  Заполнить карточку
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Статус-баннер для редакторов/админов */}
      {isEditorOrAdmin && inst.status !== "published" && (
        <div className={`border-b py-2.5 ${
          inst.status === "pending" ? "bg-yellow-50 border-yellow-200" :
          inst.status === "rejected" ? "bg-red-50 border-red-200" :
          "bg-gray-50 border-gray-200"
        }`}>
          <div className="container flex items-center gap-3 text-sm">
            <span className={`font-semibold ${
              inst.status === "pending" ? "text-yellow-700" :
              inst.status === "rejected" ? "text-red-700" : "text-gray-700"
            }`}>
              {inst.status === "pending" && "⏳ Карточка на модерации — видна только редакторам и администраторам"}
              {inst.status === "rejected" && "❌ Карточка отклонена — исправьте и отправьте повторно"}
              {inst.status === "draft" && "📝 Черновик — не опубликован"}
            </span>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-[var(--color-brand-warm)] border-b border-border">
        <div className="container py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Главная</Link>
            <span>/</span>
            <Link href="/catalog" className="hover:text-foreground transition-colors">Каталог</Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-48">{inst.name}</span>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ─── Main Content ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div className="flex items-start gap-4">
              {inst.logoUrl && (
                <div className="w-16 h-16 rounded-xl border border-border bg-white shadow-sm overflow-hidden shrink-0">
                  <img src={inst.logoUrl} alt={`Логотип ${inst.name}`} className="w-full h-full object-contain p-1.5" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <Badge variant="secondary" className="text-xs">
                    {TYPE_LABELS[inst.type] ?? inst.type}
                  </Badge>
                  {inst.promotionBadge && (
                    <Badge className="bg-[var(--color-brand-gold)] text-white text-xs">
                      {inst.promotionBadge}
                    </Badge>
                  )}
                  {inst.isFeatured && (
                    <Badge variant="outline" className="text-xs border-amber-200 text-amber-600">
                      <Star className="w-3 h-3 mr-1 fill-amber-400 stroke-amber-400" />
                      Топ
                    </Badge>
                  )}
                </div>
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground leading-tight">
                  {inst.name}
                </h1>
                <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-[var(--color-brand-gold)]" />
                  <span>{inst.city}{inst.region ? `, ${inst.region}` : ""}</span>
                </div>
              </div>
            </div>

            {/* Photo Gallery */}
            {allPhotos.length > 0 && (
              <div>
                <div
                  className="relative rounded-2xl overflow-hidden cursor-pointer bg-muted"
                  style={{ aspectRatio: "16/9" }}
                  onClick={() => setLightboxOpen(true)}
                >
                  <img
                    src={allPhotos[galleryIndex]?.url}
                    alt={allPhotos[galleryIndex]?.caption ?? inst.name}
                    className="w-full h-full object-cover"
                  />
                  {allPhotos.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => Math.max(0, i - 1)); }}
                        disabled={galleryIndex === 0}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 disabled:opacity-30 transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => Math.min(allPhotos.length - 1, i + 1)); }}
                        disabled={galleryIndex === allPhotos.length - 1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 disabled:opacity-30 transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-xs">
                        {galleryIndex + 1} / {allPhotos.length}
                      </div>
                    </>
                  )}
                </div>
                {allPhotos.length > 1 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                    {allPhotos.map((photo, i) => (
                      <button
                        key={i}
                        onClick={() => setGalleryIndex(i)}
                        className={cn(
                          "shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all",
                          i === galleryIndex ? "border-[var(--color-brand-navy)]" : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      >
                        <img src={photo.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Lightbox */}
            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
              <DialogContent className="max-w-4xl p-2 bg-black/95 border-none">
                <img
                  src={allPhotos[galleryIndex]?.url}
                  alt={allPhotos[galleryIndex]?.caption ?? inst.name}
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
              </DialogContent>
            </Dialog>

            {/* Description */}
            {inst.description && (
              <div>
                <h2 className="font-serif text-xl font-semibold mb-3">Об учреждении</h2>
                <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {inst.description}
                </div>
              </div>
            )}

            {/* Specializations */}
            {inst.specializations.length > 0 && (
              <div>
                <h2 className="font-serif text-xl font-semibold mb-4">Специальности</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inst.specializations.map((spec) => (
                    <div key={spec.id} className="flex items-start gap-3 p-3.5 rounded-xl border border-border bg-[var(--color-brand-warm)]">
                      <GraduationCap className="w-4 h-4 text-[var(--color-brand-gold)] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{spec.name}</p>
                        {spec.cost && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {spec.cost === "free" ? "Бесплатно" : spec.cost === "paid" ? "Платно" : "Платно/Бесплатно"}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {inst.documents.length > 0 && (
              <div>
                <h2 className="font-serif text-xl font-semibold mb-4">Документы</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inst.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-white hover:border-[var(--color-brand-navy)]/30 hover:shadow-sm transition-all group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[var(--color-brand-navy)]/8 flex items-center justify-center shrink-0">
                        <FileText className="w-4.5 h-4.5 text-[var(--color-brand-navy)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{DOC_TYPE_LABELS[doc.type] ?? doc.type}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[var(--color-brand-navy)] transition-colors shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {(inst.lat && inst.lng) || inst.address ? (
              <div>
                <h2 className="font-serif text-xl font-semibold mb-4">Расположение</h2>
                {inst.lat && inst.lng ? (
                  <div className="rounded-2xl overflow-hidden border border-border relative group" style={{ height: 360 }}>
                    <MapView
                      onMapReady={(map) => {
                        const lat = parseFloat(String(inst.lat));
                        const lng = parseFloat(String(inst.lng));
                        const center = { lat, lng };
                        map.setCenter(center);
                        map.setZoom(15);

                        const marker = new google.maps.Marker({
                          position: center,
                          map,
                          title: inst.name,
                          icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: "#1a2a4a",
                            fillOpacity: 1,
                            strokeColor: "#c9a84c",
                            strokeWeight: 2,
                          },
                        });

                        const infoWindow = new google.maps.InfoWindow({
                          content: `<div style="font-family:sans-serif;padding:4px 2px"><strong>${inst.name}</strong><br/><small>${inst.address ?? ""}</small></div>`,
                        });

                        marker.addListener("click", () => infoWindow.open(map, marker));
                        infoWindow.open(map, marker);
                      }}
                    />
                    {/* Кнопки открытия в картах */}
                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={`https://yandex.ru/maps/?text=${encodeURIComponent(inst.address ?? inst.name)}&ll=${inst.lng},${inst.lat}&z=15`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white rounded-lg shadow-md text-xs font-medium text-[var(--color-brand-navy)] hover:bg-[var(--color-brand-navy)] hover:text-white transition-colors border border-border"
                      >
                        Яндекс Карты
                      </a>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((inst.address ? `${inst.address}, ` : "") + inst.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white rounded-lg shadow-md text-xs font-medium text-[var(--color-brand-navy)] hover:bg-[var(--color-brand-navy)] hover:text-white transition-colors border border-border"
                      >
                        Google Maps
                      </a>
                    </div>
                  </div>
                ) : null}
                {inst.address && (
                  <p className="flex items-start gap-2 text-sm text-muted-foreground mt-2.5">
                    <MapPin className="w-4 h-4 text-[var(--color-brand-gold)] mt-0.5 shrink-0" />
                    {inst.address}
                  </p>
                )}
              </div>
            ) : null}

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif text-xl font-semibold">
                  Отзывы{reviewCount > 0 && <span className="text-muted-foreground font-normal text-base ml-2">({reviewCount})</span>}
                </h2>
                {avgRating > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating value={Math.round(avgRating)} />
                    <span className="font-semibold text-foreground">{avgRating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {/* Add review */}
              {isAuthenticated ? (
                <div className="p-5 rounded-xl border border-border bg-[var(--color-brand-warm)] mb-6">
                  <h3 className="font-medium text-sm mb-3">Оставить отзыв</h3>
                  <div className="mb-3">
                    <StarRating value={reviewRating} onChange={setReviewRating} />
                  </div>
                  <Textarea
                    placeholder="Поделитесь впечатлениями об учреждении..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="mb-3 resize-none"
                    rows={3}
                  />
                  <Button
                    size="sm"
                    disabled={reviewRating === 0 || createReview.isPending}
                    onClick={() => createReview.mutate({ institutionId: inst.id, rating: reviewRating, text: reviewText || undefined })}
                    className="bg-[var(--color-brand-navy)] text-white"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Отправить отзыв
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground mb-6">
                  <Link href="/profile" className="text-[var(--color-brand-navy)] font-medium hover:underline">
                    Войдите
                  </Link>{" "}
                  чтобы оставить отзыв
                </div>
              )}

              {/* Review list */}
              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="p-5 rounded-xl border border-border bg-white">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarFallback className="text-xs bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)]">
                            {review.user?.name?.[0]?.toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm">{review.user?.name ?? "Аноним"}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString("ru-RU")}
                              </span>
                              {isEditorOrAdmin && (
                                <button
                                  onClick={() => { if (confirm("Удалить отзыв?")) deleteReview.mutate({ id: review.id }); }}
                                  className="text-red-400 hover:text-red-600 transition-colors"
                                  title="Удалить отзыв"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <StarRating value={review.rating} />
                        </div>
                      </div>
                      {review.text && <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>}

                      {/* Representative reply */}
                      {review.representativeReply && (
                        <div className="mt-3 pl-4 border-l-2 border-[var(--color-brand-gold)]/40">
                          <p className="text-xs font-medium text-[var(--color-brand-navy)] mb-1">Ответ представителя</p>
                          <p className="text-sm text-muted-foreground">{review.representativeReply}</p>
                        </div>
                      )}

                      {/* Reply form for representative */}
                      {(isRepresentative || isEditorOrAdmin) && !review.representativeReply && (
                        <div className="mt-3">
                          {showReplyFor === review.id ? (
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Ответить на отзыв..."
                                value={replyText[review.id] ?? ""}
                                onChange={(e) => setReplyText((prev) => ({ ...prev, [review.id]: e.target.value }))}
                                rows={2}
                                className="resize-none text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => addReply.mutate({ reviewId: review.id, reply: replyText[review.id] ?? "" })}
                                  disabled={!replyText[review.id] || addReply.isPending}
                                  className="bg-[var(--color-brand-navy)] text-white text-xs"
                                >
                                  Ответить
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setShowReplyFor(null)} className="text-xs">
                                  Отмена
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowReplyFor(review.id)}
                              className="text-xs text-[var(--color-brand-navy)] hover:underline"
                            >
                              Ответить
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Отзывов пока нет. Будьте первым!
                </div>
              )}
            </div>
          </div>

          {/* ─── Sidebar ──────────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => {
                  if (!isAuthenticated) { toast.error("Войдите для сохранения"); return; }
                  bookmarkToggle.mutate({ institutionId: inst.id });
                }}
              >
                {inst.bookmarked ? (
                  <><BookmarkCheck className="w-4 h-4 text-[var(--color-brand-gold)]" /> Сохранено</>
                ) : (
                  <><Bookmark className="w-4 h-4" /> Сохранить</>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Key Info */}
            <div className="edu-card p-5 space-y-4">
              <h3 className="font-serif font-semibold text-base">Информация</h3>

              {inst.directorName && (
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-[var(--color-brand-gold)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Директор</p>
                    <p className="text-sm font-medium">{inst.directorName}</p>
                  </div>
                </div>
              )}

              {foundedYear && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-[var(--color-brand-gold)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Основано</p>
                    <p className="text-sm font-medium">
                      {foundedYear} год{age ? ` (${age} ${age === 1 ? "год" : age < 5 ? "года" : "лет"})` : ""}
                    </p>
                  </div>
                </div>
              )}

              {avgRating > 0 && (
                <div className="flex items-start gap-3">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Рейтинг</p>
                    <p className="text-sm font-medium">{avgRating.toFixed(1)} / 5 ({reviewCount} отзывов)</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-[var(--color-brand-gold)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Просмотров</p>
                  <p className="text-sm font-medium">{inst.viewCount.toLocaleString("ru-RU")}</p>
                </div>
              </div>
            </div>

            {/* Contacts */}
            <div className="edu-card p-5 space-y-3">
              <h3 className="font-serif font-semibold text-base">Контакты</h3>

              {inst.address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[var(--color-brand-gold)] mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">{inst.address}</p>
                </div>
              )}

              {inst.phone && (
                <a href={`tel:${inst.phone}`} className="flex items-center gap-2.5 group">
                  <Phone className="w-4 h-4 text-[var(--color-brand-gold)] shrink-0" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{inst.phone}</span>
                </a>
              )}

              {inst.email && (
                <a href={`mailto:${inst.email}`} className="flex items-center gap-2.5 group">
                  <Mail className="w-4 h-4 text-[var(--color-brand-gold)] shrink-0" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">{inst.email}</span>
                </a>
              )}

              {inst.website && (
                <a href={inst.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 group">
                  <Globe className="w-4 h-4 text-[var(--color-brand-gold)] shrink-0" />
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate">
                    {inst.website.replace(/^https?:\/\//, "")}
                  </span>
                </a>
              )}

              {/* Social links */}
              {(inst.socialVk || inst.socialTelegram || inst.socialInstagram) && (
                <div className="flex items-center gap-2 pt-1">
                  {inst.socialVk && (
                    <a href={inst.socialVk} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-[var(--color-brand-navy)]/8 flex items-center justify-center hover:bg-[var(--color-brand-navy)]/15 transition-colors">
                      <svg className="w-4 h-4 text-[var(--color-brand-navy)]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.864 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.253-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.491-.085.745-.576.745z" />
                      </svg>
                    </a>
                  )}
                  {inst.socialTelegram && (
                    <a href={inst.socialTelegram} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-[var(--color-brand-navy)]/8 flex items-center justify-center hover:bg-[var(--color-brand-navy)]/15 transition-colors">
                      <svg className="w-4 h-4 text-[var(--color-brand-navy)]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.932z" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Editor actions */}
            {(isEditorOrAdmin || isRepresentative) && (
              <div className="edu-card p-4">
                <h3 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">Управление</h3>
                {isRepresentative ? (
                  <Link href="/representative">
                    <Button size="sm" variant="outline" className="w-full">
                      Редактировать карточку
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/editor/institutions/${inst.id}`}>
                    <Button size="sm" variant="outline" className="w-full">
                      Редактировать карточку
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
