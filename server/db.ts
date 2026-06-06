/**
 * server/db.ts — Firebase Firestore implementation
 * Полностью заменяет MySQL/Drizzle. Все функции сохраняют оригинальные сигнатуры.
 *
 * Коллекции Firestore:
 *   users, institutions, institution_photos, institution_documents,
 *   institution_specializations, reviews, news, user_preferences,
 *   bookmarks, publication_requests, notifications, site_stats, contact_messages
 *
 * ID-стратегия: числовые id хранятся в поле документа, document id = строка.
 * Для совместимости с остальным кодом все функции возвращают объекты с числовым id.
 */

import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { ENV } from "./_core/env";

// ─── Init ─────────────────────────────────────────────────────────────────────

let _app: App | null = null;
let _db: Firestore | null = null;

function getDb(): Firestore {
  if (_db) return _db;

  if (!getApps().length) {
    // Если задан путь к service account JSON
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const sa = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      _app = initializeApp({ credential: cert(sa), projectId: ENV.firebaseProjectId });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      // Переменная окружения с JSON-строкой
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      _app = initializeApp({ credential: cert(sa), projectId: ENV.firebaseProjectId });
    } else {
      // Application Default Credentials (Google Cloud / эмулятор)
      _app = initializeApp({ projectId: ENV.firebaseProjectId });
    }
  } else {
    _app = getApps()[0]!;
  }

  _db = getFirestore(_app);

  // Эмулятор для локальной разработки
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    _db.settings({ host: process.env.FIRESTORE_EMULATOR_HOST, ssl: false });
  }

  return _db;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Конвертация Firestore Timestamp → Date */
function tsToDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") return new Date(val);
  return new Date();
}

/** Нормализует документ Firestore — превращает Timestamp в Date */
function normalize<T extends Record<string, unknown>>(data: T): T {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v instanceof Timestamp) result[k] = v.toDate();
    else result[k] = v;
  }
  return result as T;
}

/** Генератор числового ID через атомарный счётчик в Firestore */
async function nextId(counterName: string): Promise<number> {
  const db = getDb();
  const ref = db.collection("_counters").doc(counterName);
  const result = await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const current = (doc.data()?.value as number) ?? 0;
    const next = current + 1;
    tx.set(ref, { value: next });
    return next;
  });
  return result;
}

// ─── Types (повторяют схему Drizzle, но без зависимости от drizzle-orm) ───────

export type UserRole = "user" | "editor" | "representative" | "admin";
export type InstitutionStatus = "draft" | "pending" | "published" | "rejected";
export type InstitutionType = "university" | "college" | "institute" | "academy" | "school" | "other";
export type NewsStatus = "draft" | "published";
export type DocType = "brochure" | "certificate" | "accreditation" | "other";
export type CostType = "free" | "paid" | "mixed";
export type BudgetType = "free" | "paid" | "any";
export type PubStatus = "pending" | "approved" | "rejected";
export type ContactType = "feedback" | "cooperation" | "add_institution" | "other";

export interface User {
  id: number;
  openId: string;
  customId?: string | null;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role: UserRole;
  avatar?: string | null;
  bio?: string | null;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}
export type InsertUser = Partial<User> & { openId: string };

