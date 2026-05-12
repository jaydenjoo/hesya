import "server-only";
import {
  and,
  bookings,
  customerSavedStores,
  desc,
  eq,
  gt,
  inArray,
  lte,
  reviews,
  services,
  staff,
  stores,
  type DbClient,
} from "@hesya/database";

/**
 * Plan v3 M3.4 — customer mypage 데이터 조회.
 *
 * 4개 탭별 DAL:
 *   - listUpcomingBookings: scheduled 상태 + scheduled_at > now()
 *   - listPastBookings: completed/no_show/cancelled OR scheduled_at <= now()
 *   - listSavedStoresByCustomer: customer_saved_stores JOIN stores
 *   - listPendingReviewBookings: 완료된 booking 중 customer review 미작성
 *   - listReviewsByCustomer: 손님 작성 리뷰 list (mypage Reviews "Done" 화면용)
 *
 * 모든 함수는 customerId로 격리 — application 레벨 인증으로 자기 데이터만 보장.
 */

export interface CustomerBookingRow {
  id: string;
  storeId: string | null;
  storeName: string | null;
  serviceName: string | null;
  staffName: string | null;
  scheduledAt: Date;
  status: string | null;
  totalPriceKrw: number | null;
}

export async function listUpcomingBookings(
  db: DbClient,
  customerId: string,
): Promise<CustomerBookingRow[]> {
  const rows = await db
    .select({
      id: bookings.id,
      storeId: bookings.storeId,
      storeName: stores.name,
      serviceName: services.nameKo,
      staffName: staff.name,
      scheduledAt: bookings.scheduledAt,
      status: bookings.status,
      totalPriceKrw: bookings.totalPriceKrw,
    })
    .from(bookings)
    .leftJoin(stores, eq(bookings.storeId, stores.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(staff, eq(bookings.staffId, staff.id))
    .where(
      and(
        eq(bookings.customerId, customerId),
        eq(bookings.status, "scheduled"),
        gt(bookings.scheduledAt, new Date()),
      ),
    )
    .orderBy(bookings.scheduledAt);
  return rows;
}

export async function listPastBookings(
  db: DbClient,
  customerId: string,
  limit = 50,
): Promise<CustomerBookingRow[]> {
  const rows = await db
    .select({
      id: bookings.id,
      storeId: bookings.storeId,
      storeName: stores.name,
      serviceName: services.nameKo,
      staffName: staff.name,
      scheduledAt: bookings.scheduledAt,
      status: bookings.status,
      totalPriceKrw: bookings.totalPriceKrw,
    })
    .from(bookings)
    .leftJoin(stores, eq(bookings.storeId, stores.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(staff, eq(bookings.staffId, staff.id))
    .where(
      and(
        eq(bookings.customerId, customerId),
        // scheduled + 과거 || completed/no_show/cancelled
        // SQL OR 구성 단순화 위해 inArray로 분기 — scheduled는 별도 처리 시 over-fetch 우려 적음
        inArray(bookings.status, ["completed", "no_show", "cancelled"]),
      ),
    )
    .orderBy(desc(bookings.scheduledAt))
    .limit(limit);
  // 추가로 status=scheduled + scheduledAt 과거인 케이스 (사장이 처리 안 한 노쇼)
  const overdue = await db
    .select({
      id: bookings.id,
      storeId: bookings.storeId,
      storeName: stores.name,
      serviceName: services.nameKo,
      staffName: staff.name,
      scheduledAt: bookings.scheduledAt,
      status: bookings.status,
      totalPriceKrw: bookings.totalPriceKrw,
    })
    .from(bookings)
    .leftJoin(stores, eq(bookings.storeId, stores.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .leftJoin(staff, eq(bookings.staffId, staff.id))
    .where(
      and(
        eq(bookings.customerId, customerId),
        eq(bookings.status, "scheduled"),
        lte(bookings.scheduledAt, new Date()),
      ),
    )
    .orderBy(desc(bookings.scheduledAt))
    .limit(limit);
  return [...rows, ...overdue]
    .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
    .slice(0, limit);
}

export interface SavedStoreRow {
  storeId: string;
  storeName: string | null;
  savedAt: Date;
}

export async function listSavedStoresByCustomer(
  db: DbClient,
  customerId: string,
): Promise<SavedStoreRow[]> {
  return db
    .select({
      storeId: customerSavedStores.storeId,
      storeName: stores.name,
      savedAt: customerSavedStores.createdAt,
    })
    .from(customerSavedStores)
    .leftJoin(stores, eq(customerSavedStores.storeId, stores.id))
    .where(eq(customerSavedStores.customerId, customerId))
    .orderBy(desc(customerSavedStores.createdAt));
}

export async function saveStoreForCustomer(
  db: DbClient,
  customerId: string,
  storeId: string,
): Promise<void> {
  // ON CONFLICT DO NOTHING — 중복 호출 시 silent. Drizzle .onConflictDoNothing()
  await db
    .insert(customerSavedStores)
    .values({ customerId, storeId })
    .onConflictDoNothing();
}

export async function unsaveStoreForCustomer(
  db: DbClient,
  customerId: string,
  storeId: string,
): Promise<void> {
  await db
    .delete(customerSavedStores)
    .where(
      and(
        eq(customerSavedStores.customerId, customerId),
        eq(customerSavedStores.storeId, storeId),
      ),
    );
}

export interface PendingReviewRow {
  bookingId: string;
  storeId: string | null;
  storeName: string | null;
  serviceName: string | null;
  scheduledAt: Date;
}

/**
 * 완료된 booking 중 customer review 미작성 list.
 *
 * 손님 review = reviews WHERE customer_id = ? AND booking_id IS NOT NULL.
 * 같은 bookingId의 customer review 이미 있으면 제외.
 */
export async function listPendingReviewBookings(
  db: DbClient,
  customerId: string,
): Promise<PendingReviewRow[]> {
  const completed = await db
    .select({
      bookingId: bookings.id,
      storeId: bookings.storeId,
      storeName: stores.name,
      serviceName: services.nameKo,
      scheduledAt: bookings.scheduledAt,
    })
    .from(bookings)
    .leftJoin(stores, eq(bookings.storeId, stores.id))
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(
      and(
        eq(bookings.customerId, customerId),
        eq(bookings.status, "completed"),
      ),
    )
    .orderBy(desc(bookings.scheduledAt));

  const reviewed = await db
    .select({ bookingId: reviews.bookingId })
    .from(reviews)
    .where(
      and(eq(reviews.customerId, customerId), eq(reviews.source, "customer")),
    );
  const reviewedSet = new Set(reviewed.map((r) => r.bookingId).filter(Boolean));
  return completed.filter((b) => !reviewedSet.has(b.bookingId));
}

export interface CustomerReviewRow {
  id: string;
  storeId: string | null;
  storeName: string | null;
  bookingId: string | null;
  rating: number | null;
  content: string | null;
  language: string | null;
  fetchedAt: Date | null;
}

export async function listReviewsByCustomer(
  db: DbClient,
  customerId: string,
): Promise<CustomerReviewRow[]> {
  return db
    .select({
      id: reviews.id,
      storeId: reviews.storeId,
      storeName: stores.name,
      bookingId: reviews.bookingId,
      rating: reviews.rating,
      content: reviews.content,
      language: reviews.language,
      fetchedAt: reviews.fetchedAt,
    })
    .from(reviews)
    .leftJoin(stores, eq(reviews.storeId, stores.id))
    .where(
      and(eq(reviews.customerId, customerId), eq(reviews.source, "customer")),
    )
    .orderBy(desc(reviews.fetchedAt));
}

export interface SubmitReviewInput {
  customerId: string;
  bookingId: string;
  storeId: string;
  rating: number;
  content: string;
  language: string;
}

export async function submitCustomerReview(
  db: DbClient,
  input: SubmitReviewInput,
): Promise<{ id: string }> {
  const [created] = await db
    .insert(reviews)
    .values({
      customerId: input.customerId,
      bookingId: input.bookingId,
      storeId: input.storeId,
      rating: input.rating,
      content: input.content,
      language: input.language,
      source: "customer",
      fetchedAt: new Date(),
    })
    .returning({ id: reviews.id });
  if (!created) {
    throw new Error("submitCustomerReview: insert returned no row");
  }
  return { id: created.id };
}
