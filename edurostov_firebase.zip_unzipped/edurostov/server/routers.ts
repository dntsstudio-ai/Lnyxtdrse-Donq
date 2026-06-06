import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import {
  getReviews,
  addBookmark,
  addInstitutionDocument,
  addInstitutionPhoto,
  addReviewReply,
  countUnreadNotifications,
  countUsers,
  createContactMessage,
  createInstitution,
  createNews,
  createNotification,
  createPublicationRequest,
  createReview,
  deleteInstitution,
  deleteInstitutionDocument,
  deleteInstitutionPhoto,
  deleteNews,
  deleteReview,
  getAverageRating,
  getDistinctCities,
  getFeaturedInstitutions,
  getInstitutionById,
  getInstitutionBySlug,
  getInstitutionDocuments,
  getInstitutionPhotos,
  getInstitutionSpecializations,
  getNewsBySlug,
  getSiteStats,
  getTopInstitutions,
  getUserBookmarks,
  getUserById,
  getUserByCustomId,
  getUserNotifications,
  getUserPreferences,
  incrementViewCount,
  isBookmarked,
  listInstitutions,
  listNews,
  listPublicationRequests,
  listUsers,
  markAllNotificationsRead,
  markNotificationRead,
  removeBookmark,
  updateInstitution,
  updateNews,
  updatePublicationRequest,
  updateUserBlock,
  updateUserProfile,
  updateUserRole,
  upsertDailyStat,
  upsertSpecializations,
  upsertUser,
  upsertUserPreferences,
  getPublicationRequestsByEditor,
} from "./db";

// ─── Role Guards ──────────────────────────────────────────────────────────────

const editorProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.user?.role;
  if (!role || !["editor", "representative", "admin"].includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Editor access required" });
  }
  return next({ ctx });
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

const representativeProcedure = protectedProcedure.use(({ ctx, next }) => {
  const role = ctx.user?.role;
  if (!role || !["representative", "admin"].includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Representative access required" });
  }
  return next({ ctx });
});

// ─── Institutions Router ──────────────────────────────────────────────────────

const institutionsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        status: z.enum(["draft", "pending", "published", "rejected"]).optional(),
        city: z.string().optional(),
        type: z.enum(["university", "college", "institute", "academy", "school", "other"]).optional(),
        search: z.string().optional(),
        cost: z.string().optional(),
        specialization: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(12),
        sortBy: z.enum(["name", "views", "newest"]).default("views"),
        editorView: z.boolean().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const isEditor = ctx.user && ["editor", "representative", "admin"].includes(ctx.user.role);
      const status = input.editorView && isEditor ? input.status : "published";
      return listInstitutions({ ...input, status });
    }),

  getFeatured: publicProcedure.query(() => getFeaturedInstitutions()),

  getTop: publicProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(({ input }) => getTopInstitutions(input.limit)),

  getCities: publicProcedure.query(() => getDistinctCities()),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const inst = await getInstitutionBySlug(input.slug);
      if (!inst) throw new TRPCError({ code: "NOT_FOUND" });
      if (inst.status !== "published") {
        const isEditor = ctx.user && ["editor", "representative", "admin"].includes(ctx.user.role);
        if (!isEditor) throw new TRPCError({ code: "NOT_FOUND" });
      }
      const [photos, documents, specializations, avgRating] = await Promise.all([
        getInstitutionPhotos(inst.id),
        getInstitutionDocuments(inst.id),
        getInstitutionSpecializations(inst.id),
        getAverageRating(inst.id),
      ]);
      const bookmarked = ctx.user ? await isBookmarked(ctx.user.id, inst.id) : false;
      return { ...inst, photos, documents, specializations, avgRating, bookmarked };
    }),

  incrementView: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => incrementViewCount(input.id)),

  create: editorProcedure
    .input(
      z.object({
        name: z.string().min(2),
        city: z.string().min(2),
        type: z.enum(["university", "college", "institute", "academy", "school", "other"]),
        slug: z.string().min(2),
        shortDescription: z.string().optional(),
        description: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
        directorName: z.string().optional(),
        foundedYear: z.number().optional(),
        lat: z.string().optional(),
        lng: z.string().optional(),
        socialVk: z.string().optional(),
        socialTelegram: z.string().optional(),
        socialInstagram: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const id = await createInstitution({ ...input, createdBy: ctx.user.id });
      return { id };
    }),

  update: editorProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        city: z.string().optional(),
        type: z.enum(["university", "college", "institute", "academy", "school", "other"]).optional(),
        shortDescription: z.string().optional(),
        description: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
        directorName: z.string().optional(),
        foundedYear: z.number().optional(),
        lat: z.string().optional(),
        lng: z.string().optional(),
        socialVk: z.string().optional(),
        socialTelegram: z.string().optional(),
        socialInstagram: z.string().optional(),
        logoUrl: z.string().optional(),
        logoKey: z.string().optional(),
        coverImageUrl: z.string().optional(),
        coverImageKey: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const inst = await getInstitutionById(input.id);
      if (!inst) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.role === "representative" && inst.representativeId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...data } = input;
      await updateInstitution(id, data as any);
      return { success: true };
    }),

  submitForReview: editorProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await updateInstitution(input.id, { status: "pending" });
      await createPublicationRequest(input.id, ctx.user.id);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteInstitution(input.id);
      return { success: true };
    }),

  updateSpecializations: editorProcedure
    .input(
      z.object({
        institutionId: z.number(),
        specializations: z.array(
          z.object({
            name: z.string(),
            cost: z.enum(["free", "paid", "mixed"]).optional(),
            description: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      await upsertSpecializations(input.institutionId, input.specializations);
      return { success: true };
    }),

  addPhoto: editorProcedure
    .input(
      z.object({
        institutionId: z.number(),
        url: z.string(),
        fileKey: z.string(),
        caption: z.string().optional(),
        displayOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await addInstitutionPhoto(input);
      return { success: true };
    }),

  deletePhoto: editorProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteInstitutionPhoto(input.id);
      return { success: true };
    }),

  addDocument: editorProcedure
    .input(
      z.object({
        institutionId: z.number(),
        type: z.enum(["brochure", "certificate", "accreditation", "other"]),
        url: z.string(),
        fileKey: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await addInstitutionDocument(input);
      return { success: true };
    }),

  deleteDocument: editorProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteInstitutionDocument(input.id);
      return { success: true };
    }),

  assignRepresentative: adminProcedure
    .input(z.object({ institutionId: z.number(), userId: z.number() }))
    .mutation(async ({ input }) => {
      await updateInstitution(input.institutionId, { representativeId: input.userId });
      await updateUserRole(input.userId, "representative");
      return { success: true };
    }),

  setFeatured: adminProcedure
    .input(z.object({ id: z.number(), isFeatured: z.boolean(), featuredOrder: z.number().optional(), promotionBadge: z.string().optional() }))
    .mutation(async ({ input }) => {
      await updateInstitution(input.id, {
        isFeatured: input.isFeatured,
        featuredOrder: input.featuredOrder ?? 0,
        promotionBadge: input.promotionBadge,
      });
      return { success: true };
    }),
});

// ─── Reviews Router ───────────────────────────────────────────────────────────

