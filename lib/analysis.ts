import type { PracticeEvaluation } from './types';

type SkillSignal = {
  needles: string[];
  label: string;
  preparation: string;
};

const skillSignals: SkillSignal[] = [
  {
    needles: ['python'],
    label: 'Python',
    preparation: 'Подготовьте один пример задачи, решённой на Python.',
  },
  {
    needles: ['api', 'rest'],
    label: 'программные интерфейсы и интеграции',
    preparation:
      'Подготовьте схему одной интеграции: источник, проверка, сохранение и обработка ошибки.',
  },
  {
    needles: ['sql', 'sqlite', 'postgres'],
    label: 'базы данных и SQL',
    preparation:
      'Повторите выборки, объединения таблиц, индексы и транзакции.',
  },
  {
    needles: ['javascript', 'typescript', 'react', 'node.js', 'nodejs'],
    label: 'JavaScript / TypeScript',
    preparation:
      'Подготовьте пример интерфейса или серверной функции и объясните свою роль.',
  },
  {
    needles: ['docker', 'контейнер'],
    label: 'Docker',
    preparation:
      'Подготовьте пример запуска приложения в Docker-контейнере или честный план освоения.',
  },
  {
    needles: ['тест', 'qa', 'pytest', 'unit'],
    label: 'автоматические проверки',
    preparation:
      'Выберите один сбойный сценарий и объясните, как его проверяет тест.',
  },
  {
    needles: ['n8n', 'make.com', 'zapier', 'low-code', 'no-code'],
    label: 'визуальная автоматизация',
    preparation:
      'Подготовьте схему процесса из запуска, преобразования данных, развилки и обработки ошибки.',
  },
  {
    needles: ['llm', 'rag', 'нейросет', 'искусственн', 'машинн', 'ai ', 'ии '],
    label: 'прикладные системы с искусственным интеллектом',
    preparation:
      'Подготовьте пример, где качество ответа измеряется на заранее известных примерах.',
  },
  {
    needles: ['аналитик', 'требован', 'bpmn', 'uml'],
    label: 'анализ требований и процессов',
    preparation:
      'Подготовьте пример требования с критерием приёмки и пограничным случаем.',
  },
  {
    needles: ['git', 'github', 'gitlab'],
    label: 'контроль версий',
    preparation:
      'Будьте готовы объяснить рабочий цикл: ветка, изменение, проверка и слияние.',
  },
];

function includesAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value));
}

function extractSalary(text: string) {
  const match = text.match(
    /(?:от\s*)?\d{2,3}(?:[\s ]\d{3})?(?:\s*(?:–|-|до)\s*\d{2,3}(?:[\s ]\d{3})?)?\s*(?:₽|руб(?:лей|ля|\.)?)/i,
  );
  return match?.[0] ?? null;
}

function inferFormat(text: string) {
  if (includesAny(text, ['удален', 'удалён', 'remote'])) return 'Удалённо';
  if (text.includes('гибрид')) return 'Гибрид';
  if (includesAny(text, ['офис', 'office'])) return 'Офис';
  return null;
}

function matchedSignals(text: string) {
  return skillSignals.filter((signal) => includesAny(text, signal.needles));
}

