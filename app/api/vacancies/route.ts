import { createVacancy } from '@/db/repository';
import { analyzeVacancy } from '@/lib/analysis';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      company?: string;
      role?: string;
      candidateEvidence?: string;
      text?: string;
      url?: string;
    };
    const company = body.company?.trim() || 'Новая компания';
    const role = body.role?.trim() || 'Новая вакансия';
    const candidateEvidence = body.candidateEvidence?.trim() || '';
    const text = body.text?.trim() || '';
    if (candidateEvidence.length < 40)
      return Response.json(
        {
          error:
            'Добавьте подтверждённые навыки и примеры работ — минимум 40 символов.',
        },
        { status: 400 },
      );
    if (text.length < 40)
      return Response.json(
        { error: 'Добавьте полный текст вакансии — минимум 40 символов.' },
        { status: 400 },
      );
    const analysis = analyzeVacancy({
      company,
      role,
      candidateEvidence,
      text,
    });
    const vacancy = await createVacancy({
      company,
      role,
      candidateEvidence,
      sourceText: text,
      url: body.url?.trim() || null,
      stage: 'Новая',
      ...analysis,
    });
    return Response.json({ vacancy }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Не удалось сохранить вакансию.' },
      { status: 500 },
    );
  }
}
