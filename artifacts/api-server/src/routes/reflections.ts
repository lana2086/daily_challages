import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, reflectionsTable, usersTable } from "@workspace/db";
import {
  ListReflectionsResponse,
  CreateReflectionBody,
  CreateReflectionResponse,
  GetReflectionParams,
  GetReflectionResponse,
  UpdateReflectionParams,
  UpdateReflectionBody,
  UpdateReflectionResponse,
} from "@workspace/api-zod";

const router = Router();

function requireAuth(req: any, res: any): boolean {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  return true;
}

function reflectionToJson(r: any, participantName: string) {
  return {
    id: r.id,
    userId: r.userId,
    participantName,
    date: r.date,
    whatIChose: r.whatIChose,
    whatIDid: r.whatIDid,
    impact: r.impact,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/reflections", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const isAdmin = req.session.userRole === "admin";

  const reflections = isAdmin
    ? await db.select().from(reflectionsTable).orderBy(reflectionsTable.createdAt)
    : await db
        .select()
        .from(reflectionsTable)
        .where(eq(reflectionsTable.userId, req.session.userId!))
        .orderBy(reflectionsTable.createdAt);

  // Build user map
  const allUsers = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
  const userMap: Record<number, string> = {};
  for (const u of allUsers) userMap[u.id] = u.name;

  res.json(
    ListReflectionsResponse.parse(
      reflections.map((r) => reflectionToJson(r, userMap[r.userId] ?? "Unknown")),
    ),
  );
});

router.post("/reflections", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const parsed = CreateReflectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  // Check if reflection already exists for today
  const [existing] = await db
    .select()
    .from(reflectionsTable)
    .where(
      and(
        eq(reflectionsTable.userId, req.session.userId!),
        eq(reflectionsTable.date, today),
      ),
    );

  if (existing) {
    // Update existing
    const [updated] = await db
      .update(reflectionsTable)
      .set({
        whatIChose: parsed.data.whatIChose,
        whatIDid: parsed.data.whatIDid,
        impact: parsed.data.impact,
      })
      .where(eq(reflectionsTable.id, existing.id))
      .returning();

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
    res.status(201).json(
      CreateReflectionResponse.parse(reflectionToJson(updated, user?.name ?? "Unknown")),
    );
    return;
  }

  const [reflection] = await db
    .insert(reflectionsTable)
    .values({
      userId: req.session.userId!,
      date: today,
      whatIChose: parsed.data.whatIChose,
      whatIDid: parsed.data.whatIDid,
      impact: parsed.data.impact,
    })
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId!));
  res.status(201).json(
    CreateReflectionResponse.parse(reflectionToJson(reflection, user?.name ?? "Unknown")),
  );
});

router.get("/reflections/:id", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const params = GetReflectionParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [reflection] = await db
    .select()
    .from(reflectionsTable)
    .where(eq(reflectionsTable.id, params.data.id));

  if (!reflection) {
    res.status(404).json({ error: "Reflection not found" });
    return;
  }

  if (req.session.userRole !== "admin" && reflection.userId !== req.session.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, reflection.userId));
  res.json(GetReflectionResponse.parse(reflectionToJson(reflection, user?.name ?? "Unknown")));
});

router.patch("/reflections/:id", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const params = UpdateReflectionParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(reflectionsTable)
    .where(eq(reflectionsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Reflection not found" });
    return;
  }

  if (req.session.userRole !== "admin" && existing.userId !== req.session.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = UpdateReflectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [reflection] = await db
    .update(reflectionsTable)
    .set(parsed.data)
    .where(eq(reflectionsTable.id, params.data.id))
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, reflection.userId));
  res.json(UpdateReflectionResponse.parse(reflectionToJson(reflection, user?.name ?? "Unknown")));
});

export default router;
