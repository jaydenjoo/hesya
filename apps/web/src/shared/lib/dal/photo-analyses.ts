import "server-only";
import { desc, eq, photoAnalyses, type DbClient } from "@hesya/database";

/**
 * Plan v4 Epic B — AI Photo Analysis DAL.
 *
 * 외국인 손님이 업로드한 사진과 Claude Opus 4.7 Vision API 분석 결과를 관리.
 * status 흐름: pending → analyzing → completed | failed.
 */

export interface CreatePhotoAnalysisInput {
  readonly customerId?: string | null;
  readonly storeId?: string | null;
  readonly imageUrl: string;
}

export interface PhotoAnalysisRow {
  readonly id: string;
  readonly customerId: string | null;
  readonly storeId: string | null;
  readonly imageUrl: string;
  readonly status: string;
  readonly styleName: string | null;
  readonly difficulty: string | null;
  readonly estimatedMinutes: number | null;
  readonly compatibilityNote: string | null;
  readonly confidence: number | null;
  readonly errorMessage: string | null;
  readonly resultJsonb: unknown;
  readonly createdAt: Date;
}

export async function createPhotoAnalysis(
  db: DbClient,
  input: CreatePhotoAnalysisInput,
): Promise<string> {
  const [row] = await db
    .insert(photoAnalyses)
    .values({
      customerId: input.customerId ?? null,
      storeId: input.storeId ?? null,
      imageUrl: input.imageUrl,
      status: "pending",
    })
    .returning({ id: photoAnalyses.id });
  if (!row) throw new Error("createPhotoAnalysis: insert returned no row");
  return row.id;
}

export async function setPhotoAnalysisAnalyzing(
  db: DbClient,
  id: string,
): Promise<void> {
  await db
    .update(photoAnalyses)
    .set({ status: "analyzing" })
    .where(eq(photoAnalyses.id, id));
}

export interface PhotoAnalysisResult {
  readonly styleName: string;
  readonly difficulty: "easy" | "medium" | "hard";
  readonly estimatedMinutes: number;
  readonly compatibilityNote: string;
  readonly confidence: number;
  readonly resultJsonb: unknown;
}

export async function completePhotoAnalysis(
  db: DbClient,
  id: string,
  result: PhotoAnalysisResult,
): Promise<void> {
  await db
    .update(photoAnalyses)
    .set({
      status: "completed",
      styleName: result.styleName,
      difficulty: result.difficulty,
      estimatedMinutes: result.estimatedMinutes,
      compatibilityNote: result.compatibilityNote,
      confidence: result.confidence.toFixed(2),
      resultJsonb: result.resultJsonb as never,
    })
    .where(eq(photoAnalyses.id, id));
}

export async function failPhotoAnalysis(
  db: DbClient,
  id: string,
  errorMessage: string,
): Promise<void> {
  await db
    .update(photoAnalyses)
    .set({
      status: "failed",
      errorMessage,
    })
    .where(eq(photoAnalyses.id, id));
}

export async function getPhotoAnalysisById(
  db: DbClient,
  id: string,
): Promise<PhotoAnalysisRow | null> {
  const rows = await db
    .select({
      id: photoAnalyses.id,
      customerId: photoAnalyses.customerId,
      storeId: photoAnalyses.storeId,
      imageUrl: photoAnalyses.imageUrl,
      status: photoAnalyses.status,
      styleName: photoAnalyses.styleName,
      difficulty: photoAnalyses.difficulty,
      estimatedMinutes: photoAnalyses.estimatedMinutes,
      compatibilityNote: photoAnalyses.compatibilityNote,
      confidence: photoAnalyses.confidence,
      errorMessage: photoAnalyses.errorMessage,
      resultJsonb: photoAnalyses.resultJsonb,
      createdAt: photoAnalyses.createdAt,
    })
    .from(photoAnalyses)
    .where(eq(photoAnalyses.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    ...row,
    confidence: row.confidence ? Number(row.confidence) : null,
  };
}

export async function listPhotoAnalysesByCustomer(
  db: DbClient,
  customerId: string,
  limit = 10,
): Promise<PhotoAnalysisRow[]> {
  const rows = await db
    .select({
      id: photoAnalyses.id,
      customerId: photoAnalyses.customerId,
      storeId: photoAnalyses.storeId,
      imageUrl: photoAnalyses.imageUrl,
      status: photoAnalyses.status,
      styleName: photoAnalyses.styleName,
      difficulty: photoAnalyses.difficulty,
      estimatedMinutes: photoAnalyses.estimatedMinutes,
      compatibilityNote: photoAnalyses.compatibilityNote,
      confidence: photoAnalyses.confidence,
      errorMessage: photoAnalyses.errorMessage,
      resultJsonb: photoAnalyses.resultJsonb,
      createdAt: photoAnalyses.createdAt,
    })
    .from(photoAnalyses)
    .where(eq(photoAnalyses.customerId, customerId))
    .orderBy(desc(photoAnalyses.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    ...r,
    confidence: r.confidence ? Number(r.confidence) : null,
  }));
}
