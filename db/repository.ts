import { env } from 'cloudflare:workers';

import type {
  DashboardData,
  PracticeEvaluation,
  PracticeSession,
  Story,
  Vacancy,
} from '@/lib/types';

type D1Row = Record<string, string | number | null>;

const demoEvidence =
  'Сделал учебный сервис на Python: принимает данные через REST API, проверяет обязательные поля, исключает повторы по ключу, сохраняет состояние в SQLite. Добавил обработку ошибок, журнал событий и 12 автоматических тестов.';

const seedVacancies = [
  {
    id: 'demo-automation-engineer',
    company: 'Пример Лаб',
    role: 'Младший разработчик автоматизации',
    candidateEvidence: demoEvidence,
    sourceText:
      'Ищем младшего разработчика для внутренних интеграций. Задачи: Python, REST API, SQL, обработка ошибок и автоматические тесты. Формат удалённый. Важно уметь объяснять решения и проверять результат.',
    stage: 'Демонстрационный пример',
    fitScore: 88,
    salary: null,
    workFormat: 'Удалённо',
    summary:
      'Система нашла подтверждённое пересечение по Python, программным интерфейсам, базам данных и автоматическим проверкам. Оценка показывает полноту текстового совпадения, а не гарантирует приглашение.',
    strengths: [
      'Совпадение подтверждено текстом кандидата: Python',
      'Совпадение подтверждено текстом кандидата: программные интерфейсы и интеграции',
      'Совпадение подтверждено текстом кандидата: базы данных и SQL',
      'Совпадение подтверждено текстом кандидата: автоматические проверки',
    ],
    gaps: [
      'На разговоре уточнить реальные задачи, критерии результата и уровень самостоятельности.',
    ],
  },
] as const;

const commonQuestions = [
  'Расскажите о себе за 45–60 секунд и свяжите опыт с этой ролью.',
  'Какой проект лучше всего доказывает соответствие этой работе?',
  'Что вы делаете, если внешний программный интерфейс нестабилен или присылает повторы?',
  'Где проходит граница вашего реального опыта?',
  'Какой проверяемый результат вы сможете показать в первые 30 дней?',
];

const seedStories = [
  {
    id: 'localops-monitor',
    title: 'LocalOps Monitor: надёжная обработка заявок',
    competency: 'Инженерное мышление',
    situation:
      'Входящие заявки могли содержать неполные данные, повторы или временно не обрабатываться из-за ошибки внешней системы.',
    task: 'Сделать воспроизводимый процесс проверки и сохранения заявок без потери проблемных записей.',
    action:
      'Я реализовал нормализацию и проверку полей, защиту от повторов, ограниченные повторные попытки и журналирование в SQLite. Критические ветки покрыл автоматическими тестами.',
    result:
      'Получился работающий демонстрационный сервис с 12 автоматическими проверками, включая повторы и временные отказы.',
    reflection:
      'Качество автоматизации определяется не только обычным сценарием, но и тем, насколько понятно она обрабатывает сбои.',
    proof:
      'Python · программные интерфейсы · JSON · SQLite · обработка ошибок · 12 проверок',
    tags: ['Python', 'надёжность', 'интеграции', 'тестирование'],
  },
  {
    id: 'honest-experience-boundary',
    title: 'Честный ответ о границе опыта',
    competency: 'Самопрезентация',
    situation:
      'На собеседовании работодатель спрашивает о технологии, с которой кандидат ещё не работал в реальной задаче.',
    task: 'Не преувеличивать опыт и одновременно показать способность быстро войти в работу.',
    action:
      'Я прямо обозначаю текущий уровень, привожу ближайший подтверждённый пример и предлагаю небольшой проверяемый первый результат.',
    result:
      'Разговор переходит от общего «не знаю» к конкретному уровню риска и понятному плану проверки навыка.',
    reflection:
      'Честная граница вместе с доказательством звучит убедительнее, чем попытка казаться опытнее.',
    proof: 'Готовая структура ответа для кадрового и технического собеседования',
    tags: ['граница опыта', 'самопрезентация', 'честность'],
  },
] as const;

function db() {
  if (!env.DB) throw new Error('D1 binding DB is unavailable');
  return env.DB;
}