export interface Institution {
  id: number;
  slug: string;
  name: string;
  type: InstitutionType;
  city: string;
  region?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  socialVk?: string | null;
  socialTelegram?: string | null;
  socialInstagram?: string | null;
  logoKey?: string | null;
  logoUrl?: string | null;
  coverImageKey?: string | null;
  coverImageUrl?: string | null;
  directorName?: string | null;
  foundedYear?: number | null;
  lat?: string | null;
  lng?: string | null;
  status: InstitutionStatus;
  viewCount: number;
  isFeatured: boolean;
  featuredOrder?: number | null;
  promotionBadge?: string | null;
  createdBy?: number | null;
  representativeId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstitutionPhoto {
  id: number;
  institutionId: number;
  url: string;
  fileKey: string;
  caption?: string | null;
  displayOrder?: number | null;
  createdAt: Date;
}

export interface InstitutionDocument {
  id: number;
  institutionId: number;
  type: DocType;
  url: string;
  fileKey: string;
  name: string;
  createdAt: Date;
}

export interface InstitutionSpecialization {
  id: number;
  institutionId: number;
  name: string;
  cost?: CostType | null;
  description?: string | null;
}

export interface Review {
  id: number;
  institutionId: number;
  userId: number;
  rating: number;
  text?: string | null;
  representativeReply?: string | null;
  replyAt?: Date | null;
  createdAt: Date;
}

export interface News {
  id: number;
  title: string;
  slug: string;
  content?: string | null;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  coverImageKey?: string | null;
  authorId?: number | null;
  status: NewsStatus;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  id: number;
  userId: number;
  preferredTypes?: string[] | null;
  preferredCities?: string[] | null;
  preferredSpecializations?: string[] | null;
  budget?: BudgetType | null;
  additionalInfo?: string | null;
  updatedAt: Date;
}

export interface Bookmark {
  id: number;
  userId: number;
  institutionId: number;
  createdAt: Date;
}

export interface PublicationRequest {
  id: number;
  institutionId: number;
  editorId: number;
  status: PubStatus;
  rejectionReason?: string | null;
  reviewedBy?: number | null;
  reviewedAt?: Date | null;
  createdAt: Date;
}

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message?: string | null;
  isRead: boolean;
  relatedId?: number | null;
  createdAt: Date;
}

export interface SiteStat {
  id: number;
  date: string;
  pageViews: number;
  registrations: number;
  activeUsers: number;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  type?: ContactType | null;
  createdAt: Date;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = getDb();

  // Ищем существующего пользователя по openId
  const snap = await db.collection("users").where("openId", "==", user.openId).limit(1).get();

  const now = new Date();

  if (snap.empty) {
    // Создаём нового
    const id = await nextId("users");
    const role: UserRole =
      user.openId === ENV.ownerOpenId ? "admin" : (user.role ?? "user");
    const data: Record<string, unknown> = {
      id,
      openId: user.openId,
      customId: user.customId ?? null,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      role,
      avatar: user.avatar ?? null,
      bio: user.bio ?? null,
      isBlocked: false,
      createdAt: now,
      updatedAt: now,
      lastSignedIn: user.lastSignedIn ?? now,
    };
    await db.collection("users").doc(String(id)).set(data);
  } else {
    // Обновляем существующего
    const docRef = snap.docs[0]!.ref;
    const existing = snap.docs[0]!.data() as Record<string, unknown>;
    const update: Record<string, unknown> = { updatedAt: now };

    if (user.name !== undefined) update.name = user.name ?? null;
    if (user.email !== undefined) update.email = user.email ?? null;
    if (user.loginMethod !== undefined) update.loginMethod = user.loginMethod ?? null;
    if (user.lastSignedIn !== undefined) update.lastSignedIn = user.lastSignedIn;
    else update.lastSignedIn = now;

    if (user.role !== undefined) update.role = user.role;
    else if (user.openId === ENV.ownerOpenId) update.role = "admin";

    // Не перезаписываем role если пользователь уже admin и новый role не задан
    if (!update.role && existing.role) update.role = existing.role;

    await docRef.update(update);
  }
}

function docToUser(data: Record<string, unknown>): User {
  return normalize({
    id: data.id as number,
    openId: data.openId as string,
    customId: (data.customId as string) ?? null,
    name: (data.name as string) ?? null,
    email: (data.email as string) ?? null,
    loginMethod: (data.loginMethod as string) ?? null,
    role: (data.role as UserRole) ?? "user",
    avatar: (data.avatar as string) ?? null,
    bio: (data.bio as string) ?? null,
    isBlocked: Boolean(data.isBlocked),
    createdAt: tsToDate(data.createdAt),
    updatedAt: tsToDate(data.updatedAt),
    lastSignedIn: tsToDate(data.lastSignedIn),
  });
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = getDb();
  const snap = await db.collection("users").where("openId", "==", openId).limit(1).get();
  if (snap.empty) return undefined;
  return docToUser(snap.docs[0]!.data() as Record<string, unknown>);
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = getDb();
  const doc = await db.collection("users").doc(String(id)).get();
  if (!doc.exists) return undefined;
  return docToUser(doc.data() as Record<string, unknown>);
}