const reviewsRouter = router({
  list: publicProcedure
    .input(z.object({ institutionId: z.number() }))
    .query(async ({ input }) => {
      const reviewList = await getReviews(input.institutionId);
      const userIds = Array.from(new Set(reviewList.map((r: { userId: number }) => r.userId)));
      const userMap: Record<number, { name: string | null; avatar: string | null }> = {};
      for (const uid of userIds) {
        const u = await getUserById(uid);
        if (u) userMap[uid] = { name: u.name, avatar: u.avatar };
      }
      return reviewList.map((r: { userId: number }) => ({ ...r, user: userMap[r.userId] }));
    }),

  create: protectedProcedure
    .input(z.object({ institutionId: z.number(), rating: z.number().min(1).max(5), text: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      await createReview({ ...input, userId: ctx.user.id });
      return { success: true };
    }),

  addReply: representativeProcedure
    .input(z.object({ reviewId: z.number(), reply: z.string() }))
    .mutation(async ({ input }) => {
      await addReviewReply(input.reviewId, input.reply);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteReview(input.id);
      return { success: true };
    }),
});

// ─── News Router ──────────────────────────────────────────────────────────────

const newsRouter = router({
  list: publicProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(10), all: z.boolean().optional() }))
    .query(async ({ input, ctx }) => {
      const isEditor = ctx.user && ["editor", "admin"].includes(ctx.user.role);
      const status = input.all && isEditor ? undefined : "published";
      return listNews({ status, page: input.page, limit: input.limit });
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const article = await getNewsBySlug(input.slug);
      if (!article) throw new TRPCError({ code: "NOT_FOUND" });
      if (article.status !== "published") {
        const isEditor = ctx.user && ["editor", "admin"].includes(ctx.user.role);
        if (!isEditor) throw new TRPCError({ code: "NOT_FOUND" });
      }
      const author = article.authorId ? await getUserById(article.authorId) : null;
      return { ...article, author: author ? { name: author.name, avatar: author.avatar } : null };
    }),

  create: editorProcedure
    .input(
      z.object({
        title: z.string().min(3),
        slug: z.string().min(3),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        coverImageUrl: z.string().optional(),
        coverImageKey: z.string().optional(),
        status: z.enum(["draft", "published"]).default("draft"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const id = await createNews({
        ...input,
        authorId: ctx.user.id,
        publishedAt: input.status === "published" ? new Date() : undefined,
      });
      return { id };
    }),

  update: editorProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        coverImageUrl: z.string().optional(),
        coverImageKey: z.string().optional(),
        status: z.enum(["draft", "published"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updateData: any = { ...data };
      if (data.status === "published") updateData.publishedAt = new Date();
      await updateNews(id, updateData);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteNews(input.id);
      return { success: true };
    }),
});

// ─── Users Router ─────────────────────────────────────────────────────────────

const usersRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
        avatar: z.string().optional(),
        customId: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (input.customId) {
        const existing = await getUserByCustomId(input.customId);
        if (existing && existing.id !== ctx.user.id) {
          throw new TRPCError({ code: "CONFLICT", message: "This ID is already taken" });
        }
      }
      await updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),

  list: adminProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const [items, total] = await Promise.all([listUsers(input.page, input.limit), countUsers()]);
      return { items, total };
    }),

  updateRole: adminProcedure
    .input(z.object({ userId: z.number(), role: z.enum(["user", "editor", "representative", "admin"]) }))
    .mutation(async ({ input }) => {
      await updateUserRole(input.userId, input.role);
      return { success: true };
    }),

  updateRoleByCustomId: adminProcedure
    .input(z.object({ customId: z.string(), role: z.enum(["user", "editor", "representative", "admin"]) }))
    .mutation(async ({ input }) => {
      const user = await getUserByCustomId(input.customId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      await updateUserRole(user.id, input.role);
      return { success: true, user };
    }),

  blockUser: adminProcedure
    .input(z.object({ userId: z.number(), isBlocked: z.boolean() }))
    .mutation(async ({ input }) => {
      await updateUserBlock(input.userId, input.isBlocked);
      return { success: true };
    }),
});

// ─── Preferences & Recommendations Router ────────────────────────────────────

