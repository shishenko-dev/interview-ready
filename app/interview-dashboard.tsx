'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  FileText,
  Gauge,
  LayoutDashboard,
  Link2,
  Loader2,
  MessageSquareText,
  Mic2,
  Plus,
  Search,
  Sparkles,
  Target,
  TimerReset,
  TrendingUp,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type {
  DashboardData,
  PracticeEvaluation,
  Story,
  Vacancy,
} from '@/lib/types';

type View = 'today' | 'vacancies' | 'stories' | 'trainer' | 'analyses';

const emptyData: DashboardData = {
  vacancies: [],
  stories: [],
  practiceSessions: [],
  stats: {
    activeVacancies: 0,
    stories: 0,
    practiceSessions: 0,
    averagePracticeScore: 0,
  },
};

const navigation: { id: View; label: string; icon: typeof Target }[] = [
  { id: 'today', label: 'Сегодня', icon: LayoutDashboard },
  { id: 'vacancies', label: 'Вакансии', icon: BriefcaseBusiness },
  { id: 'stories', label: 'Мои истории', icon: BookOpenCheck },
  { id: 'trainer', label: 'Тренажёр', icon: Mic2 },
  { id: 'analyses', label: 'Разборы', icon: MessageSquareText },
];

function statusTone(stage: string) {
  if (/готов|созвон|интервью/i.test(stage)) return 'lime';
  if (/ожида|рассмотр|решен/i.test(stage)) return 'amber';
  return 'slate';
}