export async function getUserByCustomId(customId: string): Promise<User | undefined> {
  const db = getDb();
  const snap = await db.collection("users").where("customId", "==", customId).limit(1).get();
  if (snap.empty) return undefined;
  return docToUser(snap.docs[0]!.data() as Record<string, unknown>);
}

export async function listUsers(page = 1, limit = 20): Promise<User[]> {
  const db = getDb();
  const snap = await db
    .collection("users")
    .orderBy("createdAt", "desc")
    .limit(limit)
    .offset((page - 1) * limit)
    .get();
  return snap.docs.map((d) => docToUser(d.data() as Record<string, unknown>));
}

export async function countUsers(): Promise<number> {
  const db = getDb();
  const snap = await db.collection("users").count().get();
  return snap.data().count;
}

export async function updateUserRole(userId: number, role: UserRole): Promise<void> {
  const db = getDb();
  await db.collection("users").doc(String(userId)).update({ role, updatedAt: new Date() });
}

export async function updateUserBlock(userId: number, isBlocked: boolean): Promise<void> {
  const db = getDb();
  await db.collection("users").doc(String(userId)).update({ isBlocked, updatedAt: new Date() });
}

export async function updateUserProfile(
  userId: number,
  data: { name?: string; bio?: string; avatar?: string; customId?: string }
): Promise<void> {
  const db = getDb();
  await db.collection("users").doc(String(userId)).update({ ...data, updatedAt: new Date() });
}

// ─── Institutions ─────────────────────────────────────────────────────────────

function docToInstitution(data: Record<string, unknown>): Institution {
  return normalize({
    id: data.id as number,
    slug: data.slug as string,
    name: data.name as string,
    type: (data.type as InstitutionType) ?? "other",
    city: data.city as string,
    region: (data.region as string) ?? "Ростовская область",
    shortDescription: (data.shortDescription as string) ?? null,
    description: (data.description as string) ?? null,
    address: (data.address as string) ?? null,
    phone: (data.phone as string) ?? null,
    email: (data.email as string) ?? null,
    website: (data.website as string) ?? null,
    socialVk: (data.socialVk as string) ?? null,
    socialTelegram: (data.socialTelegram as string) ?? null,
    socialInstagram: (data.socialInstagram as string) ?? null,
    logoKey: (data.logoKey as string) ?? null,
    logoUrl: (data.logoUrl as string) ?? null,
    coverImageKey: (data.coverImageKey as string) ?? null,
    coverImageUrl: (data.coverImageUrl as string) ?? null,
    directorName: (data.directorName as string) ?? null,
    foundedYear: (data.foundedYear as number) ?? null,
    lat: (data.lat as string) ?? null,
    lng: (data.lng as string) ?? null,
    status: (data.status as InstitutionStatus) ?? "draft",
    viewCount: (data.viewCount as number) ?? 0,
    isFeatured: Boolean(data.isFeatured),
    featuredOrder: (data.featuredOrder as number) ?? 0,
    promotionBadge: (data.promotionBadge as string) ?? null,
    createdBy: (data.createdBy as number) ?? null,
    representativeId: (data.representativeId as number) ?? null,
    createdAt: tsToDate(data.createdAt),
    updatedAt: tsToDate(data.updatedAt),
  }) as Institution;
}

