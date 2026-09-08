import { GoogleGenAI, Type } from "@google/genai";
import type { AIProvider } from "@/lib/ai/provider";
import { buildGerarQuestaoObjetivaPrompt } from "@/lib/ai/prompts/gerar-questao-objetiva";
import { buildGerarQuestaoDiscursivaPrompt } from "@/lib/ai/prompts/gerar-questao-discursiva";
import { buildCorrigirDiscursivaPrompt } from "@/lib/ai/prompts/corrigir-discursiva";
import { buildParsearEditalPrompt } from "@/lib/ai/prompts/parsear-edital";
import {
  generatedObjectiveQuestionsSchema,
  generatedDiscursiveQuestionSchema,
} from "@/lib/ai/schemas/questao.schema";
import { gradeResultSchema } from "@/lib/ai/schemas/correcao.schema";
import { parsedEditalSchema } from "@/lib/ai/schemas/edital.schema";

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

const parsedEditalResponseSchema = {
  type: Type.OBJECT,
  properties: {
    orgao: { type: Type.STRING, nullable: true },
    cargo: { type: Type.STRING, nullable: true },
    examDate: { type: Type.STRING, nullable: true },
    registrationDeadline: { type: Type.STRING, nullable: true },
    resultDate: { type: Type.STRING, nullable: true },
    disciplinas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          bloco: {
            type: Type.STRING,
            enum: ["BASICO", "GERAL", "ESPECIFICO"],
          },
          nome: { type: Type.STRING },
          numQuestoes: { type: Type.INTEGER, nullable: true },
          peso: { type: Type.NUMBER, nullable: true },
        },
        required: ["bloco", "nome", "numQuestoes", "peso"],
      },
    },
    cronograma: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          evento: { type: Type.STRING },
          dataInicio: { type: Type.STRING },
          dataFim: { type: Type.STRING, nullable: true },
          tipo: {
            type: Type.STRING,
            enum: [
              "INSCRICAO",
              "PROVA_OBJETIVA",
              "PROVA_DISCURSIVA",
              "GABARITO",
              "RECURSO",
              "RESULTADO",
              "OUTRO",
            ],
          },
        },
        required: ["evento", "dataInicio", "dataFim", "tipo"],
      },
    },
  },
  required: [
    "orgao",
    "cargo",
    "examDate",
    "registrationDeadline",
    "resultDate",
    "disciplinas",
    "cronograma",
  ],
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

  async parseEdital(input) {
    const runOnce = async (correctionHint?: string) => {
      const prompt = buildParsearEditalPrompt(input.rawText, correctionHint);

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: parsedEditalResponseSchema,
        },
      });

      const raw = JSON.parse(response.text ?? "{}");
      return parsedEditalSchema.parse(raw);
    };

    try {
      return await runOnce();
    } catch (error) {
      const hint =
        error instanceof Error
          ? `A resposta anterior falhou na validação com o erro: ${error.message}. Garanta que todos os campos obrigatórios estejam presentes e que as datas estejam no formato YYYY-MM-DD.`
          : "A resposta anterior não estava no formato esperado. Revise cuidadosamente o schema pedido.";

      return await runOnce(hint);
    }
  },
};
