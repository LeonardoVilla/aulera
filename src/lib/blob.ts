import { put } from "@vercel/blob";

/**
 * Faz upload do PDF de um edital para o Vercel Blob e retorna a URL pública.
 *
 * IMPORTANTE: requer a variável de ambiente `BLOB_READ_WRITE_TOKEN` apontando
 * para um Vercel Blob store real. Enquanto essa variável não estiver
 * configurada, esta função vai falhar em runtime ao ser chamada (o SDK do
 * `@vercel/blob` lança erro ao tentar autenticar sem token). Isso não afeta
 * o build/type-check, apenas o uso real do upload.
 */
export async function uploadEditalPdf(
  file: File,
  userId: string,
): Promise<{ url: string }> {
  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const pathname = `editais/${userId}/${timestamp}-${safeFileName}`;

  const blob = await put(pathname, file, {
    access: "public",
    contentType: file.type || "application/pdf",
  });

  return { url: blob.url };
}
