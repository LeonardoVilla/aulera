import { extractText, getDocumentProxy } from "unpdf";

/**
 * Extrai o texto completo de um PDF usando `unpdf` (baseado em pdf.js,
 * serverless-friendly). Recebe o binário do PDF e retorna o texto de todas
 * as páginas concatenado.
 */
export async function extractTextFromPdf(
  buffer: ArrayBuffer | Uint8Array,
): Promise<string> {
  const data =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  const pdf = await getDocumentProxy(data);
  const { text } = await extractText(pdf, { mergePages: true });

  return text;
}