export function analyzeVacancy(input: {
  company?: string;
  role?: string;
  candidateEvidence: string;
  text: string;
}) {
  const vacancyText = input.text.toLowerCase();
  const evidenceText = input.candidateEvidence.toLowerCase();
  const required = matchedSignals(vacancyText);
  const proven = required.filter((signal) =>
    includesAny(evidenceText, signal.needles),
  );
  const missing = required.filter(
    (signal) => !includesAny(evidenceText, signal.needles),
  );

  const strengths = proven.length
    ? proven
        .slice(0, 5)
        .map(
          (signal) =>
            `Совпадение подтверждено текстом кандидата: ${signal.label}`,
        )
    : [
        'Автоматическое сопоставление пока не нашло общего технического сигнала. Добавьте конкретные инструменты и результаты в описание опыта.',
      ];

  const gaps = missing.length
    ? missing.slice(0, 5).map((signal) => signal.preparation)
    : [
        'Прямых пробелов по распознанным требованиям не найдено. На разговоре уточните реальные задачи, критерии результата и уровень самостоятельности.',
      ];

  const coverage = required.length ? proven.length / required.length : 0.5;
  const evidenceQuality = Math.min(
    12,
    (evidenceText.match(/\d/g)?.length ?? 0) * 2 +
      (includesAny(evidenceText, ['результат', 'сниз', 'ускор', 'провер'])
        ? 6
        : 0),
  );
  const fitScore = Math.max(
    30,
    Math.min(95, Math.round(38 + coverage * 45 + evidenceQuality)),
  );

  const company = input.company || 'компании';
  const role = input.role || 'эта роль';
  const matchedNames = proven.map((signal) => signal.label).join(', ');
  const summary = proven.length
    ? `Система нашла подтверждённое пересечение по темам: ${matchedNames}. Оценка показывает полноту текстового совпадения, а не гарантирует приглашение или уровень специалиста.`
    : 'Система не нашла подтверждённого пересечения между распознанными требованиями и описанием опыта. Это сигнал дополнить доказательства или не преувеличивать соответствие.';

  const questions = [
    `Почему вас заинтересовала роль «${role}» именно в ${company}?`,
    'Какой ваш проект лучше всего доказывает соответствие этой работе: проблема, ваше действие, проверка и результат?',
    missing[0]
      ? `В вакансии упоминается «${missing[0].label}». Как вы честно объясните текущий уровень и план входа в задачу?`
      : 'Как вы проверяете качество собственной работы и что делаете при ошибке?',
    'Расскажите о сложной ситуации, где вы лично приняли решение и отвечали за результат.',
    'Какой проверяемый результат вы сможете показать в первые 30 дней?',
  ];

  return {
    fitScore,
    salary: extractSalary(input.text),
    workFormat: inferFormat(vacancyText),
    summary,
    strengths,
    gaps,
    questions,
    nextActions: [
      'Выберите по одному конкретному доказательству на каждое обязательное требование.',
      'Отрепетируйте самопрезентацию продолжительностью 45–60 секунд.',
      'Подготовьте три вопроса о задачах, команде и критериях испытательного срока.',
    ],
  };
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function evaluatePractice(
  answer: string,
  question: string,
): PracticeEvaluation {
  const normalized = answer.toLowerCase();
  const words = wordCount(answer);
  const questionTerms = question
    .toLowerCase()
    .split(/[^а-яёa-z0-9]+/)
    .filter((word) => word.length > 4);
  const overlap = questionTerms.filter((word) =>
    normalized.includes(word),
  ).length;
  const hasNumber = /\d/.test(answer);
  const relevance = Math.min(
    100,
    45 + overlap * 12 + (words >= 35 ? 20 : words),
  );
  const specificity = Math.min(
    100,
    30 +
      (hasNumber ? 30 : 0) +
      (includesAny(normalized, ['например', 'конкретно', 'ситуац', 'проект'])
        ? 25
        : 0) +
      (words >= 55 ? 15 : 0),
  );
  const ownership = Math.min(
    100,
    35 +
      (includesAny(normalized, [
        'я сделал',
        'я решил',
        'я выбрал',
        'я настроил',
        'я реализовал',
        'моя задача',
      ])
        ? 45
        : 0) +
      (includesAny(normalized, ['мы', 'команда']) ? 10 : 0),
  );
  const resultFocus = Math.min(
    100,
    30 +
      (includesAny(normalized, [
        'результат',
        'в итоге',
        'получилось',
        'снизил',
        'ускорил',
        'тест',
      ])
        ? 35
        : 0) +
      (hasNumber ? 25 : 0) +
      (includesAny(normalized, ['понял', 'вывод', 'следующий раз']) ? 10 : 0),
  );
  const score = Math.round(
    relevance * 0.3 + specificity * 0.25 + ownership * 0.25 + resultFocus * 0.2,
  );
  const feedback: string[] = [];
  if (words < 35)
    feedback.push(
      'Добавьте контекст, своё действие и измеримый результат: сейчас ответ слишком короткий.',
    );
  if (!hasNumber)
    feedback.push(
      'Добавьте число: срок, объём, количество проверок или другой проверяемый масштаб.',
    );
  if (ownership < 70)
    feedback.push(
      'Яснее отделите личный вклад: используйте формулу «я выбрал, реализовал и проверил».',
    );
  if (resultFocus < 70)
    feedback.push(
      'Завершите ответ результатом и коротким выводом, а не перечнем действий.',
    );
  if (relevance < 70)
    feedback.push(
      'Начните с прямого ответа на вопрос, затем приведите один подходящий пример.',
    );
  if (!feedback.length)
    feedback.push(
      'Структура убедительная. Следующий шаг: произнести ответ вслух за 60–90 секунд без потери ключевых доказательств.',
    );
  return { score, relevance, specificity, ownership, resultFocus, feedback };
}
