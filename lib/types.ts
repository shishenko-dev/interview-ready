export type Vacancy = {
  id: string;
  company: string;
  role: string;
  candidateEvidence: string;
  sourceText: string;
  url: string | null;
  stage: string;
  fitScore: number;
  salary: string | null;
  workFormat: string | null;
  summary: string;
  strengths: string[];
  gaps: string[];
  questions: string[];
  nextActions: string[];
  createdAt: string;
  updatedAt: string;
};

export type Story = {
  id: string;
  title: string;
  competency: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  reflection: string;
  proof: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type PracticeSession = {
  id: string;
  vacancyId: string | null;
  question: string;
  answer: string;
  score: number;
  relevance: number;
  specificity: number;
  ownership: number;
  resultFocus: number;
  feedback: string[];
  createdAt: string;
};

export type DashboardData = {
  vacancies: Vacancy[];
  stories: Story[];
  practiceSessions: PracticeSession[];
  stats: {
    activeVacancies: number;
    stories: number;
    practiceSessions: number;
    averagePracticeScore: number;
  };
};

export type PracticeEvaluation = {
  score: number;
  relevance: number;
  specificity: number;
  ownership: number;
  resultFocus: number;
  feedback: string[];
};
