import { and, desc, eq, ilike, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Bookmark,
  ContactMessage,
  InsertUser,
  Institution,
  InstitutionDocument,
  InstitutionPhoto,
  InstitutionSpecialization,
  News,
  Notification,
  PublicationRequest,
  Review,
  SiteStat,
  User,
  UserPreferences,
  bookmarks,
  contactMessages,
  institutionDocuments,
  institutionPhotos,
  institutionSpecializations,
  institutions,
  news,
  notifications,
  publicationRequests,
  reviews,
  siteStats,
  userPreferences,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByCustomId(customId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.customId, customId)).limit(1);
  return result[0];
}

export async function listUsers(page = 1, limit = 20): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
}

export async function countUsers(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(users);
  return Number(result[0]?.count ?? 0);
}

export async function updateUserRole(userId: number, role: User["role"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updateUserBlock(userId: number, isBlocked: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isBlocked }).where(eq(users.id, userId));
}

export async function updateUserProfile(
  userId: number,
  data: { name?: string; bio?: string; avatar?: string; customId?: string }
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

// ─── Institutions ─────────────────────────────────────────────────────────────

export async function listInstitutions(opts: {
  status?: Institution["status"];
  city?: string;
  type?: Institution["type"];
  search?: string;
  cost?: string;
  specialization?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "views" | "newest";
}): Promise<{ items: Institution[]; total: number }> {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const conditions = [];
  if (opts.status) conditions.push(eq(institutions.status, opts.status));
  if (opts.city) conditions.push(eq(institutions.city, opts.city));
  if (opts.type) conditions.push(eq(institutions.type, opts.type));
  if (opts.search) {
    conditions.push(
      or(
        like(institutions.name, `%${opts.search}%`),
        like(institutions.shortDescription, `%${opts.search}%`),
        like(institutions.city, `%${opts.search}%`)
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 12;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(institutions)
    .where(where);
  const total = Number(countResult[0]?.count ?? 0);

  let query = db.select().from(institutions).where(where);

  if (opts.sortBy === "views") {
    query = query.orderBy(desc(institutions.viewCount)) as typeof query;
  } else if (opts.sortBy === "newest") {
    query = query.orderBy(desc(institutions.createdAt)) as typeof query;
  } else {
    query = query.orderBy(institutions.name) as typeof query;
  }

  const items = await query.limit(limit).offset((page - 1) * limit);
  return { items, total };
}

export async function getInstitutionBySlug(slug: string): Promise<Institution | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(institutions).where(eq(institutions.slug, slug)).limit(1);
  return result[0];
}

export async function getInstitutionById(id: number): Promise<Institution | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(institutions).where(eq(institutions.id, id)).limit(1);
  return result[0];
}

export async function getFeaturedInstitutions(): Promise<Institution[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(institutions)
    .where(and(eq(institutions.isFeatured, true), eq(institutions.status, "published")))
    .orderBy(institutions.featuredOrder)
    .limit(5);
}

export async function getTopInstitutions(limit = 5): Promise<Institution[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(institutions)
    .where(eq(institutions.status, "published"))
    .orderBy(desc(institutions.viewCount))
    .limit(limit);
}

export async function createInstitution(data: Partial<Institution> & { name: string; city: string; slug: string; createdBy: number }): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(institutions).values(data as any);
  return (result as any)[0]?.insertId ?? 0;
}

export async function updateInstitution(id: number, data: Partial<Institution>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(institutions).set(data as any).where(eq(institutions.id, id));
}

export async function deleteInstitution(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(institutions).where(eq(institutions.id, id));
}

export async function incrementViewCount(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(institutions)
    .set({ viewCount: sql`${institutions.viewCount} + 1` })
    .where(eq(institutions.id, id));
}

export async function getDistinctCities(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .selectDistinct({ city: institutions.city })
    .from(institutions)
    .where(eq(institutions.status, "published"))
    .orderBy(institutions.city);
  return result.map((r) => r.city);
}

// ─── Institution Photos ───────────────────────────────────────────────────────

export async function getInstitutionPhotos(institutionId: number): Promise<InstitutionPhoto[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(institutionPhotos)
    .where(eq(institutionPhotos.institutionId, institutionId))
    .orderBy(institutionPhotos.displayOrder);
}

export async function addInstitutionPhoto(data: {
  institutionId: number;
  url: string;
  fileKey: string;
  caption?: string;
  displayOrder?: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(institutionPhotos).values(data);
}

export async function deleteInstitutionPhoto(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(institutionPhotos).where(eq(institutionPhotos.id, id));
}

// ─── Institution Documents ────────────────────────────────────────────────────

export async function getInstitutionDocuments(institutionId: number): Promise<InstitutionDocument[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(institutionDocuments)
    .where(eq(institutionDocuments.institutionId, institutionId));
}

export async function addInstitutionDocument(data: {
  institutionId: number;
  type: InstitutionDocument["type"];
  url: string;
  fileKey: string;
  name: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(institutionDocuments).values(data);
}

export async function deleteInstitutionDocument(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(institutionDocuments).where(eq(institutionDocuments.id, id));
}

// ─── Specializations ─────────────────────────────────────────────────────────

export async function getInstitutionSpecializations(institutionId: number): Promise<InstitutionSpecialization[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(institutionSpecializations)
    .where(eq(institutionSpecializations.institutionId, institutionId));
}

export async function upsertSpecializations(institutionId: number, specs: Array<{ name: string; cost?: "free" | "paid" | "mixed"; description?: string }>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(institutionSpecializations).where(eq(institutionSpecializations.institutionId, institutionId));
  if (specs.length > 0) {
    await db.insert(institutionSpecializations).values(specs.map((s) => ({ ...s, institutionId })));
  }
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function getReviews(institutionId: number): Promise<Review[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.institutionId, institutionId))
    .orderBy(desc(reviews.createdAt));
}

export async function createReview(data: {
  institutionId: number;
  userId: number;
  rating: number;
  text?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(reviews).values(data);
}

export async function addReviewReply(reviewId: number, reply: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(reviews)
    .set({ representativeReply: reply, replyAt: new Date() })
    .where(eq(reviews.id, reviewId));
}

export async function deleteReview(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(reviews).where(eq(reviews.id, id));
}

export async function getAverageRating(institutionId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ avg: sql<number>`avg(${reviews.rating})` })
    .from(reviews)
    .where(eq(reviews.institutionId, institutionId));
  return Number(result[0]?.avg ?? 0);
}

// ─── News ─────────────────────────────────────────────────────────────────────

export async function listNews(opts: { status?: News["status"]; page?: number; limit?: number }): Promise<{ items: News[]; total: number }> {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const where = opts.status ? eq(news.status, opts.status) : undefined;
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 10;

  const countResult = await db.select({ count: sql<number>`count(*)` }).from(news).where(where);
  const total = Number(countResult[0]?.count ?? 0);
  const items = await db
    .select()
    .from(news)
    .where(where)
    .orderBy(desc(news.publishedAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return { items, total };
}

export async function getNewsBySlug(slug: string): Promise<News | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(news).where(eq(news.slug, slug)).limit(1);
  return result[0];
}

export async function createNews(data: Partial<News> & { title: string; slug: string; authorId: number }): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(news).values(data as any);
  return (result as any)[0]?.insertId ?? 0;
}

export async function updateNews(id: number, data: Partial<News>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(news).set(data as any).where(eq(news.id, id));
}

export async function deleteNews(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(news).where(eq(news.id, id));
}

// ─── User Preferences ─────────────────────────────────────────────────────────

export async function getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return result[0];
}

