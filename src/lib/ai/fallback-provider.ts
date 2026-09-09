import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
import type { AIProvider } from "@/lib/ai/provider";
import { geminiProvider } from "@/lib/ai/gemini-provider";
import { openaiProvider, OPENAI_MODEL } from "@/lib/ai/openai-provider";
import { logAIUsage } from "@/lib/ai/usage-tracker";

const GEMINI_MODEL = "gemini-3.6-flash";

/**
 * Guarda qual modelo atendeu a última chamada feita através de `aiProvider`
 * dentro do contexto assíncrono atual, para que o chamador (as Server
 * Actions que fazem o próprio logAIUsage) possa registrar o modelo correto
 * mesmo quando o fallback para OpenAI é acionado. Usamos AsyncLocalStorage
 * em vez de uma variável de módulo simples para não vazar entre chamadas
 * concorrentes de requisições diferentes.
 */
const lastUsedModelStorage = new AsyncLocalStorage<{ model: string }>();

export function getLastUsedAIModel(): string {
  return lastUsedModelStorage.getStore()?.model ?? GEMINI_MODEL;
}

/**
 * Erros de quota/rate limit (429) ou de indisponibilidade temporária do
 * serviço (503, "model overloaded/high demand") costumam vir com um código
 * HTTP específico, mas cada SDK expõe isso de um jeito diferente (status,
 * code, mensagem, ou até aninhado num campo `error` dentro da mensagem, como
 * faz o SDK do Gemini). Detectamos de forma heurística para não depender de
 * um único formato — em qualquer um desses casos, vale tentar o outro
 * provedor em vez de propagar o erro direto ao usuário.
 */
function isTransientProviderError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const err = error as {
    status?: number;
    code?: string | number;
    message?: string;
  };

  if (err.status === 429 || err.status === 503) return true;
  if (
    err.code === "RESOURCE_EXHAUSTED" ||
    err.code === "rate_limit_exceeded" ||
    err.code === "UNAVAILABLE" ||
    err.code === 429 ||
    err.code === 503
  ) {
    return true;
  }

  // O SDK do Gemini (@google/genai) costuma embutir o corpo do erro da API
  // como uma string JSON dentro de `message`
  // (ex: `{"error":{"code":503,"status":"UNAVAILABLE",...}}`), em vez de
  // expor `status`/`code` diretamente no objeto de erro. Tentamos parsear
  // esse formato antes de cair na checagem textual simples.
  if (err.message) {
    try {
      const parsed = JSON.parse(err.message) as {
        error?: { code?: number; status?: string };
      };
      const nestedCode = parsed.error?.code;
      const nestedStatus = parsed.error?.status;
      if (nestedCode === 429 || nestedCode === 503) return true;
      if (nestedStatus === "RESOURCE_EXHAUSTED" || nestedStatus === "UNAVAILABLE") {
        return true;
      }
    } catch {
      // Não era JSON — segue para a checagem textual abaixo.
    }
  }

  const message = err.message?.toLowerCase() ?? "";
  return (
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("resource_exhausted") ||
    message.includes("unavailable") ||
    message.includes("high demand") ||
    message.includes("overloaded") ||
    message.includes("429") ||
    message.includes("503")
  );
}

const isOpenAiConfigured = () => !!process.env.OPENAI_API_KEY;

/**
 * Provider com fallback automático: tenta sempre o Gemini primeiro (provider
 * principal); se a chamada falhar por quota/rate limit (429) ou por
 * indisponibilidade temporária do serviço (503/"high demand"), tenta a
 * mesma operação via OpenAI (gpt-5-mini), sem o chamador precisar saber
 * disso. Se o OpenAI também não estiver configurado (sem OPENAI_API_KEY), o
 * erro original do Gemini é relançado normalmente.
 *
 * Erros que não são transitórios (ex: validação de schema, entrada
 * inválida) não disparam o fallback — nesse caso o provider principal já
 * tem sua própria lógica de retry (ver geminiProvider.parseEdital), e um
 * erro de fato deve propagar.
 *
 * Use `getLastUsedAIModel()` logo após `await aiProvider.<operação>(...)`
 * para saber qual modelo respondeu, e registrar isso em logAIUsage.
 */
function withFallback<T extends keyof AIProvider>(
  operation: T,
): AIProvider[T] {
  return (async (...args: Parameters<AIProvider[T]>) => {
    try {
      // @ts-expect-error -- spread de args genérico por operação
      const result = await geminiProvider[operation](...args);
      lastUsedModelStorage.enterWith({ model: GEMINI_MODEL });
      return result;
    } catch (error) {
      if (!isTransientProviderError(error) || !isOpenAiConfigured()) {
        lastUsedModelStorage.enterWith({ model: GEMINI_MODEL });
        throw error;
      }

      await logAIUsage({
        operation: `fallback_openai_${String(operation)}`,
        model: GEMINI_MODEL,
        latencyMs: 0,
        success: false,
        errorMessage:
          error instanceof Error
            ? error.message
            : "Erro transitório no Gemini",
      });

      // @ts-expect-error -- spread de args genérico por operação
      const result = await openaiProvider[operation](...args);
      lastUsedModelStorage.enterWith({ model: OPENAI_MODEL });
      return result;
    }
  }) as AIProvider[T];
}

export const aiProvider: AIProvider = {
  generateObjectiveQuestions: withFallback("generateObjectiveQuestions"),
  generateDiscursiveQuestion: withFallback("generateDiscursiveQuestion"),
  gradeDiscursive: withFallback("gradeDiscursive"),
  parseEdital: withFallback("parseEdital"),
};
