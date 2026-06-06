import InstitutionCard from "@/components/InstitutionCard";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Building2, ChevronLeft, ChevronRight, Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

const INSTITUTION_TYPES = [
  { value: "all", label: "Все типы" },
  { value: "university", label: "Университет" },
  { value: "college", label: "Колледж" },
  { value: "institute", label: "Институт" },
  { value: "academy", label: "Академия" },
  { value: "school", label: "Школа" },
  { value: "other", label: "Другое" },
];

const SORT_OPTIONS = [
  { value: "views", label: "По популярности" },
  { value: "newest", label: "Сначала новые" },
  { value: "name", label: "По алфавиту" },
];

const COST_OPTIONS = [
  { value: "all", label: "Любая стоимость" },
  { value: "free", label: "Бесплатно" },
  { value: "paid", label: "Платно" },
];

export default function Catalog() {
  const [location] = useLocation();
  const params = useMemo(() => new URLSearchParams(location.split("?")[1] ?? ""), [location]);

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [searchInput, setSearchInput] = useState(params.get("search") ?? "");
  const [selectedCity, setSelectedCity] = useState(params.get("city") ?? "");
  const [selectedType, setSelectedType] = useState(params.get("type") ?? "all");
  const [selectedCost, setSelectedCost] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "views" | "newest">(
    (params.get("sortBy") as "name" | "views" | "newest") ?? "views"
  );
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: citiesData } = trpc.institutions.getCities.useQuery();
  const cities = citiesData ?? [];

  const { data, isLoading } = trpc.institutions.list.useQuery({
    search: search || undefined,
    city: selectedCity || undefined,
    type: selectedType !== "all" ? (selectedType as any) : undefined,
    cost: selectedCost !== "all" ? selectedCost : undefined,
    status: "published",
    page,
    limit: 12,
    sortBy,
  });

  const institutions = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 12);

  const hasActiveFilters = search || selectedCity || selectedType !== "all" || selectedCost !== "all";

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setSelectedCity("");
    setSelectedType("all");
    setSelectedCost("all");
    setPage(1);
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <PageLayout>
      {/* Header */}
      <div className="bg-[var(--color-brand-navy)] text-white py-12">
        <div className="container">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-2">
            Каталог учреждений
          </h1>
          <p className="text-white/60 text-sm">
            {total > 0 ? `Найдено ${total} учреждений` : "Поиск по базе учреждений Ростовской области"}
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Search + Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию, городу, специальности..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 h-10"
            />
          </div>
          <Button onClick={handleSearch} className="bg-[var(--color-brand-navy)] text-white h-10 px-5">
            <Search className="w-4 h-4 mr-2" />
            Найти
          </Button>
          <Button
            variant="outline"
            className="h-10 gap-2"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Фильтры
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[var(--color-brand-gold)]" />
            )}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-[var(--color-brand-warm)] border border-border rounded-xl p-5 mb-6 animate-slide-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                  Город
                </label>
                <Select value={selectedCity || "all"} onValueChange={(v) => { setSelectedCity(v === "all" ? "" : v); setPage(1); }}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Все города" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все города</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                  Тип учреждения
                </label>
                <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setPage(1); }}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTITUTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                  Стоимость
                </label>
                <Select value={selectedCost} onValueChange={(v) => { setSelectedCost(v); setPage(1); }}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COST_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                  Сортировка
                </label>
                <Select value={sortBy} onValueChange={(v) => { setSortBy(v as any); setPage(1); }}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Сбросить все фильтры
              </button>
            )}
          </div>
        )}

        {/* Active filter tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-5">
            {search && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-brand-navy)]/8 text-[var(--color-brand-navy)] text-xs font-medium">
                Поиск: {search}
                <button onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCity && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-brand-navy)]/8 text-[var(--color-brand-navy)] text-xs font-medium">
                {selectedCity}
                <button onClick={() => { setSelectedCity(""); setPage(1); }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedType !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-brand-navy)]/8 text-[var(--color-brand-navy)] text-xs font-medium">
                {INSTITUTION_TYPES.find((t) => t.value === selectedType)?.label}
                <button onClick={() => { setSelectedType("all"); setPage(1); }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : institutions.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Показано {(page - 1) * 12 + 1}–{Math.min(page * 12, total)} из {total}
              </p>
              <div className="hidden sm:block">
                <Select value={sortBy} onValueChange={(v) => { setSortBy(v as any); setPage(1); }}>
                  <SelectTrigger className="h-8 text-xs w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {institutions.map((inst) => (
                <InstitutionCard key={inst.id} {...inst} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gap-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Назад
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) pageNum = i + 1;
                    else if (page <= 4) pageNum = i + 1;
                    else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
                    else pageNum = page - 3 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                          page === pageNum
                            ? "bg-[var(--color-brand-navy)] text-white"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="gap-1.5"
                >
                  Вперёд
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <Building2 className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-serif text-xl font-semibold mb-2">Ничего не найдено</h3>
            <p className="text-muted-foreground text-sm mb-5">
              Попробуйте изменить параметры поиска или сбросить фильтры
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Сбросить фильтры
              </Button>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
