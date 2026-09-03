import { savePractice } from '@/db/repository';
import { evaluatePractice } from '@/lib/analysis';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      vacancyId?: string;
      question?: string;
      answer?: string;
    };
    const question = body.question?.trim() || '';
    const answer = body.answer?.trim() || '';
    if (!question || answer.length < 20)
      return Response.json(
        { error: 'Ответьте хотя бы двумя-тремя предложениями.' },
        { status: 400 },
      );
    const evaluation = evaluatePractice(answer, question);
    const session = await savePractice({
      vacancyId: body.vacancyId || null,
      question,
      answer,
      evaluation,
    });
    return Response.json({ evaluation, session }, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Не удалось сохранить тренировку.' },
      { status: 500 },
    );
  }
}
