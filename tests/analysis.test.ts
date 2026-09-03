import assert from 'node:assert/strict';
import test from 'node:test';

import { analyzeVacancy, evaluatePractice } from '../lib/analysis.ts';

test('совпадение учитывается только при наличии требования и доказательства', () => {
  const result = analyzeVacancy({
    company: 'Пример Лаб',
    role: 'Разработчик',
    candidateEvidence:
      'Сделал сервис на Python и SQLite, добавил 12 автоматических тестов.',
    text: 'Нужны Python, SQL, Docker и автоматические тесты. Работа удалённая.',
  });

  assert.ok(result.strengths.some((item) => item.includes('Python')));
  assert.ok(result.strengths.some((item) => item.includes('SQL')));
  assert.ok(result.gaps.some((item) => item.includes('Docker')));
  assert.equal(result.workFormat, 'Удалённо');
});

test('неподтверждённый навык не попадает в сильные стороны', () => {
  const result = analyzeVacancy({
    candidateEvidence: 'Работал с Python и проверял результат.',
    text: 'Нужны Kubernetes и Docker.',
  });

  assert.equal(result.strengths.some((item) => item.includes('Docker')), false);
  assert.equal(result.strengths.some((item) => item.includes('Kubernetes')), false);
  assert.ok(result.fitScore <= 50);
});

test('зарплата и гибридный формат извлекаются из текста', () => {
  const result = analyzeVacancy({
    candidateEvidence:
      'Разработал интерфейс на TypeScript и React, проверил 8 сценариев.',
    text: 'Гибрид. Зарплата от 180 000 ₽. Нужны TypeScript и React.',
  });

  assert.equal(result.salary, 'от 180 000 ₽');
  assert.equal(result.workFormat, 'Гибрид');
  assert.ok(result.fitScore >= 80);
});

test('содержательный ответ оценивается выше слишком короткого', () => {
  const question = 'Расскажите о проекте и вашем результате.';
  const short = evaluatePractice('Мы сделали проект.', question);
  const detailed = evaluatePractice(
    'Моя задача состояла в проверке входящих данных. Я реализовал 12 автоматических тестов, нашёл 3 сбойных сценария и в итоге сократил ручную проверку. Следующий раз я заранее добавлю проверку граничных значений.',
    question,
  );

  assert.ok(detailed.score > short.score);
  assert.ok(detailed.ownership > short.ownership);
  assert.ok(detailed.resultFocus > short.resultFocus);
});

test('обратная связь просит число, если измеримого масштаба нет', () => {
  const result = evaluatePractice(
    'Я реализовал обработку данных и в итоге получил работающий результат, который команда смогла проверить на реальном примере.',
    'Какой результат вы получили?',
  );

  assert.ok(result.feedback.some((item) => item.includes('Добавьте число')));
});
