import type { Difficulty } from "@/generated/prisma/enums";
import type {
  GeneratedObjectiveQuestion,
  GeneratedDiscursiveQuestion,
} from "@/lib/ai/schemas/questao.schema";
import type { GradeResult } from "@/lib/ai/schemas/correcao.schema";

export type GenerateObjectiveQuestionsInput = {
  groupName: string;
  subjectName: string;
  difficulty: Difficulty;
  quantity: number;
  examBoardName?: string;
};

export type GenerateDiscursiveQuestionInput = {
  groupName: string;
  subjectName: string;
  difficulty: Difficulty;
};

export type GradeDiscursiveInput = {
  statement: string;
  rubric: string;
  expectedTopics: string[];
  studentAnswer: string;
};

export interface AIProvider {
  generateObjectiveQuestions(
    input: GenerateObjectiveQuestionsInput,
  ): Promise<GeneratedObjectiveQuestion[]>;

  generateDiscursiveQuestion(
    input: GenerateDiscursiveQuestionInput,
  ): Promise<GeneratedDiscursiveQuestion>;

  gradeDiscursive(input: GradeDiscursiveInput): Promise<GradeResult>;
}