export async function upsertUserPreferences(userId: number, data: Partial<UserPreferences>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .insert(userPreferences)
    .values({ userId, ...data } as any)
    .onDuplicateKeyUpdate({ set: data as any });
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export async function getUserBookmarks(userId: number): Promise<Bookmark[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookmarks).where(eq(bookmarks.userId, userId)).orderBy(desc(bookmarks.createdAt));
}

export async function addBookmark(userId: number, institutionId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(bookmarks).values({ userId, institutionId }).onDuplicateKeyUpdate({ set: { userId } });
}

export async function removeBookmark(userId: number, institutionId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(bookmarks).where(and(eq(bookmarks.userId, userId), eq(bookmarks.institutionId, institutionId)));
}

export async function isBookmarked(userId: number, institutionId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.institutionId, institutionId)))
    .limit(1);
  return result.length > 0;
}

// ─── Publication Requests ─────────────────────────────────────────────────────

export async function createPublicationRequest(institutionId: number, editorId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(publicationRequests).values({ institutionId, editorId });
  return (result as any)[0]?.insertId ?? 0;
}

export async function listPublicationRequests(status?: PublicationRequest["status"]): Promise<PublicationRequest[]> {
  const db = await getDb();
  if (!db) return [];
  const where = status ? eq(publicationRequests.status, status) : undefined;
  return db
    .select()
    .from(publicationRequests)
    .where(where)
    .orderBy(desc(publicationRequests.createdAt));
}

export async function updatePublicationRequest(
  id: number,
  data: { status: PublicationRequest["status"]; rejectionReason?: string; reviewedBy: number }
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(publicationRequests)
    .set({ ...data, reviewedAt: new Date() })
    .where(eq(publicationRequests.id, id));
}

export async function getPublicationRequestsByEditor(editorId: number): Promise<PublicationRequest[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(publicationRequests)
    .where(eq(publicationRequests.editorId, editorId))
    .orderBy(desc(publicationRequests.createdAt));
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function createNotification(data: {
  userId: number;
  type: string;
  title: string;
  message?: string;
  relatedId?: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function getUserNotifications(userId: number): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markNotificationRead(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function countUnreadNotifications(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return Number(result[0]?.count ?? 0);
}

// ─── Site Stats ───────────────────────────────────────────────────────────────

export async function upsertDailyStat(date: string, field: "pageViews" | "registrations" | "activeUsers"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const col = siteStats[field];
  await db
    .insert(siteStats)
    .values({ date, pageViews: 0, registrations: 0, activeUsers: 0, [field]: 1 })
    .onDuplicateKeyUpdate({ set: { [field]: sql`${col} + 1` } });
}

export async function getSiteStats(): Promise<{ totalInstitutions: number; totalUsers: number; totalCities: number; totalPublished: number }> {
  const db = await getDb();
  if (!db) return { totalInstitutions: 0, totalUsers: 0, totalCities: 0, totalPublished: 0 };

  const [instCount, userCount, publishedCount, cityCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(institutions),
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(institutions).where(eq(institutions.status, "published")),
    db.selectDistinct({ city: institutions.city }).from(institutions).where(eq(institutions.status, "published")),
  ]);

  return {
    totalInstitutions: Number(instCount[0]?.count ?? 0),
    totalUsers: Number(userCount[0]?.count ?? 0),
    totalCities: cityCount.length,
    totalPublished: Number(publishedCount[0]?.count ?? 0),
  };
}

// ─── Contact Messages ─────────────────────────────────────────────────────────

export async function createContactMessage(data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  type?: "feedback" | "cooperation" | "add_institution" | "other";
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(contactMessages).values(data);
}
