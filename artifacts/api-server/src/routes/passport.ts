import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, passportsTable, usersTable } from "@workspace/db";
import type { PassportPageData } from "@workspace/db";
import {
  GetMyPassportResponse,
  UpdateMyPassportBody,
  UpdateMyPassportResponse,
  GetParticipantPassportParams,
  GetParticipantPassportResponse,
} from "@workspace/api-zod";

const router = Router();

function requireAuth(req: any, res: any): boolean {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  return true;
}

function requireAdmin(req: any, res: any): boolean {
  if (!requireAuth(req, res)) return false;
  if (req.session.userRole !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

function emptyPage(): PassportPageData {
  return {
    missionName: "",
    round1: "",
    round2: "",
    reflection: "",
    uprooting: "",
    drawings: {},
  };
}

function emptyPages(): PassportPageData[] {
  return [emptyPage(), emptyPage(), emptyPage(), emptyPage()];
}

function passportToJson(
  userId: number,
  participantName: string,
  pages: PassportPageData[],
  updatedAt: Date,
) {
  return {
    userId,
    participantName,
    pages,
    updatedAt: updatedAt.toISOString(),
  };
}

router.get("/passport", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const userId = req.session.userId!;
  const [passport] = await db
    .select()
    .from(passportsTable)
    .where(eq(passportsTable.userId, userId));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  res.json(
    GetMyPassportResponse.parse(
      passportToJson(
        userId,
        user?.name ?? "Unknown",
        passport?.pages ?? emptyPages(),
        passport?.updatedAt ?? new Date(),
      ),
    ),
  );
});

router.put("/passport", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const parsed = UpdateMyPassportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const userId = req.session.userId!;
  const pages = parsed.data.pages as PassportPageData[];

  const [existing] = await db
    .select()
    .from(passportsTable)
    .where(eq(passportsTable.userId, userId));

  let saved;
  if (existing) {
    [saved] = await db
      .update(passportsTable)
      .set({ pages })
      .where(eq(passportsTable.id, existing.id))
      .returning();
  } else {
    [saved] = await db
      .insert(passportsTable)
      .values({ userId, pages })
      .returning();
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  res.json(
    UpdateMyPassportResponse.parse(
      passportToJson(userId, user?.name ?? "Unknown", saved.pages, saved.updatedAt),
    ),
  );
});

router.get("/participants/:id/passport", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const params = GetParticipantPassportParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.id));

  if (!user) {
    res.status(404).json({ error: "Participant not found" });
    return;
  }

  const [passport] = await db
    .select()
    .from(passportsTable)
    .where(eq(passportsTable.userId, params.data.id));

  res.json(
    GetParticipantPassportResponse.parse(
      passportToJson(
        user.id,
        user.name,
        passport?.pages ?? emptyPages(),
        passport?.updatedAt ?? new Date(),
      ),
    ),
  );
});

export default router;
