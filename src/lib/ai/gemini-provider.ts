import { GoogleGenAI, Type } from "@google/genai";
import type { AIProvider } from "@/lib/ai/provider";
import { buildGerarQuestaoObjetivaPrompt } from "@/lib/ai/prompts/gerar-questao-objetiva";
import { buildGerarQuestaoDiscursivaPrompt } from "@/lib/ai/prompts/gerar-questao-discursiva";
import { buildCorrigirDiscursivaPrompt } from "@/lib/ai/prompts/corrigir-discursiva";
import {
  generatedObjectiveQuestionsSchema,
  generatedDiscursiveQuestionSchema,
} from "@/lib/ai/schemas/questao.schema";
import { gradeResultSchema } from "@/lib/ai/schemas/correcao.schema";

const MODEL = "gemini-3.6-flash";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const objectiveQuestionsResponseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      statement: { type: Type.STRING },
      options: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, enum: ["A", "B", "C", "D"] },
            text: { type: Type.STRING },
          },
          required: ["id", "text"],
        },
      },
      correctOptionId: { type: Type.STRING, enum: ["A", "B", "C", "D"] },
      explanation: { type: Type.STRING },
    },
    required: ["statement", "options", "correctOptionId", "explanation"],
  },
};

const discursiveQuestionResponseSchema = {
  type: Type.OBJECT,
  properties: {
    statement: { type: Type.STRING },
    expectedTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
    rubric: { type: Type.STRING },
  },
  required: ["statement", "expectedTopics", "rubric"],
};

const gradeResultResponseSchema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER },
    feedback: { type: Type.STRING },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["score", "feedback", "strengths", "weaknesses"],
};

export const geminiProvider: AIProvider = {
  async generateObjectiveQuestions(input) {
    const prompt = buildGerarQuestaoObjetivaPrompt(input);

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: objectiveQuestionsResponseSchema,
      },
    });

    const raw = JSON.parse(response.text ?? "[]");
    return generatedObjectiveQuestionsSchema.parse(raw);
  },

  async generateDiscursiveQuestion(input) {
    const prompt = buildGerarQuestaoDiscursivaPrompt(input);

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: discursiveQuestionResponseSchema,
      },
    });

    const raw = JSON.parse(response.text ?? "{}");
    return generatedDiscursiveQuestionSchema.parse(raw);
  },

  async gradeDiscursive(input) {
    const prompt = buildCorrigirDiscursivaPrompt(input);

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: gradeResultResponseSchema,
      },
    });

    const raw = JSON.parse(response.text ?? "{}");
    return gradeResultSchema.parse(raw);
  },
};