const recommendationsRouter = router({
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    return getUserPreferences(ctx.user.id);
  }),

  savePreferences: protectedProcedure
    .input(
      z.object({
        preferredTypes: z.array(z.string()).optional(),
        preferredCities: z.array(z.string()).optional(),
        preferredSpecializations: z.array(z.string()).optional(),
        budget: z.enum(["free", "paid", "any"]).optional(),
        additionalInfo: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await upsertUserPreferences(ctx.user.id, input);
      return { success: true };
    }),

  generate: protectedProcedure.mutation(async ({ ctx }) => {
    const prefs = await getUserPreferences(ctx.user.id);
    if (!prefs) throw new TRPCError({ code: "BAD_REQUEST", message: "Please fill in your preferences first" });

    const { items: allInstitutions } = await listInstitutions({ status: "published", limit: 100 });

    const institutionsSummary = allInstitutions
      .slice(0, 50)
      .map((i) => `- ${i.name} (${i.type}, ${i.city}): ${i.shortDescription ?? ""}`)
      .join("\n");

    const prompt = `You are an educational advisor helping a student in Rostov Oblast, Russia choose an educational institution.

User preferences:
- Preferred institution types: ${(prefs.preferredTypes as string[] | null)?.join(", ") || "any"}
- Preferred cities: ${(prefs.preferredCities as string[] | null)?.join(", ") || "any"}
- Preferred specializations: ${(prefs.preferredSpecializations as string[] | null)?.join(", ") || "any"}
- Budget preference: ${prefs.budget || "any"}
- Additional notes: ${prefs.additionalInfo || "none"}

Available institutions:
${institutionsSummary}

Based on the user's preferences, recommend the top 5 most suitable institutions. For each recommendation:
1. State the institution name exactly as listed
2. Provide a 2-3 sentence personalized explanation of why it matches their preferences
3. Highlight key strengths relevant to their goals

Respond in Russian. Format as JSON array: [{"name": "...", "explanation": "...", "matchScore": 85}]`;

    const response = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    explanation: { type: "string" },
                    matchScore: { type: "number" },
                  },
                  required: ["name", "explanation", "matchScore"],
                  additionalProperties: false,
                },
              },
            },
            required: ["recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : null;
    if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const parsed = JSON.parse(content) as { recommendations: Array<{ name: string; explanation: string; matchScore: number }> };

    const enriched = await Promise.all(
      parsed.recommendations.map(async (rec) => {
        const inst = allInstitutions.find((i) => i.name === rec.name);
        return { ...rec, institution: inst ?? null };
      })
    );

    return { recommendations: enriched };
  }),
});

// ─── Bookmarks Router ─────────────────────────────────────────────────────────

const bookmarksRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const bms = await getUserBookmarks(ctx.user.id);
    const enriched = await Promise.all(
      bms.map(async (b) => {
        const inst = await getInstitutionById(b.institutionId);
        return { ...b, institution: inst };
      })
    );
    return enriched.filter((b) => b.institution);
  }),

  toggle: protectedProcedure
    .input(z.object({ institutionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const already = await isBookmarked(ctx.user.id, input.institutionId);
      if (already) {
        await removeBookmark(ctx.user.id, input.institutionId);
        return { bookmarked: false };
      } else {
        await addBookmark(ctx.user.id, input.institutionId);
        return { bookmarked: true };
      }
    }),
});

// ─── Notifications Router ─────────────────────────────────────────────────────

const notificationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => getUserNotifications(ctx.user.id)),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await countUnreadNotifications(ctx.user.id);
    return { count };
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await markNotificationRead(input.id);
      return { success: true };
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsRead(ctx.user.id);
    return { success: true };
  }),
});

// ─── Publications Router ──────────────────────────────────────────────────────

