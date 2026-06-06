/**
 * server/_core/firebaseAuth.ts
 * Верификация Firebase ID Token и создание сессионной куки.
 */
import type { Express, Request, Response } from "express";
import { getAuth } from "firebase-admin/auth";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { SignJWT } from "jose";
import { ENV } from "./env";

function getSessionSecret() {
  return new TextEncoder().encode(ENV.cookieSecret || "fallback-dev-secret-change-in-prod");
}

async function createSessionJwt(openId: string, name: string): Promise<string> {
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + ONE_YEAR_MS) / 1000);
  return new SignJWT({ openId, appId: "edudon", name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(getSessionSecret());
}

export function registerFirebaseAuthRoutes(app: Express) {
  // POST /api/auth/firebase — принимает Firebase ID Token, создаёт сессию
  app.post("/api/auth/firebase", async (req: Request, res: Response) => {
    const { idToken } = req.body as { idToken?: string };

    if (!idToken) {
      res.status(400).json({ error: "idToken is required" });
      return;
    }

    try {
      // Верифицируем токен через Firebase Admin SDK
      const decoded = await getAuth().verifyIdToken(idToken);

      const openId = decoded.uid;
      const name = decoded.name ?? decoded.email?.split("@")[0] ?? "Пользователь";
      const email = decoded.email ?? null;
      const loginMethod = decoded.firebase?.sign_in_provider === "google.com" ? "google" : "email";
      const avatar = decoded.picture ?? null;

      // Создаём или обновляем пользователя в Firestore
      await db.upsertUser({
        openId,
        name,
        email,
        loginMethod,
        avatar,
        lastSignedIn: new Date(),
      });

      // Создаём JWT сессию
      const sessionToken = await createSessionJwt(openId, name);
      const cookieOptions = getSessionCookieOptions(req);

      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.json({ success: true, name, email });
    } catch (error) {
      console.error("[FirebaseAuth] Token verification failed:", error);
      res.status(401).json({ error: "Invalid Firebase token" });
    }
  });

  // POST /api/auth/logout — сбрасываем куку
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
}