export async function listInstitutions(opts: {
  status?: InstitutionStatus;
  city?: string;
  type?: InstitutionType;
  search?: string;
  cost?: string;
  specialization?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "views" | "newest";
}): Promise<{ items: Institution[]; total: number }> {
  const db = getDb();
  let q: FirebaseFirestore.Query = db.collection("institutions");

  if (opts.status) q = q.where("status", "==", opts.status);
  if (opts.city) q = q.where("city", "==", opts.city);
  if (opts.type) q = q.where("type", "==", opts.type);

  // Firestore не поддерживает LIKE — делаем фильтрацию в памяти после получения
  const snap = await q.get();
  let items = snap.docs.map((d) => docToInstitution(d.data() as Record<string, unknown>));

  // Поиск по тексту в памяти
  if (opts.search) {
    const s = opts.search.toLowerCase();
    items = items.filter(
      (i) =>
        i.name.toLowerCase().includes(s) ||
        (i.shortDescription ?? "").toLowerCase().includes(s) ||
        i.city.toLowerCase().includes(s)
    );
  }

  const total = items.length;

  // Сортировка
  if (opts.sortBy === "views") {
    items.sort((a, b) => b.viewCount - a.viewCount);
  } else if (opts.sortBy === "newest") {
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else {
    items.sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }

  // Пагинация
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 12;
  const paginated = items.slice((page - 1) * limit, page * limit);

  return { items: paginated, total };
}

export async function getInstitutionBySlug(slug: string): Promise<Institution | undefined> {
  const db = getDb();
  const snap = await db.collection("institutions").where("slug", "==", slug).limit(1).get();
  if (snap.empty) return undefined;
  return docToInstitution(snap.docs[0]!.data() as Record<string, unknown>);
}

export async function getInstitutionById(id: number): Promise<Institution | undefined> {
  const db = getDb();
  const doc = await db.collection("institutions").doc(String(id)).get();
  if (!doc.exists) return undefined;
  return docToInstitution(doc.data() as Record<string, unknown>);
}

export async function getFeaturedInstitutions(): Promise<Institution[]> {
  const db = getDb();
  const snap = await db
    .collection("institutions")
    .where("isFeatured", "==", true)
    .where("status", "==", "published")
    .orderBy("featuredOrder")
    .limit(5)
    .get();
  return snap.docs.map((d) => docToInstitution(d.data() as Record<string, unknown>));
}

export async function getTopInstitutions(limit = 5): Promise<Institution[]> {
  const db = getDb();
  const snap = await db
    .collection("institutions")
    .where("status", "==", "published")
    .orderBy("viewCount", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => docToInstitution(d.data() as Record<string, unknown>));
}

export async function createInstitution(
  data: Partial<Institution> & { name: string; city: string; slug: string; createdBy: number }
): Promise<number> {
  const db = getDb();
  const id = await nextId("institutions");
  const now = new Date();
  await db.collection("institutions").doc(String(id)).set({
    id,
    ...data,
    viewCount: 0,
    isFeatured: false,
    featuredOrder: 0,
    status: data.status ?? "draft",
    region: data.region ?? "Ростовская область",
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateInstitution(id: number, data: Partial<Institution>): Promise<void> {
  const db = getDb();
  await db.collection("institutions").doc(String(id)).update({ ...data, updatedAt: new Date() });
}

export async function deleteInstitution(id: number): Promise<void> {
  const db = getDb();
  await db.collection("institutions").doc(String(id)).delete();
}

export async function incrementViewCount(id: number): Promise<void> {
  const db = getDb();
  await db.collection("institutions").doc(String(id)).update({
    viewCount: FieldValue.increment(1),
  });
}

export async function getDistinctCities(): Promise<string[]> {
  const db = getDb();
  const snap = await db
    .collection("institutions")
    .where("status", "==", "published")
    .select("city")
    .get();
  const cities = new Set(snap.docs.map((d) => d.data().city as string));
  return Array.from(cities).sort();
}

// ─── Institution Photos ───────────────────────────────────────────────────────

export async function getInstitutionPhotos(institutionId: number): Promise<InstitutionPhoto[]> {
  const db = getDb();
  const snap = await db
    .collection("institution_photos")
    .where("institutionId", "==", institutionId)
    .orderBy("displayOrder")
    .get();
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return normalize({
      id: data.id as number,
      institutionId: data.institutionId as number,
      url: data.url as string,
      fileKey: data.fileKey as string,
      caption: (data.caption as string) ?? null,
      displayOrder: (data.displayOrder as number) ?? 0,
      createdAt: tsToDate(data.createdAt),
    });
  });
}

export async function addInstitutionPhoto(data: {
  institutionId: number;
  url: string;
  fileKey: string;
  caption?: string;
  displayOrder?: number;
}): Promise<void> {
  const db = getDb();
  const id = await nextId("institution_photos");
  await db.collection("institution_photos").doc(String(id)).set({
    id,
    ...data,
    caption: data.caption ?? null,
    displayOrder: data.displayOrder ?? 0,
    createdAt: new Date(),
  });
}

export async function deleteInstitutionPhoto(id: number): Promise<void> {
  const db = getDb();
  await db.collection("institution_photos").doc(String(id)).delete();
}

// ─── Institution Documents ────────────────────────────────────────────────────

export async function getInstitutionDocuments(institutionId: number): Promise<InstitutionDocument[]> {
  const db = getDb();
  const snap = await db
    .collection("institution_documents")
    .where("institutionId", "==", institutionId)
    .get();
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return normalize({
      id: data.id as number,
      institutionId: data.institutionId as number,
      type: (data.type as DocType) ?? "other",
      url: data.url as string,
      fileKey: data.fileKey as string,
      name: data.name as string,
      createdAt: tsToDate(data.createdAt),
    });
  });
}