const publicationsRouter = router({
  list: adminProcedure
    .input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }))
    .query(async ({ input }) => {
      const requests = await listPublicationRequests(input.status);
      const enriched = await Promise.all(
        requests.map(async (req) => {
          const [inst, editor] = await Promise.all([
            getInstitutionById(req.institutionId),
            getUserById(req.editorId),
          ]);
          const reviewer = req.reviewedBy ? await getUserById(req.reviewedBy) : null;
          return { ...req, institution: inst, editor, reviewer };
        })
      );
      return enriched;
    }),

  myRequests: protectedProcedure.query(async ({ ctx }) => {
    const requests = await getPublicationRequestsByEditor(ctx.user.id);
    const enriched = await Promise.all(
      requests.map(async (req) => {
        const [inst, reviewer] = await Promise.all([
          getInstitutionById(req.institutionId),
          req.reviewedBy ? getUserById(req.reviewedBy) : Promise.resolve(null),
        ]);
        return { ...req, institution: inst, reviewer };
      })
    );
    return enriched;
  }),

  approve: adminProcedure
    .input(z.object({ id: z.number(), institutionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await updatePublicationRequest(input.id, { status: "approved", reviewedBy: ctx.user.id });
      await updateInstitution(input.institutionId, { status: "published" });
      const approvedReqs = await listPublicationRequests("approved");
      const thisReq = approvedReqs.find((r: { id: number }) => r.id === input.id) as typeof approvedReqs[0] | undefined;
      if (thisReq) {
        await createNotification({
          userId: thisReq.editorId,
          type: "publication_approved",
          title: "Заявка одобрена",
          message: `Ваша заявка #${input.id} была одобрена и учреждение опубликовано.`,
          relatedId: input.id,
        });
      }
      return { success: true };
    }),

  reject: adminProcedure
    .input(z.object({ id: z.number(), institutionId: z.number(), reason: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await updatePublicationRequest(input.id, {
        status: "rejected",
        rejectionReason: input.reason,
        reviewedBy: ctx.user.id,
      });
      await updateInstitution(input.institutionId, { status: "rejected" });
      const rejectedReqs = await listPublicationRequests("rejected");
      const thisReq = rejectedReqs.find((r: { id: number }) => r.id === input.id) as typeof rejectedReqs[0] | undefined;
      if (thisReq) {
        await createNotification({
          userId: thisReq.editorId,
          type: "publication_rejected",
          title: "Заявка отклонена",
          message: `Ваша заявка #${input.id} была отклонена. Причина: ${input.reason}`,
          relatedId: input.id,
        });
      }
      return { success: true };
    }),
});

// ─── Stats Router ─────────────────────────────────────────────────────────────

const statsRouter = router({
  getSiteStats: adminProcedure.query(() => getSiteStats()),

  getTopInstitutions: adminProcedure
    .input(z.object({ limit: z.number().default(3) }))
    .query(({ input }) => getTopInstitutions(input.limit)),

  trackPageView: publicProcedure.mutation(async () => {
    const today = new Date().toISOString().split("T")[0]!;
    await upsertDailyStat(today, "pageViews");
    return { success: true };
  }),
});

// ─── Uploads Router ───────────────────────────────────────────────────────────

const uploadsRouter = router({
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        contentType: z.string(),
        folder: z.string().default("uploads"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Return a signed upload endpoint — client POSTs file to /api/upload
      return { uploadPath: `/api/upload?folder=${input.folder}&userId=${ctx.user.id}` };
    }),
});

// ─── Contacts Router ──────────────────────────────────────────────────────────

const contactsRouter = router({
  send: publicProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        subject: z.string().optional(),
        message: z.string().min(10),
        type: z.enum(["feedback", "cooperation", "add_institution", "other"]).default("feedback"),
      })
    )
    .mutation(async ({ input }) => {
      await createContactMessage(input);
      return { success: true };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  institutions: institutionsRouter,
  reviews: reviewsRouter,
  news: newsRouter,
  users: usersRouter,
  recommendations: recommendationsRouter,
  bookmarks: bookmarksRouter,
  notifications: notificationsRouter,
  publications: publicationsRouter,
  stats: statsRouter,
  uploads: uploadsRouter,
  contacts: contactsRouter,
});

export type AppRouter = typeof appRouter;
