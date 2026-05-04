import "server-only";
import { randomUUID } from "node:crypto";
import { sql, type DbClient } from "@hesya/database";

function uuidToBuffer(uuid: string): Buffer {
  return Buffer.from(uuid.replace(/-/g, ""), "hex");
}

function bufferToUuid(buf: Buffer): string {
  const hex = buf.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function encryptToken(
  db: DbClient,
  plaintext: string,
): Promise<Buffer> {
  const name = `tok_${randomUUID()}`;
  const rows = (await db.execute(sql`
    SELECT vault.create_secret(${plaintext}, ${name}) AS id
  `)) as unknown as { id: string }[];
  if (!rows[0]?.id) {
    throw new Error("vault.create_secret returned no id");
  }
  return uuidToBuffer(rows[0].id);
}

export async function decryptToken(
  db: DbClient,
  blob: Buffer,
): Promise<string> {
  if (blob.length !== 16) {
    throw new Error(
      `decryptToken: expected 16-byte UUID buffer, got ${blob.length}`,
    );
  }
  const id = bufferToUuid(blob);
  const rows = (await db.execute(sql`
    SELECT decrypted_secret FROM vault.decrypted_secrets WHERE id = ${id}::uuid
  `)) as unknown as { decrypted_secret: string | null }[];
  const secret = rows[0]?.decrypted_secret;
  if (secret == null) {
    throw new Error(`decryptToken: no secret found for id ${id}`);
  }
  return secret;
}