export async function addInstitutionDocument(data: {
  institutionId: number;
  type: DocType;
  url: string;
  fileKey: string;
  name: string;
}): Promise<void> {
  const db = getDb();
  const id = await nextId("institution_documents");
  await db.collection("institution_documents").doc(String(id)).set({
    id,
    ...data,
    createdAt: new Date(),
  });
}

export async function deleteInstitutionDocument(id: number): Promise<void> {
  const db = getDb();
  await db.collection("institution_documents").doc(String(id)).delete();
}

// ─── Specializations ─────────────────────────────────────────────────────────

export async function getInstitutionSpecializations(
  institutionId: number
): Promise<InstitutionSpecialization[]> {
  const db = getDb();
  const snap = await db
    .collection("institution_specializations")
    .where("institutionId", "==", institutionId)
    .get();
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: data.id as number,
      institutionId: data.institutionId as number,
      name: data.name as string,
      cost: (data.cost as CostType) ?? null,
      description: (data.description as string) ?? null,
    };
  });
}

export async function upsertSpecializations(
  institutionId: number,
  specs: Array<{ name: string; cost?: CostType; description?: string }>
): Promise<void> {
  const db = getDb();

  // Удаляем старые специальности пакетно
  const existing = await db
    .collection("institution_specializations")
    .where("institutionId", "==", institutionId)
    .get();

  const batch = db.batch();
  existing.docs.forEach((d) => batch.delete(d.ref));

  for (const spec of specs) {
    const id = await nextId("institution_specializations");
    const ref = db.collection("institution_specializations").doc(String(id));
    batch.set(ref, {
      id,
      institutionId,
      name: spec.name,
      cost: spec.cost ?? null,
      description: spec.description ?? null,
    });
  }

  await batch.commit();
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export async function getReviews(institutionId: number): Promise<Review[]> {
  const db = getDb();
  const snap = await db
    .collection("reviews")
    .where("institutionId", "==", institutionId)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return normalize({
      id: data.id as number,
      institutionId: data.institutionId as number,
      userId: data.userId as number,
      rating: data.rating as number,
      text: (data.text as string) ?? null,
      representativeReply: (data.representativeReply as string) ?? null,
      replyAt: data.replyAt ? tsToDate(data.replyAt) : null,
      createdAt: tsToDate(data.createdAt),
    });
  });
}

