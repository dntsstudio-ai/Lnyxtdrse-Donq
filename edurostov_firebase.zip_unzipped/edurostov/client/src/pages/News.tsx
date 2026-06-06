import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { BookOpen, Calendar, ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function News() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.news.list.useQuery({ page, limit: 9 });
  const articles = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 9);

  return (
    <PageLayout>
      {/* Header */}
      <div className="bg-[var(--color-brand-navy)] text-white py-12">
        <div className="container">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-[var(--color-brand-gold)]" />
            <span className="text-sm font-medium text-[var(--color-brand-gold)] uppercase tracking-wider">Новости</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold">
            Новости образования
          </h1>
          <p className="text-white/60 mt-2 text-sm">
            Актуальные события в сфере образования Ростовской области
          </p>
        </div>
      </div>

      <div className="container py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : articles.length > 0 ? (
          <>
            {/* Featured first article */}
            {page === 1 && articles[0] && (
              <Link href={`/news/${articles[0].slug}`}>
                <article className="edu-card group cursor-pointer mb-8 overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {articles[0].coverImageUrl ? (
                      <div className="h-64 md:h-auto overflow-hidden">
                        <img
                          src={articles[0].coverImageUrl}
                          alt={articles[0].title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="h-64 md:h-auto bg-gradient-to-br from-[var(--color-brand-navy)]/10 to-[var(--color-brand-gold)]/10 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-[var(--color-brand-navy)]/20" />
                      </div>
                    )}
                    <div className="p-8 flex flex-col justify-center">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="px-2 py-0.5 rounded-full bg-[var(--color-brand-gold)]/15 text-[var(--color-brand-gold)] font-medium">
                          Главное
                        </span>
                        {articles[0].publishedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(articles[0].publishedAt).toLocaleDateString("ru-RU", {
                              day: "numeric", month: "long", year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                      <h2 className="font-serif text-2xl font-semibold leading-snug group-hover:text-[var(--color-brand-navy)] transition-colors mb-3">
                        {articles[0].title}
                      </h2>
                      {articles[0].excerpt && (
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                          {articles[0].excerpt}
                        </p>
                      )}
                      <div className="mt-4 flex items-center gap-1.5 text-[var(--color-brand-navy)] text-sm font-medium">
                        Читать далее <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            )}

            {/* Rest of articles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(page === 1 ? articles.slice(1) : articles).map((article) => (
                <Link key={article.id} href={`/news/${article.slug}`}>
                  <article className="edu-card group cursor-pointer h-full flex flex-col">
                    {article.coverImageUrl ? (
                      <div className="h-44 overflow-hidden">
                        <img
                          src={article.coverImageUrl}
                          alt={article.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="h-44 bg-gradient-to-br from-[var(--color-brand-navy)]/5 to-[var(--color-brand-gold)]/8 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-[var(--color-brand-navy)]/20" />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        {article.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(article.publishedAt).toLocaleDateString("ru-RU", {
                              day: "numeric", month: "short",
                            })}
                          </span>
                        )}

                      </div>
                      <h3 className="font-serif font-semibold text-base leading-snug group-hover:text-[var(--color-brand-navy)] transition-colors line-clamp-2 mb-2 flex-1">
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Назад
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Вперёд
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <BookOpen className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-serif text-xl font-semibold mb-2">Новостей пока нет</h3>
            <p className="text-muted-foreground text-sm">Следите за обновлениями</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
