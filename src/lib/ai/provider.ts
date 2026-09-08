import type { Difficulty } from "@/generated/prisma/enums";
import type {
  GeneratedObjectiveQuestion,
  GeneratedDiscursiveQuestion,
} from "@/lib/ai/schemas/questao.schema";
import type { GradeResult } from "@/lib/ai/schemas/correcao.schema";
import type { ParsedEdital } from "@/lib/ai/schemas/edital.schema";

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

export type ParseEditalInput = {
  rawText: string;
};

export interface AIProvider {
  generateObjectiveQuestions(
    input: GenerateObjectiveQuestionsInput,
  ): Promise<GeneratedObjectiveQuestion[]>;

  generateDiscursiveQuestion(
    input: GenerateDiscursiveQuestionInput,
  ): Promise<GeneratedDiscursiveQuestion>;

  gradeDiscursive(input: GradeDiscursiveInput): Promise<GradeResult>;

  parseEdital(input: ParseEditalInput): Promise<ParsedEdital>;
}
