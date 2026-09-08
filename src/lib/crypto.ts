import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Criptografia simétrica (AES-256-GCM) para segredos armazenados em banco
 * (ex.: chaves de API de integrações administradas em runtime).
 *
 * A chave de 32 bytes exigida pelo AES-256 é derivada da env var
 * `ENCRYPTION_SECRET` via SHA-256. Optamos por um hash simples (em vez de
 * `scryptSync`, que é uma KDF lenta pensada para senhas de usuário sujeitas
 * a força bruta) porque `ENCRYPTION_SECRET` já deve ser um segredo aleatório
 * de alta entropia gerado uma única vez (ex.: `openssl rand -hex 32`), não
 * uma senha memorizável — não há necessidade de custo computacional extra
 * para dificultar tentativas de adivinhação.
 *
 * Formato do ciphertext (string única, fácil de armazenar em uma coluna
 * de texto): `<ivHex>:<authTagHex>:<encryptedHex>`.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // recomendado para GCM

function getDerivedKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error(
      "ENCRYPTION_SECRET não está configurada. Defina uma string secreta " +
        "de alta entropia nessa variável de ambiente antes de usar " +
        "encrypt()/decrypt() (ex.: `openssl rand -hex 32`).",
    );
  }
  return createHash("sha256").update(secret).digest();
}

export function encrypt(plaintext: string): string {
  const key = getDerivedKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(ciphertext: string): string {
  const key = getDerivedKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Formato de ciphertext inválido para decrypt().");
  }
  const [ivHex, authTagHex, encryptedHex] = parts;

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
