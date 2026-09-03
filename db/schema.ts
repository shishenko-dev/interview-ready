import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const vacancies = sqliteTable(
  'vacancies',
  {
    id: text('id').primaryKey(),
    company: text('company').notNull(),
    role: text('role').notNull(),
    candidateEvidence: text('candidate_evidence').notNull().default(''),
    sourceText: text('source_text').notNull().default(''),
    url: text('url'),
    stage: text('stage').notNull().default('Новая'),
    fitScore: integer('fit_score').notNull().default(50),
    salary: text('salary'),
    workFormat: text('work_format'),
    summary: text('summary').notNull().default(''),
    strengthsJson: text('strengths_json').notNull().default('[]'),
    gapsJson: text('gaps_json').notNull().default('[]'),
    questionsJson: text('questions_json').notNull().default('[]'),
    nextActionsJson: text('next_actions_json').notNull().default('[]'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('vacancies_updated_at_idx').on(table.updatedAt),
    index('vacancies_stage_idx').on(table.stage),
  ],
);

export const stories = sqliteTable(
  'stories',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    competency: text('competency').notNull(),
    situation: text('situation').notNull(),
    task: text('task').notNull(),
    action: text('action').notNull(),
    result: text('result').notNull(),
    reflection: text('reflection').notNull().default(''),
    proof: text('proof').notNull().default(''),
    tagsJson: text('tags_json').notNull().default('[]'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('stories_competency_idx').on(table.competency)],
);

export const practiceSessions = sqliteTable(
  'practice_sessions',
  {
    id: text('id').primaryKey(),
    vacancyId: text('vacancy_id'),
    question: text('question').notNull(),
    answer: text('answer').notNull(),
    score: integer('score').notNull(),
    relevance: integer('relevance').notNull(),
    specificity: integer('specificity').notNull(),
    ownership: integer('ownership').notNull(),
    resultFocus: integer('result_focus').notNull(),
    feedbackJson: text('feedback_json').notNull().default('[]'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('practice_vacancy_created_idx').on(table.vacancyId, table.createdAt),
    index('practice_created_at_idx').on(table.createdAt),
  ],
);
