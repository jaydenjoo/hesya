/**
 * Plan v3 M3.2 / Phase D3-C2 — Customers shared row type.
 *
 * customers DAL `CustomerListRow`와 동기. UI 모듈 (table / filter-row /
 * detail-sheet / manager) 간 공유.
 */

export interface CustomerRow {
  readonly id: string;
  readonly name: string | null;
  readonly channel: string | null;
  readonly externalId: string | null;
  readonly nationality: string | null;
  readonly preferredLanguage: string | null;
  readonly totalVisits: number | null;
  readonly ltvKrw: number | null;
  readonly allergyNote: string | null;
  readonly preferredDesigner: string | null;
}
