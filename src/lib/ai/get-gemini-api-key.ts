import "server-only";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";

/**
 * Resolve qual chave de API do Gemini deve ser usada: se houver uma
 * integração "gemini" habilitada com uma chave override salva no banco
 * (painel admin de integrações), usa essa chave descriptografada;
 * caso contrário, cai para a variável de ambiente `GEMINI_API_KEY`.
 *
 * NOTA DE INTEGRAÇÃO: esta função ainda NÃO é usada por
 * `src/lib/ai/gemini-provider.ts`. Aquele módulo instancia o client
 * `GoogleGenAI` uma única vez, de forma síncrona, no top-level do arquivo
 * (`const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })`).
 * Passar a resolver a chave de forma assíncrona exigiria reestruturar todas
 * as funções exportadas desse provider (que hoje são chamadas em rotas
 * críticas já em produção: geração de questões objetivas/discursivas,
 * correção de discursivas e parsing de edital) para instanciar o client
 * sob demanda. Optou-se por deixar essa função pronta e isolada, sem
 * integrá-la ainda, para não arriscar regressão nessas funcionalidades
 * centrais — ver relatório da Fase 8 para detalhes da decisão.
 */
export async function resolveGeminiApiKey(): Promise<string> {
  const integration = await prisma.integration.findUnique({
    where: { provider: "gemini" },
  });

  if (integration?.isEnabled && integration.encryptedKey) {
    return decrypt(integration.encryptedKey);
  }

  return process.env.GEMINI_API_KEY ?? "";
}
