import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useFirebaseAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft, BookOpen, Calendar, Share2, Heart, MessageCircle, Send, Trash2,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();
  const { openAuthModal } = useFirebaseAuth();
  const utils = trpc.useUtils();
  const [commentText, setCommentText] = useState("");

  const { data: article, isLoading } = trpc.news.getBySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  const { data: likeStatus } = trpc.newsLikes.status.useQuery(
    { newsId: article?.id ?? 0 },
    { enabled: !!article?.id }
  );

  const { data: comments } = trpc.newsComments.list.useQuery(
    { newsId: article?.id ?? 0 },
    { enabled: !!article?.id }
  );

  const toggleLike = trpc.newsLikes.toggle.useMutation({
    onSuccess: () => utils.newsLikes.status.invalidate({ newsId: article?.id }),
  });

  const createComment = trpc.newsComments.create.useMutation({
    onSuccess: () => {
      setCommentText("");
      utils.newsComments.list.invalidate({ newsId: article?.id });
      toast.success("Комментарий добавлен");
    },
  });

  const deleteComment = trpc.newsComments.delete.useMutation({
    onSuccess: () => utils.newsComments.list.invalidate({ newsId: article?.id }),
  });

  const handleLike = () => {
    if (!isAuthenticated) { openAuthModal(); return; }
    toggleLike.mutate({ newsId: article!.id });
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { openAuthModal(); return; }
    if (!commentText.trim()) return;
    createComment.mutate({ newsId: article!.id, text: commentText.trim() });
  };

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

  const canDeleteComment = user?.role === "admin" || user?.role === "editor";

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
                    day: "numeric", month: "long", year: "numeric",
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
              <img src={article.coverImageUrl} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Content */}
          {article.content && (
            <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap mb-8">
              {article.content}
            </div>
          )}

          {/* Like & share bar */}
          <div className="flex items-center gap-4 py-5 border-y border-border mb-8">
            <button
              onClick={handleLike}
              disabled={toggleLike.isPending}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors rounded-full px-4 py-2",
                likeStatus?.liked
                  ? "bg-red-50 text-red-500 hover:bg-red-100"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Heart className={cn("w-4 h-4 transition-all", likeStatus?.liked && "fill-red-500")} />
              {likeStatus?.count ?? 0}
              {likeStatus?.liked ? " Нравится" : " Нравится"}
            </button>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="w-4 h-4" />
              {comments?.length ?? 0} комментариев
            </span>
            <button
              onClick={handleShare}
              className="ml-auto flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Поделиться
            </button>
          </div>

          {/* Comments */}
          <div className="mb-8">
            <h3 className="font-serif text-xl font-semibold mb-5">
              Комментарии {comments?.length ? `(${comments.length})` : ""}
            </h3>

            {/* Comment form */}
            <form onSubmit={handleComment} className="mb-6">
              <div className="flex gap-3">
                <Avatar className="w-9 h-9 shrink-0 mt-1">
                  <AvatarFallback className="text-xs bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)]">
                    {user?.name?.[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder={isAuthenticated ? "Написать комментарий..." : "Войдите, чтобы оставить комментарий"}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onFocus={() => { if (!isAuthenticated) openAuthModal(); }}
                    className="min-h-[80px] resize-none"
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{commentText.length}/1000</span>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!commentText.trim() || createComment.isPending}
                      className="bg-[var(--color-brand-navy)] text-white"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Отправить
                    </Button>
                  </div>
                </div>
              </div>
            </form>

            {/* Comment list */}
            {comments && comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3 group">
                    <Avatar className="w-9 h-9 shrink-0">
                      {c.author?.avatar ? (
                        <img src={c.author.avatar} alt={c.author.name ?? ""} className="rounded-full object-cover" />
                      ) : (
                        <AvatarFallback className="text-xs bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)]">
                          {c.author?.name?.[0]?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{c.author?.name ?? "Пользователь"}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleDateString("ru-RU", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                        {canDeleteComment && (
                          <button
                            onClick={() => deleteComment.mutate({ id: c.id, newsId: article.id })}
                            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Будьте первым, кто оставит комментарий</p>
              </div>
            )}
          </div>

          {/* Footer nav */}
          <div className="pt-6 border-t border-border flex items-center justify-between">
            <Link href="/news">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Все новости
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