function jsonArray(value: unknown) {
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export async function seedDatabase() {
  const database = db();
  const count = await database
    .prepare('SELECT COUNT(*) AS total FROM vacancies')
    .first<{ total: number }>();
  if ((count?.total ?? 0) === 0) {
    const now = new Date().toISOString();
    await database.batch(
      seedVacancies.map((vacancy) =>
        database
          .prepare(
            'INSERT OR IGNORE INTO vacancies (id, company, role, candidate_evidence, source_text, url, stage, fit_score, salary, work_format, summary, strengths_json, gaps_json, questions_json, next_actions_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          )
          .bind(
            vacancy.id,
            vacancy.company,
            vacancy.role,
            vacancy.candidateEvidence,
            vacancy.sourceText,
            null,
            vacancy.stage,
            vacancy.fitScore,
            vacancy.salary,
            vacancy.workFormat,
            vacancy.summary,
            JSON.stringify(vacancy.strengths),
            JSON.stringify(vacancy.gaps),
            JSON.stringify(commonQuestions),
            JSON.stringify([
              'Отрепетировать ответ о себе.',
              'Выбрать два доказательства под требования.',
              'Подготовить вопросы работодателю.',
            ]),
            now,
            now,
          ),
      ),
    );
  }

  const storyCount = await database
    .prepare('SELECT COUNT(*) AS total FROM stories')
    .first<{ total: number }>();
  if ((storyCount?.total ?? 0) === 0) {
    const now = new Date().toISOString();
    await database.batch(
      seedStories.map((story) =>
        database
          .prepare(
            'INSERT OR IGNORE INTO stories (id, title, competency, situation, task, action, result, reflection, proof, tags_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          )
          .bind(
            story.id,
            story.title,
            story.competency,
            story.situation,
            story.task,
            story.action,
            story.result,
            story.reflection,
            story.proof,
            JSON.stringify(story.tags),
            now,
            now,
          ),
      ),
    );
  }
}

function mapVacancy(row: D1Row): Vacancy {
  return {
    id: String(row.id),
    company: String(row.company),
    role: String(row.role),
    candidateEvidence: String(row.candidate_evidence ?? ''),
    sourceText: String(row.source_text ?? ''),
    url: row.url ? String(row.url) : null,
    stage: String(row.stage),
    fitScore: Number(row.fit_score),
    salary: row.salary ? String(row.salary) : null,
    workFormat: row.work_format ? String(row.work_format) : null,
    summary: String(row.summary),
    strengths: jsonArray(row.strengths_json),
    gaps: jsonArray(row.gaps_json),
    questions: jsonArray(row.questions_json),
    nextActions: jsonArray(row.next_actions_json),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapStory(row: D1Row): Story {
  return {
    id: String(row.id),
    title: String(row.title),
    competency: String(row.competency),
    situation: String(row.situation),
    task: String(row.task),
    action: String(row.action),
    result: String(row.result),
    reflection: String(row.reflection),
    proof: String(row.proof),
    tags: jsonArray(row.tags_json),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapSession(row: D1Row): PracticeSession {
  return {
    id: String(row.id),
    vacancyId: row.vacancy_id ? String(row.vacancy_id) : null,
    question: String(row.question),
    answer: String(row.answer),
    score: Number(row.score),
    relevance: Number(row.relevance),
    specificity: Number(row.specificity),
    ownership: Number(row.ownership),
    resultFocus: Number(row.result_focus),
    feedback: jsonArray(row.feedback_json),
    createdAt: String(row.created_at),
  };
}

export async function getDashboard(): Promise<DashboardData> {
  await seedDatabase();
  const database = db();
  const [vacancyResult, storyResult, practiceResult] = await database.batch([
    database.prepare(
      'SELECT * FROM vacancies ORDER BY updated_at DESC, fit_score DESC',
    ),
    database.prepare('SELECT * FROM stories ORDER BY updated_at DESC'),
    database.prepare(
      'SELECT * FROM practice_sessions ORDER BY created_at DESC LIMIT 20',
    ),
  ]);
  const vacancies = (vacancyResult.results as D1Row[]).map(mapVacancy);
  const stories = (storyResult.results as D1Row[]).map(mapStory);
  const practiceSessions = (practiceResult.results as D1Row[]).map(mapSession);
  const averagePracticeScore = practiceSessions.length
    ? Math.round(
        practiceSessions.reduce((sum, session) => sum + session.score, 0) /
          practiceSessions.length,
      )
    : 0;
  return {
    vacancies,
    stories,
    practiceSessions,
    stats: {
      activeVacancies: vacancies.length,
      stories: stories.length,
      practiceSessions: practiceSessions.length,
      averagePracticeScore,
    },
  };
}

export async function createVacancy(
  input: Omit<Vacancy, 'id' | 'createdAt' | 'updatedAt'>,
) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db()
    .prepare(
      'INSERT INTO vacancies (id, company, role, candidate_evidence, source_text, url, stage, fit_score, salary, work_format, summary, strengths_json, gaps_json, questions_json, next_actions_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      id,
      input.company,
      input.role,
      input.candidateEvidence,
      input.sourceText,
      input.url,
      input.stage,
      input.fitScore,
      input.salary,
      input.workFormat,
      input.summary,
      JSON.stringify(input.strengths),
      JSON.stringify(input.gaps),
      JSON.stringify(input.questions),
      JSON.stringify(input.nextActions),
      now,
      now,
    )
    .run();
  return { ...input, id, createdAt: now, updatedAt: now };
}

export async function savePractice(input: {
  vacancyId: string | null;
  question: string;
  answer: string;
  evaluation: PracticeEvaluation;
}) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db()
    .prepare(
      'INSERT INTO practice_sessions (id, vacancy_id, question, answer, score, relevance, specificity, ownership, result_focus, feedback_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      id,
      input.vacancyId,
      input.question,
      input.answer,
      input.evaluation.score,
      input.evaluation.relevance,
      input.evaluation.specificity,
      input.evaluation.ownership,
      input.evaluation.resultFocus,
      JSON.stringify(input.evaluation.feedback),
      now,
    )
    .run();
  return {
    id,
    vacancyId: input.vacancyId,
    question: input.question,
    answer: input.answer,
    ...input.evaluation,
    feedback: input.evaluation.feedback,
    createdAt: now,
  };
}
