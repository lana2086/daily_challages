import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, passportsTable, usersTable } from "@workspace/db";
import type { PassportPageData } from "@workspace/db";
import {
  GetMyPassportResponse,
  GetParticipantPassportParams,
  GetParticipantPassportResponse,
  UpdateParticipantPassportParams,
  UpdateParticipantPassportBody,
  UpdateParticipantPassportResponse,
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

const PAGE_COUNT = 4;

function emptyPage(): PassportPageData {
  return {
    missionName: "",
    round1: "",
    round2: "",
    uprooting: "",
    building: "",
  };
}

function emptyPages(): PassportPageData[] {
  return [emptyPage(), emptyPage(), emptyPage(), emptyPage()];
}

// Normalise stored pages to the current shape: always 4 pages, every field a
// string. This keeps responses valid even for rows written under an older
// schema (e.g. missing `building`, or a leftover `reflection` key).
function coercePage(p: unknown): PassportPageData {
  const o = (p ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    missionName: str(o.missionName),
    round1: str(o.round1),
    round2: str(o.round2),
    uprooting: str(o.uprooting),
    building: str(o.building),
  };
}

function coercePages(pages: unknown): PassportPageData[] {
  const arr = Array.isArray(pages) ? pages : [];
  const out: PassportPageData[] = [];
  for (let i = 0; i < PAGE_COUNT; i++) out.push(coercePage(arr[i]));
  return out;
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
        passport ? coercePages(passport.pages) : emptyPages(),
        passport?.updatedAt ?? new Date(),
      ),
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
        passport ? coercePages(passport.pages) : emptyPages(),
        passport?.updatedAt ?? new Date(),
      ),
    ),
  );
});

router.put("/participants/:id/passport", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const params = UpdateParticipantPassportParams.safeParse({
    id: Number(req.params.id),
  });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateParticipantPassportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const participantId = params.data.id;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, participantId));

  if (!user) {
    res.status(404).json({ error: "Participant not found" });
    return;
  }

  const pages = coercePages(parsed.data.pages);

  const [existing] = await db
    .select()
    .from(passportsTable)
    .where(eq(passportsTable.userId, participantId));

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
      .values({ userId: participantId, pages })
      .returning();
  }

  res.json(
    UpdateParticipantPassportResponse.parse(
      passportToJson(user.id, user.name, coercePages(saved.pages), saved.updatedAt),
    ),
  );
});

export default router;
