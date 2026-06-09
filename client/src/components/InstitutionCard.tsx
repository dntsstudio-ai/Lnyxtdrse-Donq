import { cn } from "@/lib/utils";
import { BookOpen, Building2, Eye, MapPin, Star } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "./ui/badge";

const TYPE_LABELS: Record<string, string> = {
  university: "Университет",
  college: "Колледж",
  institute: "Институт",
  academy: "Академия",
  school: "Школа",
  other: "Учреждение",
};

const TYPE_COLORS: Record<string, string> = {
  university: "bg-blue-50 text-blue-700 border-blue-100",
  college: "bg-emerald-50 text-emerald-700 border-emerald-100",
  institute: "bg-purple-50 text-purple-700 border-purple-100",
  academy: "bg-amber-50 text-amber-700 border-amber-100",
  school: "bg-rose-50 text-rose-700 border-rose-100",
  other: "bg-gray-50 text-gray-600 border-gray-100",
};

interface InstitutionCardProps {
  id: number;
  slug: string;
  name: string;
  type: string;
  city: string;
  region?: string | null;
  shortDescription?: string | null;
  coverImageUrl?: string | null;
  logoUrl?: string | null;
  viewCount?: number;
  avgRating?: number;
  promotionBadge?: string | null;
  isFeatured?: boolean;
  className?: string;
  compact?: boolean;
}

export default function InstitutionCard({
  id,
  slug,
  name,
  type,
  city,
  region,
  shortDescription,
  coverImageUrl,
  logoUrl,
  viewCount = 0,
  avgRating,
  promotionBadge,
  isFeatured,
  className,
  compact = false,
}: InstitutionCardProps) {
  return (
    <Link href={slug && slug.length > 1 && /[a-z0-9]/.test(slug) ? `/institution/${slug}` : `/institution/id/${id}`}>
      <article
        className={cn(
          "edu-card group cursor-pointer flex flex-col h-full",
          className
        )}
      >
        {/* Cover Image */}
        <div className={cn("relative overflow-hidden bg-muted shrink-0", compact ? "h-36" : "h-48")}>
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-brand-navy)]/5 to-[var(--color-brand-gold)]/10">
              <Building2 className="w-12 h-12 text-[var(--color-brand-navy)]/20" />
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {isFeatured && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-brand-gold)] text-white shadow-sm">
                <Star className="w-2.5 h-2.5" />
                Топ
              </span>
            )}
            {promotionBadge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-brand-navy)] text-white shadow-sm">
                {promotionBadge}
              </span>
            )}
          </div>

          {/* Logo overlay */}
          {logoUrl && (
            <div className="absolute bottom-3 right-3 w-10 h-10 rounded-lg bg-white shadow-md overflow-hidden border border-border/50">
              <img src={logoUrl} alt={`Логотип ${name}`} className="w-full h-full object-contain p-1" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 p-4 flex-1">
          {/* Location + Type */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
              <MapPin className="w-3 h-3 shrink-0 text-[var(--color-brand-gold)]" />
              <span className="truncate">{city}{region && region !== city ? `, ${region}` : ""}</span>
            </div>
            <span
              className={cn(
                "shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                TYPE_COLORS[type] ?? TYPE_COLORS.other
              )}
            >
              {TYPE_LABELS[type] ?? type}
            </span>
          </div>

          {/* Name */}
          <h3 className="font-serif font-semibold text-base text-foreground leading-snug group-hover:text-[var(--color-brand-navy)] transition-colors line-clamp-2">
            {name}
          </h3>

          {/* Description */}
          {shortDescription && !compact && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
              {shortDescription}
            </p>
          )}

          {/* Footer stats */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />
              <span>{viewCount.toLocaleString("ru-RU")}</span>
            </div>
            {avgRating !== undefined && avgRating > 0 && (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                <span className="font-medium">{avgRating.toFixed(1)}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-[var(--color-brand-navy)] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <BookOpen className="w-3 h-3" />
              <span>Подробнее</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
