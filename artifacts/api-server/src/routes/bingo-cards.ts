import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable, bingoCardsTable, bingoBoxesTable } from "@workspace/db";
import {
  ListBingoCardsResponse,
  CreateBingoCardBody,
  CreateBingoCardResponse,
  GetBingoCardParams,
  GetBingoCardResponse,
  UpdateBingoCardParams,
  UpdateBingoCardBody,
  UpdateBingoCardResponse,
  DeleteBingoCardParams,
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

router.get("/bingo-cards", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const isAdmin = req.session.userRole === "admin";

  const cards = isAdmin
    ? await db.select().from(bingoCardsTable).orderBy(bingoCardsTable.createdAt)
    : await db
        .select()
        .from(bingoCardsTable)
        .where(eq(bingoCardsTable.userId, req.session.userId!))
        .orderBy(bingoCardsTable.createdAt);

  // Fetch participant names
  const allUserIds = [...new Set(cards.map((c) => c.userId))];
  const users =
    allUserIds.length > 0
      ? await db.select().from(usersTable).where(eq(usersTable.id, allUserIds[0]))
      : [];

  // Build a map for all users
  const usersMap: Record<number, string> = {};
  if (isAdmin) {
    const allUsers = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
    for (const u of allUsers) usersMap[u.id] = u.name;
  } else {
    const [me] = await db
      .select({ id: usersTable.id, name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId!));
    if (me) usersMap[me.id] = me.name;
  }

  res.json(
    ListBingoCardsResponse.parse(
      cards.map((c) => ({
        id: c.id,
        userId: c.userId,
        participantName: usersMap[c.userId] ?? "Unknown",
        title: c.title,
        rows: c.rows,
        cols: c.cols,
        createdAt: c.createdAt.toISOString(),
      })),
    ),
  );
});

router.post("/bingo-cards", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const parsed = CreateBingoCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId, title, boxes } = parsed.data;

  // Create the card
  const [card] = await db
    .insert(bingoCardsTable)
    .values({ userId, title, rows: 3, cols: 3 })
    .returning();

  // Create boxes
  if (boxes && boxes.length > 0) {
    await db.insert(bingoBoxesTable).values(
      boxes.map((b: any) => ({
        cardId: card.id,
        boxNumber: b.boxNumber,
        category: b.category,
        challengeText: b.challengeText,
      })),
    );
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  res.status(201).json(
    CreateBingoCardResponse.parse({
      id: card.id,
      userId: card.userId,
      participantName: user?.name ?? "Unknown",
      title: card.title,
      rows: card.rows,
      cols: card.cols,
      createdAt: card.createdAt.toISOString(),
    }),
  );
});

router.get("/bingo-cards/:id", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const params = GetBingoCardParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [card] = await db
    .select()
    .from(bingoCardsTable)
    .where(eq(bingoCardsTable.id, params.data.id));

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  // Participants can only see their own cards
  if (req.session.userRole !== "admin" && card.userId !== req.session.userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const boxes = await db
    .select()
    .from(bingoBoxesTable)
    .where(eq(bingoBoxesTable.cardId, card.id))
    .orderBy(bingoBoxesTable.boxNumber);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, card.userId));

  res.json(
    GetBingoCardResponse.parse({
      id: card.id,
      userId: card.userId,
      participantName: user?.name ?? "Unknown",
      title: card.title,
      rows: card.rows,
      cols: card.cols,
      createdAt: card.createdAt.toISOString(),
      boxes: boxes.map((b) => ({
        id: b.id,
        cardId: b.cardId,
        boxNumber: b.boxNumber,
        category: b.category,
        challengeText: b.challengeText,
        isRevealed: b.isRevealed,
        isCompleted: b.isCompleted,
        revealedAt: b.revealedAt ? b.revealedAt.toISOString() : null,
        completedAt: b.completedAt ? b.completedAt.toISOString() : null,
      })),
    }),
  );
});

router.patch("/bingo-cards/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const params = UpdateBingoCardParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBingoCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [card] = await db
    .update(bingoCardsTable)
    .set(parsed.data)
    .where(eq(bingoCardsTable.id, params.data.id))
    .returning();

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, card.userId));

  res.json(
    UpdateBingoCardResponse.parse({
      id: card.id,
      userId: card.userId,
      participantName: user?.name ?? "Unknown",
      title: card.title,
      rows: card.rows,
      cols: card.cols,
      createdAt: card.createdAt.toISOString(),
    }),
  );
});

router.delete("/bingo-cards/:id", async (req, res): Promise<void> => {
  if (!requireAdmin(req, res)) return;

  const params = DeleteBingoCardParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [card] = await db
    .delete(bingoCardsTable)
    .where(eq(bingoCardsTable.id, params.data.id))
    .returning();

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