function ScoreRing({
  score,
  size = 'md',
}: {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const classes =
    size === 'lg'
      ? 'size-28 text-3xl'
      : size === 'sm'
        ? 'size-11 text-xs'
        : 'size-16 text-lg';
  return (
    <div
      className={`score-ring ${classes}`}
      style={{ '--score': `${score * 3.6}deg` } as React.CSSProperties}
    >
      <div className="score-ring-inner">
        <span className="font-mono font-semibold">{score}</span>
        {size === 'lg' && (
          <span className="text-xs text-muted-foreground">из 100</span>
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted">
        <FileText className="size-5 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

function VacancyList({
  vacancies,
  onOpen,
}: {
  vacancies: Vacancy[];
  onOpen: (vacancy: Vacancy) => void;
}) {
  if (!vacancies.length)
    return (
      <EmptyState
        title="Вакансий пока нет"
        text="Добавьте полный текст вакансии — система подготовит первичный разбор и вопросы."
      />
    );
  return (
    <div className="divide-y divide-border/70 overflow-hidden rounded-3xl border border-border/80 bg-card">
      {vacancies.map((vacancy) => (
        <button
          key={vacancy.id}
          type="button"
          onClick={() => onOpen(vacancy)}
          className="grid w-full gap-4 px-5 py-5 text-left transition hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_170px_70px] sm:items-center"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full status-${statusTone(vacancy.stage)}`}
              />
              <p className="truncate text-sm font-semibold">
                {vacancy.company}
              </p>
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {vacancy.role}
            </p>
          </div>
          <span className="w-fit rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            {vacancy.stage}
          </span>
          <div className="flex items-center justify-between sm:block sm:text-right">
            <span className="text-xs text-muted-foreground sm:hidden">
              Совпадение
            </span>
            <span className="font-mono text-sm font-semibold">
              {vacancy.fitScore}%
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

export function InterviewDashboard() {
  const [view, setView] = useState<View>('today');
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newVacancy, setNewVacancy] = useState({
    company: '',
    role: '',
    url: '',
    candidateEvidence: '',
    text: '',
  });
  const [savingVacancy, setSavingVacancy] = useState(false);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedVacancyId, setSelectedVacancyId] = useState('');
  const [openStoryId, setOpenStoryId] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<PracticeEvaluation | null>(null);
  const [practiceError, setPracticeError] = useState('');

  async function loadDashboard() {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch('/api/dashboard', { cache: 'no-store' });
      const payload = (await response.json()) as DashboardData & {
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || 'Ошибка загрузки');
      setData(payload);
      setSelectedVacancyId(
        (current) => current || payload.vacancies[0]?.id || '',
      );
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Не удалось загрузить данные',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch('/api/dashboard', { cache: 'no-store' })
      .then(async (response) => {
        const payload = (await response.json()) as DashboardData & {
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error || 'Ошибка загрузки');
        if (!cancelled) {
          setData(payload);
          setSelectedVacancyId(payload.vacancies[0]?.id || '');
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Не удалось загрузить данные',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedVacancy =
    data.vacancies.find((item) => item.id === selectedVacancyId) ||
    data.vacancies[0];
  const filteredVacancies = useMemo(() => {
    const query = search.toLowerCase().trim();
    return query
      ? data.vacancies.filter((item) =>
          `${item.company} ${item.role} ${item.stage}`
            .toLowerCase()
            .includes(query),
        )
      : data.vacancies;
  }, [data.vacancies, search]);
  const readiness = data.stats.practiceSessions
    ? Math.round(
        54 +
          Math.min(18, data.stats.stories * 5) +
          data.stats.averagePracticeScore * 0.25,
      )
    : 62;
  const questions = selectedVacancy?.questions.length
    ? selectedVacancy.questions
    : ['Расскажите о себе и своём главном релевантном проекте.'];
  const activeQuestion =
    questions[Math.min(questionIndex, questions.length - 1)];

  function openAnalysis(vacancy: Vacancy) {
    setSelectedVacancyId(vacancy.id);
    setView('analyses');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function startTrainer(vacancy?: Vacancy) {
    if (vacancy) setSelectedVacancyId(vacancy.id);
    setQuestionIndex(0);
    setAnswer('');
    setEvaluation(null);
    setView('trainer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submitVacancy() {
    setSavingVacancy(true);
    setFormError('');
    try {
      const response = await fetch('/api/vacancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVacancy),
      });
      const payload = (await response.json()) as {
        vacancy?: Vacancy;
        error?: string;
      };
      if (!response.ok || !payload.vacancy)
        throw new Error(payload.error || 'Не удалось добавить вакансию');
      setData((current) => ({
        ...current,
        vacancies: [payload.vacancy!, ...current.vacancies],
        stats: {
          ...current.stats,
          activeVacancies: current.stats.activeVacancies + 1,
        },
      }));
      setSelectedVacancyId(payload.vacancy.id);
      setNewVacancy({
        company: '',
        role: '',
        url: '',
        candidateEvidence: '',
        text: '',
      });
      setDialogOpen(false);
      setView('analyses');
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Не удалось добавить вакансию',
      );
    } finally {
      setSavingVacancy(false);
    }
  }

  async function submitPractice() {
    setEvaluating(true);
    setPracticeError('');
    setEvaluation(null);
    try {
      const response = await fetch('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vacancyId: selectedVacancy?.id,
          question: activeQuestion,
          answer,
        }),
      });
      const payload = (await response.json()) as {
        evaluation?: PracticeEvaluation;
        session?: DashboardData['practiceSessions'][number];
        error?: string;
      };
      if (!response.ok || !payload.evaluation || !payload.session)
        throw new Error(payload.error || 'Не удалось проверить ответ');
      setEvaluation(payload.evaluation);
      setData((current) => {
        const sessions = [payload.session!, ...current.practiceSessions];
        const average = Math.round(
          sessions.reduce((sum, item) => sum + item.score, 0) / sessions.length,
        );
        return {
          ...current,
          practiceSessions: sessions,
          stats: {
            ...current.stats,
            practiceSessions: sessions.length,
            averagePracticeScore: average,
          },
        };
      });
    } catch (error) {
      setPracticeError(
        error instanceof Error ? error.message : 'Не удалось проверить ответ',
      );
    } finally {
      setEvaluating(false);
    }
  }

  function nextQuestion() {
    setQuestionIndex((current) => (current + 1) % questions.length);
    setAnswer('');
    setEvaluation(null);
    setPracticeError('');
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen max-w-[1600px] grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/8 bg-[#17221e] px-5 py-6 text-[#f7f3e8] lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2">
            <div className="grid size-9 place-items-center rounded-xl bg-[#d7ff64] text-[#17221e]">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">
                Interview Ready
              </p>
              <p className="text-[11px] text-white/48">
                подготовка без выдуманных фактов
              </p>
            </div>
          </div>
          <nav className="mt-10 space-y-1" aria-label="Основная навигация">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${view === item.id ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/6 hover:text-white'}`}
                type="button"
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#d7ff64]">
              Профиль кандидата
            </p>
            <p className="mt-2 text-sm font-medium">
              Демонстрационный профиль
            </p>
            <p className="mt-1 text-xs leading-5 text-white/48">
              Python · программные интерфейсы · SQLite · тесты
            </p>
            <div className="mt-4 space-y-1.5 text-[11px] text-white/48">
              <p>Опыт задаёт сам пользователь</p>
              <p>Совпадения ищутся только по тексту</p>
              <p>Итоговые факты проверяет человек</p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 pb-20 lg:pb-0">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/70 bg-background/92 px-5 py-4 backdrop-blur sm:px-8 lg:px-10">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </div>
              <p className="text-sm font-semibold">Interview Ready</p>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs text-muted-foreground">Рабочее пространство</p>
              <p className="text-sm font-medium">
                Подготовка к следующему разговору
              </p>
            </div>
            <Button
              size="lg"
              className="rounded-xl px-4"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="size-4" />
              Добавить вакансию
            </Button>
          </header>

          <div className="px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
            {loading && (
              <div className="grid min-h-[55vh] place-items-center">
                <div className="text-center">
                  <Loader2 className="mx-auto size-6 animate-spin text-primary" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Загружаю штаб…
                  </p>
                </div>
              </div>
            )}
            {!loading && loadError && (
              <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-6">
                <p className="font-semibold">Данные не загрузились</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {loadError}
                </p>
                <Button className="mt-4" onClick={() => void loadDashboard()}>
                  Повторить
                </Button>
              </div>
            )}
            {!loading && !loadError && view === 'today' && (
              <TodayView
                data={data}
                readiness={readiness}
                onVacancy={openAnalysis}
                onTrainer={() => startTrainer(selectedVacancy)}
                onAll={() => setView('vacancies')}
              />
            )}
            {!loading && !loadError && view === 'vacancies' && (
              <VacanciesView
                vacancies={filteredVacancies}
                search={search}
                setSearch={setSearch}
                onOpen={openAnalysis}
                onAdd={() => setDialogOpen(true)}
              />
            )}
            {!loading && !loadError && view === 'stories' && (
              <StoriesView
                stories={data.stories}
                openId={openStoryId}
                setOpenId={setOpenStoryId}
              />
            )}
            {!loading && !loadError && view === 'trainer' && (
              <TrainerView
                vacancies={data.vacancies}
                selected={selectedVacancy}
                setSelected={(id) => {
                  setSelectedVacancyId(id);
                  setQuestionIndex(0);
                  setAnswer('');
                  setEvaluation(null);
                }}
                question={activeQuestion}
                questionIndex={questionIndex}
                questionCount={questions.length}
                answer={answer}
                setAnswer={setAnswer}
                evaluation={evaluation}
                evaluating={evaluating}
                error={practiceError}
                submit={submitPractice}
                next={nextQuestion}
              />
            )}
            {!loading && !loadError && view === 'analyses' && (
              <AnalysisView
                vacancies={data.vacancies}
                selected={selectedVacancy}
                setSelected={setSelectedVacancyId}
                onTrainer={startTrainer}
              />
            )}
          </div>
        </section>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-white/10 bg-[#17221e] px-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5 text-white lg:hidden"
        aria-label="Мобильная навигация"
      >
        {navigation.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] ${view === item.id ? 'text-[#d7ff64]' : 'text-white/45'}`}
          >
            <item.icon className="size-4" />
            {item.label}
          </button>
        ))}
      </nav>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-3xl p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="text-xl">Новая вакансия</DialogTitle>
            <DialogDescription>
              Добавьте только подтверждённый опыт и полный текст вакансии.
              Система покажет совпадения, пробелы и вопросы для тренировки.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Компания"
              value={newVacancy.company}
              onChange={(event) =>
                setNewVacancy({ ...newVacancy, company: event.target.value })
              }
            />
            <Input
              placeholder="Название роли"
              value={newVacancy.role}
              onChange={(event) =>
                setNewVacancy({ ...newVacancy, role: event.target.value })
              }
            />
          </div>
          <div className="relative">
            <Link2 className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Ссылка (необязательно)"
              value={newVacancy.url}
              onChange={(event) =>
                setNewVacancy({ ...newVacancy, url: event.target.value })
              }
            />
          </div>
          <Textarea
            className="min-h-36 resize-none rounded-2xl bg-muted/45 p-4"
            placeholder="Подтверждённые навыки и примеры: что именно вы сделали, чем проверили и какой получили результат…"
            value={newVacancy.candidateEvidence}
            onChange={(event) =>
              setNewVacancy({
                ...newVacancy,
                candidateEvidence: event.target.value,
              })
            }
          />
          <Textarea
            className="min-h-60 resize-none rounded-2xl bg-muted/45 p-4"
            placeholder="Обязанности, требования, зарплата, формат, описание команды…"
            value={newVacancy.text}
            onChange={(event) =>
              setNewVacancy({ ...newVacancy, text: event.target.value })
            }
          />
          {formError && (
            <p className="rounded-xl bg-destructive/8 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}
          <Button
            size="lg"
            className="rounded-xl"
            disabled={savingVacancy}
            onClick={() => void submitVacancy()}
          >
            {savingVacancy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {savingVacancy ? 'Сохраняю…' : 'Разобрать и сохранить'}
          </Button>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function SectionHeader({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-[#65703f]">
        <span className="inline-block size-2 rounded-full bg-[#b6df42]" />
        {eyebrow}
      </div>
      <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

function TodayView({
  data,
  readiness,
  onVacancy,
  onTrainer,
  onAll,
}: {
  data: DashboardData;
  readiness: number;
  onVacancy: (vacancy: Vacancy) => void;
  onTrainer: () => void;
  onAll: () => void;
}) {
  const primary = data.vacancies[0];
  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader
          eyebrow="Фокус дня"
          title="Не вспоминать на созвоне. Доказывать."
          text="Система сопоставляет только тот опыт, который пользователь указал сам, с требованиями конкретной вакансии."
        />
        <p className="max-w-xs rounded-2xl border border-border/70 bg-card p-4 text-xs leading-5 text-muted-foreground">
          <span className="font-semibold text-foreground">Рабочий контур:</span>{' '}
          добавляете доказательства и вакансию, изучаете разбор, затем
          тренируете ответы и сохраняете результат.
        </p>
      </div>
      <div className="mt-8 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="overflow-hidden rounded-[28px] bg-[#17221e] p-6 text-[#f8f5eb] shadow-[0_24px_70px_-46px_rgba(23,34,30,0.9)] sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#d7ff64]">
                Следующая тренировка
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {primary
                  ? `${primary.company}: ${primary.role}`
                  : 'Добавьте первую вакансию'}
              </h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/7 px-3 py-1.5 text-xs text-white/65">
              12–18 минут
            </span>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              ['01', 'Самопрезентация', '45–60 секунд'],
              ['02', 'Главный пример', 'Проблема, действие, результат'],
              ['03', 'Сложный вопрос', 'Честная граница опыта'],
            ].map(([number, title, detail]) => (
              <div
                key={number}
                className="rounded-2xl border border-white/10 bg-white/6 p-4"
              >
                <p className="font-mono text-xs text-[#d7ff64]">{number}</p>
                <p className="mt-5 text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs text-white/45">{detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-white/48">
              <Check className="size-4 text-[#d7ff64]" />
              Основано на вакансии и подтверждённом портфолио
            </div>
            <Button
              onClick={onTrainer}
              className="rounded-xl bg-[#d7ff64] px-4 text-[#17221e] hover:bg-[#c9ef58]"
            >
              Начать тренировку
              <ArrowUpRight className="size-4" />
            </Button>
          </div>
        </article>
        <article className="rounded-[28px] border border-border/80 bg-card p-6 sm:p-7">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                Готовность
              </p>
              <p className="mt-2 text-5xl font-semibold tracking-[-0.06em]">
                {readiness}
                <span className="text-xl text-muted-foreground">%</span>
              </p>
            </div>
            <div className="grid size-11 place-items-center rounded-2xl bg-[#edf7d2] text-[#566820]">
              <Target className="size-5" />
            </div>
          </div>
          <div className="mt-8 space-y-4">
            {[
              ['Понимание роли', Math.min(92, 55 + data.vacancies.length * 4)],
              [
                'Истории и примеры',
                Math.min(90, 45 + data.stories.length * 12),
              ],
              ['Практика ответов', data.stats.averagePracticeScore || 35],
            ].map(([label, value]) => (
              <div key={label as string}>
                <div className="mb-2 flex justify-between text-xs">
                  <span>{label}</span>
                  <span className="font-mono text-muted-foreground">
                    {value}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[#9fc43a]"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Активные вакансии
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Приоритет, этап и готовность к следующему разговору
              </p>
            </div>
            <Button
              variant="ghost"
              className="hidden sm:inline-flex"
              onClick={onAll}
            >
              Все вакансии
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <VacancyList
            vacancies={data.vacancies.slice(0, 4)}
            onOpen={onVacancy}
          />
        </section>
        <aside>
          <h2 className="text-lg font-semibold tracking-tight">
            До собеседования
          </h2>
          <div className="mt-4 space-y-3">
            {[
              {
                icon: FileText,
                title: 'Сократить ответ о себе',
                meta: 'до 60 секунд',
                urgent: true,
              },
              {
                icon: CircleAlert,
                title: 'Подготовить честный ответ о пробеле',
                meta: 'граница опыта и план обучения',
                urgent: false,
              },
              {
                icon: CalendarClock,
                title: 'Проверить технику',
                meta: 'звук и демонстрация',
                urgent: false,
              },
            ].map((task) => (
              <button
                key={task.title}
                type="button"
                onClick={onTrainer}
                className="flex w-full items-center gap-3 rounded-2xl border border-border/75 bg-card p-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${task.urgent ? 'bg-[#fff0e9] text-[#bc542e]' : 'bg-muted text-muted-foreground'}`}
                >
                  <task.icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {task.meta}
                  </p>
                </div>
                <ChevronRight className="ml-auto size-4 text-muted-foreground/60" />
              </button>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}

function VacanciesView({
  vacancies,
  search,
  setSearch,
  onOpen,
  onAdd,
}: {
  vacancies: Vacancy[];
  search: string;
  setSearch: (value: string) => void;
  onOpen: (vacancy: Vacancy) => void;
  onAdd: () => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader
          eyebrow="Воронка"
          title="Все вакансии в одном контексте."
          text="Сравнивайте соответствие профилю, текущий этап и то, что нужно подготовить перед следующим контактом."
        />
        <Button variant="outline" onClick={onAdd}>
          <Plus className="size-4" />
          Новая
        </Button>
      </div>
      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-border bg-card px-4">
        <Search className="size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          placeholder="Компания, роль или этап…"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')}>
            <X className="size-4 text-muted-foreground" />
          </button>
        )}
      </div>
      <div className="mt-4">
        <VacancyList vacancies={vacancies} onOpen={onOpen} />
      </div>
    </>
  );
}

function StoriesView({
  stories,
  openId,
  setOpenId,
}: {
  stories: Story[];
  openId: string;
  setOpenId: (id: string) => void;
}) {
  return (
    <>
      <SectionHeader
        eyebrow="Банк доказательств"
        title="Истории, которые отвечают за вас."
        text="Каждая история собрана по логике STAR+R: контекст, задача, личные действия, проверяемый результат и вывод."
      />
      <div className="mt-8 grid gap-4">
        {stories.map((story) => {
          const open = openId === story.id;
          return (
            <article
              key={story.id}
              className="overflow-hidden rounded-3xl border border-border/80 bg-card"
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? '' : story.id)}
                className="flex w-full items-start gap-4 p-5 text-left sm:p-6"
              >
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#edf7d2] text-[#566820]">
                  <BookOpenCheck className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.11em] text-muted-foreground">
                    {story.competency}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">{story.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {story.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight
                  className={`mt-2 size-5 text-muted-foreground transition ${open ? 'rotate-90' : ''}`}
                />
              </button>
              {open && (
                <div className="border-t border-border/70 px-5 py-6 sm:px-6">
                  <div className="grid gap-5 lg:grid-cols-2">
                    {[
                      ['S — ситуация', story.situation],
                      ['T — задача', story.task],
                      ['A — мои действия', story.action],
                      ['R — результат', story.result],
                    ].map(([label, content]) => (
                      <div key={label} className="rounded-2xl bg-muted/55 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#65703f]">
                          {label}
                        </p>
                        <p className="mt-2 text-sm leading-6">{content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl border border-[#cedaa8] bg-[#f5fae7] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#65703f]">
                      Вывод
                    </p>
                    <p className="mt-2 text-sm leading-6">{story.reflection}</p>
                    <p className="mt-3 font-mono text-xs text-muted-foreground">
                      Доказательство: {story.proof}
                    </p>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

function TrainerView({
  vacancies,
  selected,
  setSelected,
  question,
  questionIndex,
  questionCount,
  answer,
  setAnswer,
  evaluation,
  evaluating,
  error,
  submit,
  next,
}: {
  vacancies: Vacancy[];
  selected?: Vacancy;
  setSelected: (id: string) => void;
  question: string;
  questionIndex: number;
  questionCount: number;
  answer: string;
  setAnswer: (value: string) => void;
  evaluation: PracticeEvaluation | null;
  evaluating: boolean;
  error: string;
  submit: () => void;
  next: () => void;
}) {
  return (
    <>
      <SectionHeader
        eyebrow="Тренажёр"
        title="Ответьте письменно. Затем — вслух."
        text="Экспресс-проверка оценивает структуру, конкретику, личный вклад и результат. Это не оценка рекрутера, а способ быстро увидеть слабое место ответа."
      />
      <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[28px] bg-[#17221e] p-6 text-[#f8f5eb] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <select
              aria-label="Вакансия для тренировки"
              value={selected?.id || ''}
              onChange={(event) => setSelected(event.target.value)}
              className="max-w-full rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm outline-none"
            >
              {vacancies.map((vacancy) => (
                <option
                  className="bg-[#17221e]"
                  value={vacancy.id}
                  key={vacancy.id}
                >
                  {vacancy.company} · {vacancy.role}
                </option>
              ))}
            </select>
            <span className="font-mono text-xs text-white/45">
              {questionIndex + 1} / {questionCount}
            </span>
          </div>
          <div className="mt-8 flex items-start gap-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#d7ff64] text-[#17221e]">
              <MessageSquareText className="size-5" />
            </div>
            <h2 className="text-xl font-semibold leading-8 sm:text-2xl">
              {question}
            </h2>
          </div>
          <Textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            className="mt-7 min-h-64 resize-none rounded-2xl border-white/10 bg-white/7 p-4 text-white placeholder:text-white/30 focus-visible:ring-[#d7ff64]"
            placeholder="Структура: прямой ответ → ситуация → мои действия → проверяемый результат → вывод…"
          />
          <div className="mt-3 flex items-center justify-between text-xs text-white/40">
            <span>
              {answer.trim() ? answer.trim().split(/\s+/).length : 0} слов
            </span>
            <span className="flex items-center gap-1.5">
              <TimerReset className="size-3.5" />
              ориентир: 60–90 секунд
            </span>
          </div>
          {error && (
            <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={submit}
              disabled={evaluating}
              className="rounded-xl bg-[#d7ff64] text-[#17221e] hover:bg-[#c9ef58]"
            >
              {evaluating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ClipboardCheck className="size-4" />
              )}
              {evaluating ? 'Проверяю…' : 'Проверить структуру'}
            </Button>
            <Button
              onClick={next}
              variant="ghost"
              className="rounded-xl text-white/65 hover:bg-white/10 hover:text-white"
            >
              Следующий вопрос
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </section>
        <aside className="rounded-[28px] border border-border/80 bg-card p-6">
          {evaluation ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Результат
                  </p>
                  <p className="mt-2 text-lg font-semibold">Структура ответа</p>
                </div>
                <ScoreRing score={evaluation.score} />
              </div>
              <div className="mt-6 space-y-4">
                {[
                  ['По вопросу', evaluation.relevance],
                  ['Конкретика', evaluation.specificity],
                  ['Личный вклад', evaluation.ownership],
                  ['Результат', evaluation.resultFocus],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <div className="mb-2 flex justify-between text-xs">
                      <span>{label}</span>
                      <span className="font-mono">{value}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[#9fc43a]"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-border pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Улучшить
                </p>
                <ul className="mt-3 space-y-3">
                  {evaluation.feedback.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-5">
                      <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#bc7b2e]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-80 flex-col justify-between">
              <div>
                <div className="grid size-12 place-items-center rounded-2xl bg-muted">
                  <Gauge className="size-5 text-muted-foreground" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">
                  После ответа увидите
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {[
                    'релевантность вопросу',
                    'конкретность примера',
                    'видимость личного вклада',
                    'силу результата и вывода',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-[#8fad32]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-8 text-xs leading-5 text-muted-foreground">
                Проверка основана на прозрачных структурных признаках. Финальную
                формулировку и факты всегда контролируете вы.
              </p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function AnalysisView({
  vacancies,
  selected,
  setSelected,
  onTrainer,
}: {
  vacancies: Vacancy[];
  selected?: Vacancy;
  setSelected: (id: string) => void;
  onTrainer: (vacancy?: Vacancy) => void;
}) {
  if (!selected)
    return (
      <EmptyState
        title="Нечего разбирать"
        text="Добавьте вакансию, чтобы получить карту совпадений, пробелов и вопросов."
      />
    );
  return (
    <>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader
          eyebrow="Разбор вакансии"
          title={`${selected.company} · ${selected.role}`}
          text={selected.summary}
        />
        <Button onClick={() => onTrainer(selected)}>
          Тренировать ответы
          <ArrowUpRight className="size-4" />
        </Button>
      </div>
      <div className="mt-7 flex gap-2 overflow-x-auto pb-2">
        {vacancies.map((vacancy) => (
          <button
            key={vacancy.id}
            type="button"
            onClick={() => setSelected(vacancy.id)}
            className={`shrink-0 rounded-full border px-3 py-2 text-xs transition ${selected.id === vacancy.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}
          >
            {vacancy.company}
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[28px] border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.11em] text-muted-foreground">
                Совпадение
              </p>
              <p className="mt-2 text-sm font-medium">с указанным опытом</p>
            </div>
            <ScoreRing score={selected.fitScore} size="lg" />
          </div>
          <div className="mt-6 space-y-3 border-t border-border pt-5">
            {[
              ['Этап', selected.stage],
              ['Формат', selected.workFormat || 'Нужно уточнить'],
              ['Зарплата', selected.salary || 'Не указана'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-right font-medium">{value}</span>
              </div>
            ))}
          </div>
          {selected.url && (
            <a
              href={selected.url}
              target="_blank"
              rel="noreferrer"
              className="mt-5 flex items-center gap-2 text-xs font-medium text-primary hover:underline"
            >
              <Link2 className="size-3.5" />
              Открыть источник
            </a>
          )}
        </aside>
        <div className="grid gap-4 sm:grid-cols-2">
          <AnalysisCard
            title="Что уже доказывает соответствие"
            icon={CheckCircle2}
            items={selected.strengths}
            tone="green"
          />
          <AnalysisCard
            title="Что закрыть до разговора"
            icon={CircleAlert}
            items={selected.gaps}
            tone="amber"
          />
          <AnalysisCard
            title="Вероятные вопросы"
            icon={MessageSquareText}
            items={selected.questions}
            tone="plain"
            numbered
          />
          <AnalysisCard
            title="Следующие действия"
            icon={TrendingUp}
            items={selected.nextActions}
            tone="plain"
            numbered
          />
        </div>
      </div>
      {selected.sourceText && (
        <details className="mt-4 rounded-3xl border border-border bg-card p-5">
          <summary className="cursor-pointer text-sm font-semibold">
            Исходный текст вакансии
          </summary>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
            {selected.sourceText}
          </p>
        </details>
      )}
    </>
  );
}

function AnalysisCard({
  title,
  icon: Icon,
  items,
  tone,
  numbered = false,
}: {
  title: string;
  icon: typeof Target;
  items: string[];
  tone: 'green' | 'amber' | 'plain';
  numbered?: boolean;
}) {
  const iconClass =
    tone === 'green'
      ? 'bg-[#edf7d2] text-[#607522]'
      : tone === 'amber'
        ? 'bg-[#fff0e1] text-[#a66120]'
        : 'bg-muted text-muted-foreground';
  return (
    <article className="rounded-[28px] border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div
          className={`grid size-10 place-items-center rounded-2xl ${iconClass}`}
        >
          <Icon className="size-4" />
        </div>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <ul className="mt-5 space-y-3">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-3 text-sm leading-6">
            {numbered ? (
              <span className="font-mono text-xs text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
            ) : (
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#9fc43a]" />
            )}
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
