import {
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  customId: varchar("customId", { length: 32 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "editor", "representative", "admin"]).default("user").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  isBlocked: boolean("isBlocked").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Institutions ─────────────────────────────────────────────────────────────

export const institutions = mysqlTable("institutions", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  type: mysqlEnum("type", ["university", "college", "institute", "academy", "school", "other"]).notNull().default("college"),
  city: varchar("city", { length: 128 }).notNull(),
  region: varchar("region", { length: 128 }).default("Ростовская область"),
  shortDescription: text("shortDescription"),
  description: text("description"),
  address: text("address"),
  phone: varchar("phone", { length: 64 }),
  email: varchar("email", { length: 320 }),
  website: text("website"),
  socialVk: text("socialVk"),
  socialTelegram: text("socialTelegram"),
  socialInstagram: text("socialInstagram"),
  logoKey: text("logoKey"),
  logoUrl: text("logoUrl"),
  coverImageKey: text("coverImageKey"),
  coverImageUrl: text("coverImageUrl"),
  directorName: varchar("directorName", { length: 256 }),
  foundedYear: int("foundedYear"),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  status: mysqlEnum("status", ["draft", "pending", "published", "rejected"]).default("draft").notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  featuredOrder: int("featuredOrder").default(0),
  promotionBadge: varchar("promotionBadge", { length: 64 }),
  createdBy: int("createdBy"),
  representativeId: int("representativeId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Institution = typeof institutions.$inferSelect;
export type InsertInstitution = typeof institutions.$inferInsert;

// ─── Institution Photos ───────────────────────────────────────────────────────

export const institutionPhotos = mysqlTable("institution_photos", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institutionId").notNull(),
  url: text("url").notNull(),
  fileKey: text("fileKey").notNull(),
  caption: text("caption"),
  displayOrder: int("displayOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InstitutionPhoto = typeof institutionPhotos.$inferSelect;

// ─── Institution Documents ────────────────────────────────────────────────────

export const institutionDocuments = mysqlTable("institution_documents", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institutionId").notNull(),
  type: mysqlEnum("type", ["brochure", "certificate", "accreditation", "other"]).notNull().default("other"),
  url: text("url").notNull(),
  fileKey: text("fileKey").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InstitutionDocument = typeof institutionDocuments.$inferSelect;

// ─── Institution Specializations ──────────────────────────────────────────────

export const institutionSpecializations = mysqlTable("institution_specializations", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institutionId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  cost: mysqlEnum("cost", ["free", "paid", "mixed"]).default("paid"),
  description: text("description"),
});

export type InstitutionSpecialization = typeof institutionSpecializations.$inferSelect;

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institutionId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(),
  text: text("text"),
  representativeReply: text("representativeReply"),
  replyAt: timestamp("replyAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;

// ─── News ─────────────────────────────────────────────────────────────────────

export const news = mysqlTable("news", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 512 }).notNull(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  content: text("content"),
  excerpt: text("excerpt"),
  coverImageUrl: text("coverImageUrl"),
  coverImageKey: text("coverImageKey"),
  authorId: int("authorId"),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type News = typeof news.$inferSelect;

// ─── User Preferences ─────────────────────────────────────────────────────────

export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  preferredTypes: json("preferredTypes").$type<string[]>(),
  preferredCities: json("preferredCities").$type<string[]>(),
  preferredSpecializations: json("preferredSpecializations").$type<string[]>(),
  budget: mysqlEnum("budget", ["free", "paid", "any"]).default("any"),
  additionalInfo: text("additionalInfo"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;

// ─── Bookmarks ────────────────────────────────────────────────────────────────

export const bookmarks = mysqlTable("bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  institutionId: int("institutionId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bookmark = typeof bookmarks.$inferSelect;

// ─── Publication Requests ─────────────────────────────────────────────────────

export const publicationRequests = mysqlTable("publication_requests", {
  id: int("id").autoincrement().primaryKey(),
  institutionId: int("institutionId").notNull(),
  editorId: int("editorId").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  rejectionReason: text("rejectionReason"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PublicationRequest = typeof publicationRequests.$inferSelect;

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message"),
  isRead: boolean("isRead").default(false).notNull(),
  relatedId: int("relatedId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ─── Site Stats ───────────────────────────────────────────────────────────────

export const siteStats = mysqlTable("site_stats", {
  id: int("id").autoincrement().primaryKey(),
  date: varchar("date", { length: 16 }).notNull().unique(),
  pageViews: int("pageViews").default(0).notNull(),
  registrations: int("registrations").default(0).notNull(),
  activeUsers: int("activeUsers").default(0).notNull(),
});

export type SiteStat = typeof siteStats.$inferSelect;

// ─── Contact Messages ─────────────────────────────────────────────────────────

export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 512 }),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["feedback", "cooperation", "add_institution", "other"]).default("feedback"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
