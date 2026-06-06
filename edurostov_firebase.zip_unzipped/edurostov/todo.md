# EduRostov — Project TODO

## Phase 1: Database Schema & Migrations
- [x] Extend users table: add customId, role (user/editor/representative/admin), avatar, bio, isBlocked
- [x] Create institutions table: id, slug, name, type, city, region, description, shortDescription, address, phone, email, website, logo, coverImage, foundedYear, directorName, lat, lng, status (draft/pending/published/rejected), viewCount, isFeatured, featuredOrder, promotionBadge
- [x] Create institution_photos table: id, institutionId, url, fileKey, caption, order
- [x] Create institution_documents table: id, institutionId, type (photo/logo/brochure/certificate/video/gif), url, fileKey, name
- [x] Create institution_specializations table: id, institutionId, name, cost (free/paid/mixed)
- [x] Create reviews table: id, institutionId, userId, rating, text, createdAt, representativeReply, replyAt
- [x] Create news table: id, title, slug, content, excerpt, coverImage, authorId, publishedAt, status (draft/published)
- [x] Create user_preferences table: id, userId, preferredTypes, preferredCities, preferredSpecializations, budget, additionalInfo
- [x] Create user_bookmarks table: id, userId, institutionId, createdAt
- [x] Create publication_requests table: id, institutionId, editorId, status (pending/approved/rejected), rejectionReason, reviewedBy, reviewedAt, createdAt
- [x] Create notifications table: id, userId, type, title, message, isRead, relatedId, createdAt
- [x] Create site_stats table: id, date, pageViews, registrations, activeUsers
- [x] Run migrations via webdev_execute_sql

## Phase 2: Server Routers (tRPC)
- [x] institutions router: list, getBySlug, create, update, delete, submitForReview, publish, reject, incrementView, getFeatured, getByCity, search
- [x] users router: me, updateProfile, updatePreferences, getById, list (admin), updateRole, blockUser, unblockUser
- [x] reviews router: list, create, delete, addReply
- [x] news router: list, getBySlug, create, update, delete, publish
- [x] bookmarks router: list, add, remove
- [x] recommendations router: generate (LLM-powered)
- [x] publications router: list (admin), approve, reject
- [x] notifications router: list, markRead, markAllRead
- [x] stats router: getSiteStats, getTopInstitutions
- [x] uploads router: uploadFile (photos, logos, docs)
- [x] contacts router: sendMessage

## Phase 3: Global Design System
- [x] Set up Google Fonts (Playfair Display + Inter)
- [x] Define CSS variables: colors, spacing, typography, shadows, radius
- [x] Create elegant color palette (deep navy + gold accent + warm white)
- [x] Build Navbar component with role-aware navigation
- [x] Build Footer component
- [x] Build PageLayout wrapper
- [x] Build InstitutionCard component (image, city, name, description)
- [x] Build Badge components (role, status, type)

## Phase 4: Home Page
- [x] Hero section with animated headline and CTA
- [x] City filter bar (Ростов-на-Дону, Таганрог, Новочеркасск, Шахты, Волгодонск, etc.)
- [x] Top-5 featured institutions section
- [x] Personalized recommendations carousel (for logged-in users)
- [x] Platform stats strip (institutions count, cities, users)
- [x] CTA banner for registration with questionnaire pitch

## Phase 5: Institution Catalog
- [x] Search bar with live keyword search
- [x] Filter panel: type, city, specialization, cost
- [x] Paginated grid of InstitutionCards
- [x] Sort options: by name, by views, by rating
- [x] Empty state and loading skeletons

## Phase 6: Institution Profile Page
- [x] Header with logo, cover image, name, type badge, city
- [x] Photo gallery with lightbox
- [x] Full description section
- [x] Contact details: address, phone, email, website, social links
- [x] Director name, founded year, age of institution
- [x] Specializations list with cost info
- [x] Documents section (brochures, certificates)
- [x] Interactive Google Map with institution pin, directions, nearby institutions
- [x] Reviews section with star ratings and representative replies
- [x] Add review form (authenticated users)
- [x] Bookmark button
- [x] Share button with unique URL (/institution/[slug])

## Phase 7: Auth, Profile & LLM Recommendations
- [x] Login/Register page (elegant modal or dedicated page)
- [x] User profile page: avatar, name, customId, bio, edit form
- [x] Saved bookmarks tab in profile
- [x] Preference questionnaire: types, cities, specializations, budget, notes
- [x] LLM recommendation generation with written explanations
- [x] Recommendations display page with cards + explanation text

## Phase 8: News & Contacts
- [x] News list page with cover images, excerpts, dates
- [x] News article detail page
- [x] Contacts page: platform info, feedback form, Telegram/WhatsApp links
- [x] 404 page

## Phase 9: Admin Console
- [x] Admin dashboard: site stats, top 3 institutions, recent activity
- [x] User management: list, search, change role, block/unblock
- [x] Publication queue: pending cards, approve/reject with reason
- [x] Institution management: view all (including drafts), delete
- [x] News management: publish/unpublish
- [x] Promotion management: feature institutions, add badges
- [x] Role assignment by userId

## Phase 10: Editor Panel & Representative Portal
- [x] Editor panel: create/edit institution cards, submit for review
- [x] Editor: create/edit news articles
- [x] Representative portal: edit assigned institution profile
- [x] Representative: respond to reviews
- [x] Representative: upload documents (brochures, certificates)

## Phase 11: Final Polish & Tests
- [x] Vitest unit tests for key server procedures (17 tests passing)
- [x] TypeScript: 0 errors
- [x] App.tsx with all 11 routes wired up
- [x] Loading states and error boundaries on all pages
- [x] Final checkpoint
