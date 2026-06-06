import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import InstitutionCard from "@/components/InstitutionCard";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  BookOpen,
  Building2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MapPin,
  Search,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

const ROSTOV_CITIES = [
  "Ростов-на-Дону",
  "Таганрог",
  "Новочеркасск",
  "Шахты",
  "Волгодонск",
  "Батайск",
  "Новошахтинск",
  "Каменск-Шахтинский",
  "Аксай",
  "Азов",
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Track page view
  const trackView = trpc.stats.trackPageView.useMutation();
  useEffect(() => {
    trackView.mutate();
  }, []);

  // Data queries
  const { data: featuredData, isLoading: featuredLoading } = trpc.institutions.getFeatured.useQuery();
  const { data: topData, isLoading: topLoading } = trpc.institutions.getTop.useQuery({ limit: 5 });
  const { data: cityFilterData, isLoading: cityLoading } = trpc.institutions.list.useQuery(
    { city: selectedCity ?? undefined, status: "published", limit: 6, sortBy: "views" },
    { enabled: !!selectedCity }
  );
  const { data: statsData } = trpc.stats.getSiteStats.useQuery(undefined, {
    enabled: false, // Public stats from top query
  });
  const { data: citiesData } = trpc.institutions.getCities.useQuery();
  const { data: newsData } = trpc.news.list.useQuery({ page: 1, limit: 3 });

  const featured = featuredData ?? [];
  const top5 = topData ?? [];
  const cityResults = cityFilterData?.items ?? [];
  const latestNews = newsData?.items ?? [];

  // Carousel logic
  const carouselItems = featured.length > 0 ? featured : top5;
  const maxIndex = Math.max(0, carouselItems.length - 1);

  const prevSlide = () => setCarouselIndex((i) => Math.max(0, i - 1));
  const nextSlide = () => setCarouselIndex((i) => Math.min(maxIndex, i + 1));

  return (
    <PageLayout>
      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[var(--color-brand-navy)] text-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[var(--color-brand-gold)]/8 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-blue-500/8 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--color-brand-gold)]/4 blur-3xl" />
        </div>

        <div className="container relative py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-brand-gold)]/15 border border-[var(--color-brand-gold)]/25 text-[var(--color-brand-gold)] text-sm font-medium mb-6">
              <MapPin className="w-3.5 h-3.5" />
              Ростовская область
            </div>

            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-5 text-balance">
              Найдите своё{" "}
              <span className="text-gradient-gold">образовательное</span>{" "}
              учреждение
            </h1>

            <p className="text-lg text-white/65 leading-relaxed mb-8 max-w-xl mx-auto">
              Полная база колледжей, вузов и институтов Ростовской области. Персональные рекомендации, отзывы студентов и подробная информация о каждом учреждении.
            </p>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Название, специальность, город..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-gold)]/50 focus:border-[var(--color-brand-gold)]/50 transition-all text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) navigate(`/catalog?search=${encodeURIComponent(val)}`);
                    }
                  }}
                />
              </div>
              <Button
                className="bg-[var(--color-brand-gold)] hover:bg-[var(--color-brand-gold-light)] text-[var(--color-brand-navy)] font-semibold px-6 rounded-xl"
                onClick={() => navigate("/catalog")}
              >
                Найти
              </Button>
            </div>

            {/* Quick stats */}
            <div className="flex items-center justify-center gap-6 mt-10 flex-wrap">
              {[
                { icon: Building2, label: "учреждений", value: "50+" },
                { icon: MapPin, label: "городов", value: "15+" },
                { icon: Users, label: "пользователей", value: "1000+" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2 text-white/60">
                  <Icon className="w-4 h-4 text-[var(--color-brand-gold)]" />
                  <span className="font-semibold text-white">{value}</span>
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-[var(--color-background)]"
          style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
      </section>

      {/* ─── City Filter ──────────────────────────────────────────────────── */}
      <section className="py-8 bg-[var(--color-brand-warm)] border-b border-border">
        <div className="container">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-sm font-medium text-muted-foreground shrink-0">Город:</span>
            <button
              onClick={() => setSelectedCity(null)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                !selectedCity
                  ? "bg-[var(--color-brand-navy)] text-white shadow-sm"
                  : "bg-white text-muted-foreground border border-border hover:border-[var(--color-brand-navy)]/30 hover:text-foreground"
              }`}
            >
              Все города
            </button>
            {ROSTOV_CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city === selectedCity ? null : city)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                  selectedCity === city
                    ? "bg-[var(--color-brand-navy)] text-white shadow-sm"
                    : "bg-white text-muted-foreground border border-border hover:border-[var(--color-brand-navy)]/30 hover:text-foreground"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── City Results ─────────────────────────────────────────────────── */}
      {selectedCity && (
        <section className="py-10 bg-[var(--color-brand-warm)]">
          <div className="container">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl font-semibold text-foreground">
                Учреждения в городе{" "}
                <span className="text-[var(--color-brand-navy)]">{selectedCity}</span>
              </h2>
              <Link href={`/catalog?city=${encodeURIComponent(selectedCity)}`}>
                <Button variant="ghost" size="sm" className="text-[var(--color-brand-navy)] font-medium">
                  Все <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            {cityLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-72 rounded-xl" />
                ))}
              </div>
            ) : cityResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {cityResults.map((inst) => (
                  <InstitutionCard key={inst.id} {...inst} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>В городе {selectedCity} пока нет учреждений</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Top 5 Section ────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-[var(--color-brand-gold)] fill-[var(--color-brand-gold)]" />
                <span className="text-sm font-medium text-[var(--color-brand-gold)] uppercase tracking-wider">
                  Популярные
                </span>
              </div>
              <h2 className="font-serif text-3xl font-semibold text-foreground">
                Топ учреждений
              </h2>
              <p className="text-muted-foreground mt-1.5 text-sm">Часто просматривают на платформе</p>
            </div>
            <Link href="/catalog?sortBy=views">
              <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5">
                Смотреть все <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {topLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {top5.map((inst, idx) => (
                <div key={inst.id} className="relative">
                  {idx < 3 && (
                    <div className="absolute -top-2 -left-2 z-10 w-7 h-7 rounded-full bg-[var(--color-brand-navy)] text-white text-xs font-bold flex items-center justify-center shadow-md">
                      {idx + 1}
                    </div>
                  )}
                  <InstitutionCard {...inst} compact />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Personalized Recommendations CTA ────────────────────────────── */}
      {!isAuthenticated && (
        <section className="py-14 bg-gradient-to-br from-[var(--color-brand-navy)] to-[oklch(28%_0.08_250)]">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center text-white">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-brand-gold)]/20 flex items-center justify-center mx-auto mb-5">
                <Sparkles className="w-7 h-7 text-[var(--color-brand-gold)]" />
              </div>
              <h2 className="font-serif text-3xl font-semibold mb-3">
                Персональный подбор учреждения
              </h2>
              <p className="text-white/65 leading-relaxed mb-7">
                Зарегистрируйтесь, заполните анкету предпочтений — и наш ИИ подберёт учебные заведения именно для вас с подробным объяснением каждой рекомендации.
              </p>
              <Button
                size="lg"
                className="bg-[var(--color-brand-gold)] hover:bg-[var(--color-brand-gold-light)] text-[var(--color-brand-navy)] font-semibold px-8"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                <GraduationCap className="w-4.5 h-4.5 mr-2" />
                Зарегистрироваться бесплатно
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ─── Featured Carousel (for logged-in users) ──────────────────────── */}
      {isAuthenticated && featured.length > 0 && (
        <section className="py-14 bg-[var(--color-brand-warm)]">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[var(--color-brand-gold)]" />
                  <span className="text-sm font-medium text-[var(--color-brand-gold)] uppercase tracking-wider">
                    Рекомендуем
                  </span>
                </div>
                <h2 className="font-serif text-3xl font-semibold">Избранные учреждения</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  disabled={carouselIndex === 0}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextSlide}
                  disabled={carouselIndex === maxIndex}
                  className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-hidden" ref={carouselRef}>
              <div
                className="flex gap-5 transition-transform duration-400"
                style={{ transform: `translateX(calc(-${carouselIndex} * (100% / 3 + 20px / 3)))` }}
              >
                {carouselItems.map((inst) => (
                  <div key={inst.id} className="min-w-[calc(33.333%-14px)] shrink-0">
                    <InstitutionCard {...inst} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center gap-1.5 mt-5">
              {carouselItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === carouselIndex
                      ? "w-6 bg-[var(--color-brand-navy)]"
                      : "w-1.5 bg-[var(--color-brand-navy)]/25"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Latest News ──────────────────────────────────────────────────── */}
      {latestNews.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-[var(--color-brand-gold)]" />
                  <span className="text-sm font-medium text-[var(--color-brand-gold)] uppercase tracking-wider">
                    Актуально
                  </span>
                </div>
                <h2 className="font-serif text-3xl font-semibold">Последние новости</h2>
              </div>
              <Link href="/news">
                <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5">
                  Все новости <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestNews.map((article) => (
                <Link key={article.id} href={`/news/${article.slug}`}>
                  <article className="edu-card group cursor-pointer">
                    {article.coverImageUrl && (
                      <div className="h-44 overflow-hidden">
                        <img
                          src={article.coverImageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <p className="text-xs text-muted-foreground mb-2">
                        {article.publishedAt
                          ? new Date(article.publishedAt).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : ""}
                      </p>
                      <h3 className="font-serif font-semibold text-base leading-snug group-hover:text-[var(--color-brand-navy)] transition-colors line-clamp-2 mb-2">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA Banner ───────────────────────────────────────────────────── */}
      <section className="py-12 bg-[var(--color-brand-warm)] border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl bg-white border border-border shadow-sm">
            <div>
              <h3 className="font-serif text-xl font-semibold mb-1">
                Не нашли своё учреждение?
              </h3>
              <p className="text-muted-foreground text-sm">
                Напишите нам — и мы разберёмся. Добавим учреждение в базу бесплатно.
              </p>
            </div>
            <Link href="/contacts">
              <Button className="bg-[var(--color-brand-navy)] text-white hover:bg-[var(--color-brand-navy-light)] shrink-0">
                Написать нам
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
