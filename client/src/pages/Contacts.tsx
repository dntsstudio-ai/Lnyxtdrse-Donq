import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, Mail, MapPin, MessageSquare, Phone, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Contacts() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const sendContact = trpc.contacts.send.useMutation({
    onSuccess: () => {
      setSent(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      toast.success("Сообщение отправлено!");
    },
    onError: (err) => {
      toast.error("Ошибка отправки. Попробуйте позже.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Заполните обязательные поля");
      return;
    }
    sendContact.mutate({ name, email, subject, message });
  };

  return (
    <PageLayout>
      {/* Header */}
      <div className="bg-[var(--color-brand-navy)] text-white py-12">
        <div className="container">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-[var(--color-brand-gold)]" />
            <span className="text-sm font-medium text-[var(--color-brand-gold)] uppercase tracking-wider">Контакты</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold">Свяжитесь с нами</h1>
          <p className="text-white/60 mt-2 text-sm">Мы рады ответить на ваши вопросы</p>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Contact Info */}
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-xl font-semibold mb-4">О платформе</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                EduRostov — региональный агрегатор образовательных учреждений Ростовской области. Мы помогаем абитуриентам и студентам найти подходящее учебное заведение.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-brand-navy)]/8 flex items-center justify-center shrink-0">
                  <MapPin className="w-4.5 h-4.5 text-[var(--color-brand-navy)]" />
                </div>
                <div>
                  <p className="text-sm font-medium">Адрес</p>
                  <p className="text-sm text-muted-foreground">Ростов-на-Дону, Ростовская область</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--color-brand-navy)]/8 flex items-center justify-center shrink-0">
                  <Mail className="w-4.5 h-4.5 text-[var(--color-brand-navy)]" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a href="mailto:info@edurostov.ru" className="text-sm text-muted-foreground hover:text-[var(--color-brand-navy)] transition-colors">
                    info@edurostov.ru
                  </a>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--color-brand-gold)]/8 border border-[var(--color-brand-gold)]/20">
              <p className="text-sm font-medium text-[var(--color-brand-navy)] mb-1">Хотите добавить учреждение?</p>
              <p className="text-xs text-muted-foreground">
                Напишите нам — мы разберёмся и добавим учреждение в базу бесплатно в течение 3 рабочих дней.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="edu-card p-8">
              {sent ? (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-14 h-14 mx-auto mb-4 text-green-500" />
                  <h3 className="font-serif text-xl font-semibold mb-2">Сообщение отправлено!</h3>
                  <p className="text-muted-foreground text-sm mb-5">
                    Мы ответим вам в течение 1–2 рабочих дней
                  </p>
                  <Button variant="outline" onClick={() => setSent(false)}>
                    Отправить ещё одно сообщение
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2 className="font-serif text-xl font-semibold mb-1">Форма обратной связи</h2>
                  <p className="text-sm text-muted-foreground mb-5">
                    Заполните форму, и мы свяжемся с вами как можно скорее
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                        Ваше имя <span className="text-destructive">*</span>
                      </label>
                      <Input
                        placeholder="Иван Иванов"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                        Email <span className="text-destructive">*</span>
                      </label>
                      <Input
                        type="email"
                        placeholder="ivan@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                      Тема
                    </label>
                    <Input
                      placeholder="Добавление учреждения / Вопрос / Предложение"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wide">
                      Сообщение <span className="text-destructive">*</span>
                    </label>
                    <Textarea
                      placeholder="Опишите ваш вопрос или предложение подробно..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      required
                      className="resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="bg-[var(--color-brand-navy)] text-white w-full"
                    disabled={sendContact.isPending}
                  >
                    {sendContact.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Отправка...</>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" />Отправить сообщение</>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
