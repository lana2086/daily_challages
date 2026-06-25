import { Router } from "express";
import { eq, count } from "drizzle-orm";
import { db, usersTable, bingoBoxesTable, bingoCardsTable, reflectionsTable } from "@workspace/db";
import {
  ListParticipantsResponse,
  CreateParticipantBody,
  CreateParticipantResponse,
  GetParticipantParams,
  GetParticipantResponse,
  UpdateParticipantParams,
  UpdateParticipantBody,
  UpdateParticipantResponse,
  DeleteParticipantParams,
  GetParticipantProgressParams,
  GetParticipantProgressResponse,
} from "@workspace/api-zod";
import { hashPassword } from "../lib/auth";

const router = Router();

function requireAdmin(req: any, res: any): boolean {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  if (req.session.userRole !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

router.get("/participants", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const participants = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.role, "participant"))
    .orderBy(usersTable.createdAt);

  res.json(
    ListParticipantsResponse.parse(
      participants.map((p) => ({
        id: p.id,
        name: p.name,
        username: p.username,
        email: p.email,
        role: p.role,
        createdAt: p.createdAt.toISOString(),
      })),
    ),
  );
});

router.post("/participants", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const parsed = CreateParticipantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const [user] = await db
    .insert(usersTable)
    .values({
      name: parsed.data.name,
      username: parsed.data.username,
      passwordHash,
      email: parsed.data.email ?? null,
      role: "participant",
    })
    .returning();

  res.status(201).json(
    CreateParticipantResponse.parse({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    }),
  );
});

router.get("/participants/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const params = GetParticipantParams.safeParse({ id: Number(req.params.id) });
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

  res.json(
    GetParticipantResponse.parse({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    }),
  );
});

router.patch("/participants/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const params = UpdateParticipantParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateParticipantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.username) updates.username = parsed.data.username;
  if (parsed.data.email !== undefined) updates.email = parsed.data.email;
  if (parsed.data.password) {
    updates.passwordHash = await hashPassword(parsed.data.password);
  }

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "Participant not found" });
    return;
  }

  res.json(
    UpdateParticipantResponse.parse({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    }),
  );
});

router.delete("/participants/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const params = DeleteParticipantParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .delete(usersTable)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "Participant not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/participants/:id/progress", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const params = GetParticipantProgressParams.safeParse({ id: Number(req.params.id) });
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

  // Get all boxes for this participant's cards
  const cards = await db
    .select()
    .from(bingoCardsTable)
    .where(eq(bingoCardsTable.userId, params.data.id));

  let totalBoxes = 0;
  let revealed = 0;
  let completed = 0;

  for (const card of cards) {
    const boxes = await db
      .select()
      .from(bingoBoxesTable)
      .where(eq(bingoBoxesTable.cardId, card.id));

    totalBoxes += boxes.length;
    revealed += boxes.filter((b) => b.isRevealed && !b.isCompleted).length;
    completed += boxes.filter((b) => b.isCompleted).length;
  }

  const [reflCount] = await db
    .select({ value: count() })
    .from(reflectionsTable)
    .where(eq(reflectionsTable.userId, params.data.id));

  const hidden = totalBoxes - revealed - completed;

  res.json(
    GetParticipantProgressResponse.parse({
      participantId: user.id,
      name: user.name,
      totalBoxes,
      hidden,
      revealed,
      completed,
      reflectionsCount: reflCount?.value ?? 0,
    }),
  );
});

export default router;