export async function createReview(data: {
  institutionId: number;
  userId: number;
  rating: number;
  text?: string;
}): Promise<void> {
  const db = getDb();
  const id = await nextId("reviews");
  await db.collection("reviews").doc(String(id)).set({
    id,
    ...data,
    text: data.text ?? null,
    representativeReply: null,
    replyAt: null,
    createdAt: new Date(),
  });
}

export async function addReviewReply(reviewId: number, reply: string): Promise<void> {
  const db = getDb();
  await db.collection("reviews").doc(String(reviewId)).update({
    representativeReply: reply,
    replyAt: new Date(),
  });
}

export async function deleteReview(id: number): Promise<void> {
  const db = getDb();
  await db.collection("reviews").doc(String(id)).delete();
}

export async function getAverageRating(institutionId: number): Promise<number> {
  const db = getDb();
  const snap = await db
    .collection("reviews")
    .where("institutionId", "==", institutionId)
    .get();
  if (snap.empty) return 0;
  const sum = snap.docs.reduce((acc, d) => acc + ((d.data().rating as number) ?? 0), 0);
  return sum / snap.size;
}

// ─── News ─────────────────────────────────────────────────────────────────────

function docToNews(data: Record<string, unknown>): News {
  return normalize({
    id: data.id as number,
    title: data.title as string,
    slug: data.slug as string,
    content: (data.content as string) ?? null,
    excerpt: (data.excerpt as string) ?? null,
    coverImageUrl: (data.coverImageUrl as string) ?? null,
    coverImageKey: (data.coverImageKey as string) ?? null,
    authorId: (data.authorId as number) ?? null,
    status: (data.status as NewsStatus) ?? "draft",
    publishedAt: data.publishedAt ? tsToDate(data.publishedAt) : null,
    createdAt: tsToDate(data.createdAt),
    updatedAt: tsToDate(data.updatedAt),
  }) as News;
}

export async function listNews(opts: {
  status?: NewsStatus;
  page?: number;
  limit?: number;
}): Promise<{ items: News[]; total: number }> {
  const db = getDb();
  let q: FirebaseFirestore.Query = db.collection("news");
  if (opts.status) q = q.where("status", "==", opts.status);
  q = q.orderBy("publishedAt", "desc");

  const snap = await q.get();
  const all = snap.docs.map((d) => docToNews(d.data() as Record<string, unknown>));
  const total = all.length;

  const page = opts.page ?? 1;
  const limit = opts.limit ?? 10;
  return { items: all.slice((page - 1) * limit, page * limit), total };
}

export async function getNewsBySlug(slug: string): Promise<News | undefined> {
  const db = getDb();
  const snap = await db.collection("news").where("slug", "==", slug).limit(1).get();
  if (snap.empty) return undefined;
  return docToNews(snap.docs[0]!.data() as Record<string, unknown>);
}

export async function createNews(
  data: Partial<News> & { title: string; slug: string; authorId: number }
): Promise<number> {
  const db = getDb();
  const id = await nextId("news");
  const now = new Date();
  await db.collection("news").doc(String(id)).set({
    id,
    ...data,
    status: data.status ?? "draft",
    publishedAt: data.publishedAt ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateNews(id: number, data: Partial<News>): Promise<void> {
  const db = getDb();
  await db.collection("news").doc(String(id)).update({ ...data, updatedAt: new Date() });
}

export async function deleteNews(id: number): Promise<void> {
  const db = getDb();
  await db.collection("news").doc(String(id)).delete();
}

// ─── User Preferences ─────────────────────────────────────────────────────────

export async function getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
  const db = getDb();
  const snap = await db
    .collection("user_preferences")
    .where("userId", "==", userId)
    .limit(1)
    .get();
  if (snap.empty) return undefined;
  const data = snap.docs[0]!.data() as Record<string, unknown>;
  return normalize({
    id: data.id as number,
    userId: data.userId as number,
    preferredTypes: (data.preferredTypes as string[]) ?? null,
    preferredCities: (data.preferredCities as string[]) ?? null,
    preferredSpecializations: (data.preferredSpecializations as string[]) ?? null,
    budget: (data.budget as BudgetType) ?? null,
    additionalInfo: (data.additionalInfo as string) ?? null,
    updatedAt: tsToDate(data.updatedAt),
  });
}

export async function upsertUserPreferences(
  userId: number,
  data: Partial<UserPreferences>
): Promise<void> {
  const db = getDb();
  const snap = await db
    .collection("user_preferences")
    .where("userId", "==", userId)
    .limit(1)
    .get();

  const now = new Date();
  if (snap.empty) {
    const id = await nextId("user_preferences");
    await db.collection("user_preferences").doc(String(id)).set({
      id,
      userId,
      ...data,
      updatedAt: now,
    });
  } else {
    await snap.docs[0]!.ref.update({ ...data, updatedAt: now });
  }
}

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export async function getUserBookmarks(userId: number): Promise<Bookmark[]> {
  const db = getDb();
  const snap = await db
    .collection("bookmarks")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return normalize({
      id: data.id as number,
      userId: data.userId as number,
      institutionId: data.institutionId as number,
      createdAt: tsToDate(data.createdAt),
    });
  });
}

