import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BookOpen, Calendar, Share2 } from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: article, isLoading } = trpc.news.getBySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Ссылка скопирована");
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container py-10 max-w-3xl">
          <Skeleton className="h-64 rounded-2xl mb-6" />
          <Skeleton className="h-8 w-3/4 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </PageLayout>
    );
  }

  if (!article) {
    return (
      <PageLayout>
        <div className="container py-20 text-center">
          <BookOpen className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="font-serif text-2xl font-semibold mb-2">Статья не найдена</h2>
          <Link href="/news">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться к новостям
            </Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      {/* Breadcrumb */}
      <div className="bg-[var(--color-brand-warm)] border-b border-border">
        <div className="container py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Главная</Link>
            <span>/</span>
            <Link href="/news" className="hover:text-foreground transition-colors">Новости</Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-48">{article.title}</span>
          </div>
        </div>
      </div>

      <div className="container py-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              {article.publishedAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--color-brand-gold)]" />
                  {new Date(article.publishedAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
              <button
                onClick={handleShare}
                className="ml-auto flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Поделиться
              </button>
            </div>

            <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight text-foreground mb-4 text-balance">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-lg text-muted-foreground leading-relaxed border-l-4 border-[var(--color-brand-gold)] pl-4">
                {article.excerpt}
              </p>
            )}
          </div>

          {/* Cover Image */}
          {article.coverImageUrl && (
            <div className="rounded-2xl overflow-hidden mb-8" style={{ aspectRatio: "16/9" }}>
              <img
                src={article.coverImageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          {article.content && (
            <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
              {article.content}
            </div>
          )}

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-border flex items-center justify-between">
            <Link href="/news">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Все новости
              </Button>
            </Link>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Поделиться
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
