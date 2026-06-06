import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Home, Search } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <PageLayout>
      <div className="container py-24 text-center max-w-xl mx-auto">
        <div className="relative inline-flex mb-8">
          <span className="font-serif text-[10rem] font-bold leading-none text-[var(--color-brand-navy)]/6 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-[var(--color-brand-navy)]/8 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-[var(--color-brand-navy)]" />
            </div>
          </div>
        </div>

        <h1 className="font-serif text-3xl font-bold mb-3">Страница не найдена</h1>
        <p className="text-muted-foreground text-base mb-8 leading-relaxed">
          Возможно, страница была удалена или вы перешли по неверной ссылке.
          Попробуйте вернуться на главную или воспользоваться поиском.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            className="bg-[var(--color-brand-navy)] text-white"
            onClick={() => navigate("/")}
          >
            <Home className="w-4 h-4 mr-2" />
            На главную
          </Button>
          <Button variant="outline" onClick={() => navigate("/catalog")}>
            <Search className="w-4 h-4 mr-2" />
            Каталог учреждений
          </Button>
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