export async function addBookmark(userId: number, institutionId: number): Promise<void> {
  const db = getDb();
  // Проверка дублирования
  const exists = await db
    .collection("bookmarks")
    .where("userId", "==", userId)
    .where("institutionId", "==", institutionId)
    .limit(1)
    .get();
  if (!exists.empty) return;

  const id = await nextId("bookmarks");
  await db.collection("bookmarks").doc(String(id)).set({
    id,
    userId,
    institutionId,
    createdAt: new Date(),
  });
}

export async function removeBookmark(userId: number, institutionId: number): Promise<void> {
  const db = getDb();
  const snap = await db
    .collection("bookmarks")
    .where("userId", "==", userId)
    .where("institutionId", "==", institutionId)
    .limit(1)
    .get();
  if (!snap.empty) await snap.docs[0]!.ref.delete();
}

export async function isBookmarked(userId: number, institutionId: number): Promise<boolean> {
  const db = getDb();
  const snap = await db
    .collection("bookmarks")
    .where("userId", "==", userId)
    .where("institutionId", "==", institutionId)
    .limit(1)
    .get();
  return !snap.empty;
}

// ─── Publication Requests ─────────────────────────────────────────────────────

function docToPubReq(data: Record<string, unknown>): PublicationRequest {
  return normalize({
    id: data.id as number,
    institutionId: data.institutionId as number,
    editorId: data.editorId as number,
    status: (data.status as PubStatus) ?? "pending",
    rejectionReason: (data.rejectionReason as string) ?? null,
    reviewedBy: (data.reviewedBy as number) ?? null,
    reviewedAt: data.reviewedAt ? tsToDate(data.reviewedAt) : null,
    createdAt: tsToDate(data.createdAt),
  });
}

export async function createPublicationRequest(
  institutionId: number,
  editorId: number
): Promise<number> {
  const db = getDb();
  const id = await nextId("publication_requests");
  await db.collection("publication_requests").doc(String(id)).set({
    id,
    institutionId,
    editorId,
    status: "pending",
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date(),
  });
  return id;
}

export async function getPublicationRequestById(
  id: number
): Promise<PublicationRequest | undefined> {
  const db = getDb();
  const doc = await db.collection("publication_requests").doc(String(id)).get();
  if (!doc.exists) return undefined;
  return docToPubReq(doc.data() as Record<string, unknown>);
}

export async function getAdminUsers(): Promise<User[]> {
  const db = getDb();
  const snap = await db.collection("users").where("role", "==", "admin").get();
  return snap.docs.map((d) => docToUser(d.data() as Record<string, unknown>));
}

