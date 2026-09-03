import { getDashboard } from '@/db/repository';

export async function GET() {
  try {
    return Response.json(await getDashboard());
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: 'Не удалось загрузить данные подготовки.' },
      { status: 500 },
    );
  }
}
