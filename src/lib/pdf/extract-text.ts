import { extractText, getDocumentProxy } from "unpdf";

/**
 * Extrai o texto completo de um PDF usando `unpdf` (baseado em pdf.js,
 * serverless-friendly). Recebe o binário do PDF e retorna o texto de todas
 * as páginas concatenado.
 */
export async function extractTextFromPdf(
  buffer: ArrayBuffer | Uint8Array,
): Promise<string> {
  // `unpdf`/pdf.js exige um Uint8Array "puro": rejeita instâncias de
  // Buffer do Node (que technically `instanceof Uint8Array === true`, por
  // ser subclasse, mas falham na validação interna da lib) com o erro
  // "Please provide binary data as `Uint8Array`, rather than `Buffer`."
  // Por isso sempre recriamos um Uint8Array novo a partir dos bytes, em vez
  // de reaproveitar a instância recebida quando ela já "parece" um
  // Uint8Array.
  const data = new Uint8Array(
    buffer instanceof ArrayBuffer
      ? buffer
      : buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  );

  const pdf = await getDocumentProxy(data);
  const { text } = await extractText(pdf, { mergePages: true });

  return text;
}