export async function listPublicationRequests(
  status?: PubStatus
): Promise<PublicationRequest[]> {
  const db = getDb();
  // Firestore требует составной индекс для orderBy+where — фильтруем в памяти
  let q: FirebaseFirestore.Query = db.collection("publication_requests");
  if (status) q = q.where("status", "==", status);
  const snap = await q.get();
  const items = snap.docs.map((d) => docToPubReq(d.data() as Record<string, unknown>));
  return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function updatePublicationRequest(
  id: number,
  data: { status: PubStatus; rejectionReason?: string; reviewedBy: number }
): Promise<void> {
  const db = getDb();
  await db.collection("publication_requests").doc(String(id)).update({
    ...data,
    reviewedAt: new Date(),
  });
}

export async function getPublicationRequestsByEditor(
  editorId: number
): Promise<PublicationRequest[]> {
  const db = getDb();
  const snap = await db
    .collection("publication_requests")
    .where("editorId", "==", editorId)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((d) => docToPubReq(d.data() as Record<string, unknown>));
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function createNotification(data: {
  userId: number;
  type: string;
  title: string;
  message?: string;
  relatedId?: number;
}): Promise<void> {
  const db = getDb();
  const id = await nextId("notifications");
  await db.collection("notifications").doc(String(id)).set({
    id,
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message ?? null,
    isRead: false,
    relatedId: data.relatedId ?? null,
    createdAt: new Date(),
  });
}

export async function getUserNotifications(userId: number): Promise<Notification[]> {
  const db = getDb();
  const snap = await db
    .collection("notifications")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return normalize({
      id: data.id as number,
      userId: data.userId as number,
      type: data.type as string,
      title: data.title as string,
      message: (data.message as string) ?? null,
      isRead: Boolean(data.isRead),
      relatedId: (data.relatedId as number) ?? null,
      createdAt: tsToDate(data.createdAt),
    });
  });
}

export async function markNotificationRead(id: number): Promise<void> {
  const db = getDb();
  await db.collection("notifications").doc(String(id)).update({ isRead: true });
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  const db = getDb();
  const snap = await db
    .collection("notifications")
    .where("userId", "==", userId)
    .where("isRead", "==", false)
    .get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.update(d.ref, { isRead: true }));
  await batch.commit();
}

export async function countUnreadNotifications(userId: number): Promise<number> {
  const db = getDb();
  const snap = await db
    .collection("notifications")
    .where("userId", "==", userId)
    .where("isRead", "==", false)
    .count()
    .get();
  return snap.data().count;
}

// ─── Site Stats ───────────────────────────────────────────────────────────────

export async function upsertDailyStat(
  date: string,
  field: "pageViews" | "registrations" | "activeUsers"
): Promise<void> {
  const db = getDb();
  const ref = db.collection("site_stats").doc(date);
  await db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) {
      tx.set(ref, { date, pageViews: 0, registrations: 0, activeUsers: 0, [field]: 1 });
    } else {
      tx.update(ref, { [field]: FieldValue.increment(1) });
    }
  });
}

export async function getSiteStats(): Promise<{
  totalInstitutions: number;
  totalUsers: number;
  totalCities: number;
  totalPublished: number;
}> {
  const db = getDb();
  const [instSnap, usersSnap, publishedSnap, citiesSnap] = await Promise.all([
    db.collection("institutions").count().get(),
    db.collection("users").count().get(),
    db.collection("institutions").where("status", "==", "published").count().get(),
    db.collection("institutions").where("status", "==", "published").select("city").get(),
  ]);
  const cities = new Set(citiesSnap.docs.map((d) => d.data().city as string));
  return {
    totalInstitutions: instSnap.data().count,
    totalUsers: usersSnap.data().count,
    totalPublished: publishedSnap.data().count,
    totalCities: cities.size,
  };
}

// ─── Contact Messages ─────────────────────────────────────────────────────────

export async function createContactMessage(data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  type?: ContactType;
}): Promise<void> {
  const db = getDb();
  const id = await nextId("contact_messages");
  await db.collection("contact_messages").doc(String(id)).set({
    id,
    name: data.name,
    email: data.email,
    subject: data.subject ?? null,
    message: data.message,
    type: data.type ?? "feedback",
    createdAt: new Date(),
  });
}
