import { useState } from "react";
import { Link } from "wouter";
import { GraduationCap, Mail, MapPin, X, Save, Send, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function LegalModal({
  type,
  open,
  onClose,
}: {
  type: "privacy" | "terms";
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();

  const { data } = trpc.legal.get.useQuery({ id: type }, { enabled: open });
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState("");

  const saveDraft = trpc.legal.saveDraft.useMutation({
    onSuccess: () => {
      toast.success("Черновик сохранён");
      utils.legal.get.invalidate({ id: type });
    },
  });
  const publish = trpc.legal.publish.useMutation({
    onSuccess: () => {
      toast.success("Опубликовано");
      setEditMode(false);
      utils.legal.get.invalidate({ id: type });
    },
  });

  const handleEdit = () => {
    setDraft(data?.content ?? "");
    setEditMode(true);
  };
  const handleSave = () => saveDraft.mutate({ id: type, content: draft });
  const handlePublish = () => publish.mutate({ id: type });
  const handleCancel = () => setEditMode(false);

  const title = type === "privacy" ? "Политика конфиденциальности" : "Пользовательское соглашение";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setEditMode(false); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {editMode ? (
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-[400px] font-mono text-sm resize-none"
            />
          ) : (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
              {data?.publishedContent ?? "Загрузка..."}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-4 border-t border-border">
          {isAdmin && !editMode && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              Редактировать
            </Button>
          )}
          {isAdmin && editMode && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Отмена
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={saveDraft.isPending}
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Сохранить черновик
              </Button>
              <Button
                size="sm"
                className="bg-[var(--color-brand-navy)] text-white"
                onClick={handlePublish}
                disabled={publish.isPending}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Опубликовать
              </Button>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="ml-auto">
            <X className="w-4 h-4 mr-1.5" />
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Footer() {
  const [legalModal, setLegalModal] = useState<"privacy" | "terms" | null>(null);

  return (
    <footer className="bg-[var(--color-brand-navy)] text-white/80 mt-auto">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-gold)]/20 flex items-center justify-center">
                <GraduationCap className="w-4.5 h-4.5 text-[var(--color-brand-gold)]" />
              </div>
              <span className="font-serif font-semibold text-lg text-white tracking-tight">
                ЭдуДон
              </span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Региональный агрегатор образовательных учреждений Ростовской области. Найдите своё учебное заведение.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Навигация</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/", label: "Главная" },
                { href: "/catalog", label: "Каталог учреждений" },
                { href: "/news", label: "Новости" },
                { href: "/contacts", label: "Контакты" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-[var(--color-brand-gold)] transition-colors duration-150">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Пользователям</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/profile", label: "Личный кабинет" },
                { href: "/profile/recommendations", label: "Рекомендации" },
                { href: "/profile/bookmarks", label: "Сохранённые" },
                { href: "/contacts", label: "Добавить учреждение" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-[var(--color-brand-gold)] transition-colors duration-150">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={() => setLegalModal("privacy")}
                  className="text-sm text-white/60 hover:text-[var(--color-brand-gold)] transition-colors duration-150 text-left"
                >
                  Политика конфиденциальности
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLegalModal("terms")}
                  className="text-sm text-white/60 hover:text-[var(--color-brand-gold)] transition-colors duration-150 text-left"
                >
                  Пользовательское соглашение
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Контакты</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[var(--color-brand-gold)] mt-0.5 shrink-0" />
                <span className="text-sm text-white/60">Ростов-на-Дону, Ростовская область</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[var(--color-brand-gold)] shrink-0" />
                <a href="mailto:info@edudon.ru" className="text-sm text-white/60 hover:text-[var(--color-brand-gold)] transition-colors">
                  info@edudon.ru
                </a>
              </li>
            </ul>
            <div className="flex items-center gap-3 mt-5">
              <a href="https://t.me/edudon" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[var(--color-brand-gold)]/20 transition-colors duration-150" aria-label="Telegram">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.932z" />
                </svg>
              </a>
              <a href="https://vk.com/edudon" target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-[var(--color-brand-gold)]/20 transition-colors duration-150" aria-label="ВКонтакте">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.864 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.253-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.491-.085.745-.576.745z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} ЭдуДон. Все права защищены.
          </p>
          <p className="text-xs text-white/40">
            Домен: <span className="text-white/60">edudon.ru</span>
          </p>
        </div>
      </div>

      {legalModal && (
        <LegalModal
          type={legalModal}
          open={!!legalModal}
          onClose={() => setLegalModal(null)}
        />
      )}
    </footer>
  );
}
