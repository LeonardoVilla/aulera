import OpenAI from "openai";
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

export const OPENAI_MODEL = "gpt-5-mini";

let cachedClient: OpenAI | undefined;

/**
 * Instanciação preguiçosa: o SDK da OpenAI valida a presença da apiKey
 * imediatamente na construção do client, o que quebraria o `next build`
 * (coleta de páginas) se este módulo fosse avaliado no topo sem
 * OPENAI_API_KEY configurada — o fallback é opcional e pode não estar
 * configurado em todo ambiente. O erro só deve acontecer em runtime, se
 * o fallback for de fato exercitado sem a chave.
 */
function getClient(): OpenAI {
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return cachedClient;
}

async function completeJson(params: {
  systemPrompt?: string;
  userPrompt: string;
  schemaName: string;
  jsonSchema: Record<string, unknown>;
}) {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      ...(params.systemPrompt
        ? [{ role: "system" as const, content: params.systemPrompt }]
        : []),
      { role: "user" as const, content: params.userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: params.schemaName,
        strict: true,
        schema: params.jsonSchema,
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  return JSON.parse(content ?? "{}");
}

const objectiveQuestionsJsonSchema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          statement: { type: "string" },
          options: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", enum: ["A", "B", "C", "D"] },
                text: { type: "string" },
              },
              required: ["id", "text"],
              additionalProperties: false,
            },
          },
          correctOptionId: { type: "string", enum: ["A", "B", "C", "D"] },
          explanation: { type: "string" },
        },
        required: ["statement", "options", "correctOptionId", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};

const discursiveQuestionJsonSchema = {
  type: "object",
  properties: {
    statement: { type: "string" },
    expectedTopics: { type: "array", items: { type: "string" } },
    rubric: { type: "string" },
  },
  required: ["statement", "expectedTopics", "rubric"],
  additionalProperties: false,
};

const gradeResultJsonSchema = {
  type: "object",
  properties: {
    score: { type: "number" },
    feedback: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    weaknesses: { type: "array", items: { type: "string" } },
  },
  required: ["score", "feedback", "strengths", "weaknesses"],
  additionalProperties: false,
};

const parsedEditalJsonSchema = {
  type: "object",
  properties: {
    orgao: { type: ["string", "null"] },
    cargo: { type: ["string", "null"] },
    examDate: { type: ["string", "null"] },
    registrationDeadline: { type: ["string", "null"] },
    resultDate: { type: ["string", "null"] },
    disciplinas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          bloco: { type: "string", enum: ["BASICO", "GERAL", "ESPECIFICO"] },
          nome: { type: "string" },
          numQuestoes: { type: ["integer", "null"] },
          peso: { type: ["number", "null"] },
        },
        required: ["bloco", "nome", "numQuestoes", "peso"],
        additionalProperties: false,
      },
    },
    cronograma: {
      type: "array",
      items: {
        type: "object",
        properties: {
          evento: { type: "string" },
          dataInicio: { type: "string" },
          dataFim: { type: ["string", "null"] },
          tipo: {
            type: "string",
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
        additionalProperties: false,
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
  additionalProperties: false,
};

export const openaiProvider: AIProvider = {
  async generateObjectiveQuestions(input) {
    const prompt = buildGerarQuestaoObjetivaPrompt(input);

    const raw = await completeJson({
      userPrompt: prompt,
      schemaName: "objective_questions",
      jsonSchema: objectiveQuestionsJsonSchema,
    });

    return generatedObjectiveQuestionsSchema.parse(raw.questions ?? []);
  },

  async generateDiscursiveQuestion(input) {
    const prompt = buildGerarQuestaoDiscursivaPrompt(input);

    const raw = await completeJson({
      userPrompt: prompt,
      schemaName: "discursive_question",
      jsonSchema: discursiveQuestionJsonSchema,
    });

    return generatedDiscursiveQuestionSchema.parse(raw);
  },

  async gradeDiscursive(input) {
    const prompt = buildCorrigirDiscursivaPrompt(input);

    const raw = await completeJson({
      userPrompt: prompt,
      schemaName: "grade_result",
      jsonSchema: gradeResultJsonSchema,
    });

    return gradeResultSchema.parse(raw);
  },

  async parseEdital(input) {
    const runOnce = async (correctionHint?: string) => {
      const prompt = buildParsearEditalPrompt(input.rawText, correctionHint);

      const raw = await completeJson({
        userPrompt: prompt,
        schemaName: "parsed_edital",
        jsonSchema: parsedEditalJsonSchema,
      });

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
