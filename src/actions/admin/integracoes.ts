"use server";

import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";
import Stripe from "stripe";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  gemini: "Gemini (Google AI)",
  stripe: "Stripe",
  vercel_blob: "Vercel Blob",
};

function displayNameFor(provider: string): string {
  return PROVIDER_DISPLAY_NAMES[provider] ?? provider;
}

export async function salvarApiKey(formData: FormData) {
  const admin = await requireAdmin();

  const provider = String(formData.get("provider") ?? "").trim();
  const apiKey = String(formData.get("apiKey") ?? "").trim();

  if (!provider || !PROVIDER_DISPLAY_NAMES[provider]) {
    throw new Error("Provedor inválido.");
  }
  if (!apiKey) {
    throw new Error("Informe uma chave de API válida.");
  }

  const encryptedKey = encrypt(apiKey);
  const keyLastFour = apiKey.slice(-4);

  await prisma.integration.upsert({
    where: { provider },
    create: {
      provider,
      displayName: displayNameFor(provider),
      encryptedKey,
      keyLastFour,
      rotatedAt: new Date(),
      status: "DESCONHECIDO",
    },
    update: {
      encryptedKey,
      keyLastFour,
      rotatedAt: new Date(),
      status: "DESCONHECIDO",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "integration.key.rotate",
      targetType: "Integration",
      targetId: provider,
      metadata: { provider },
    },
  });

  revalidatePath("/admin/integracoes");
  revalidatePath(`/admin/integracoes/${provider}`);
}

async function resolveKeyForTest(provider: string): Promise<string | null> {
  const integration = await prisma.integration.findUnique({ where: { provider } });
  if (integration?.encryptedKey) {
    return decrypt(integration.encryptedKey);
  }
  return null;
}

async function testGemini(): Promise<boolean> {
  const overrideKey = await resolveKeyForTest("gemini");
  const apiKey = overrideKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey) return false;

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: "ok",
  });
  return typeof response.text === "string";
}

async function testStripe(): Promise<boolean> {
  const overrideKey = await resolveKeyForTest("stripe");
  const apiKey = overrideKey ?? process.env.STRIPE_SECRET_KEY;
  if (!apiKey) return false;

  const stripe = new Stripe(apiKey);
  await stripe.balance.retrieve();
  return true;
}

async function testVercelBlob(): Promise<boolean> {
  // O SDK @vercel/blob não expõe uma chamada trivial de "ping"/health-check.
  // Como aproximação, verificamos apenas se o token necessário está presente
  // (override salvo no banco ainda não é suportado para este provedor, pois
  // o SDK usa a env var BLOB_READ_WRITE_TOKEN internamente em cada chamada,
  // não aceitando token por instância de forma simples em todas as versões).
  const overrideKey = await resolveKeyForTest("vercel_blob");
  const token = overrideKey ?? process.env.BLOB_READ_WRITE_TOKEN;
  return Boolean(token && token.length > 0);
}

export async function testarConexao(provider: string) {
  await requireAdmin();

  let ok = false;
  try {
    if (provider === "gemini") {
      ok = await testGemini();
    } else if (provider === "stripe") {
      ok = await testStripe();
    } else if (provider === "vercel_blob") {
      ok = await testVercelBlob();
    } else {
      throw new Error("Provedor desconhecido.");
    }
  } catch {
    ok = false;
  }

  await prisma.integration.upsert({
    where: { provider },
    create: {
      provider,
      displayName: displayNameFor(provider),
      status: ok ? "OK" : "ERRO",
      lastCheckedAt: new Date(),
    },
    update: {
      status: ok ? "OK" : "ERRO",
      lastCheckedAt: new Date(),
    },
  });

  revalidatePath("/admin/integracoes");
  return { ok };
}

export async function alternarIntegracao(provider: string, enabled: boolean) {
  const admin = await requireAdmin();

  await prisma.integration.upsert({
    where: { provider },
    create: {
      provider,
      displayName: displayNameFor(provider),
      isEnabled: enabled,
    },
    update: {
      isEnabled: enabled,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: "integration.toggle",
      targetType: "Integration",
      targetId: provider,
      metadata: { provider, enabled },
    },
  });

  revalidatePath("/admin/integracoes");
}
