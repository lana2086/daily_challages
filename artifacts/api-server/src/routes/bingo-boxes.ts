import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, bingoBoxesTable, bingoCardsTable } from "@workspace/db";
import {
  GetBingoBoxParams,
  GetBingoBoxResponse,
  UpdateBingoBoxParams,
  UpdateBingoBoxBody,
  UpdateBingoBoxResponse,
  RevealBingoBoxParams,
  RevealBingoBoxResponse,
  CompleteBingoBoxParams,
  CompleteBingoBoxResponse,
} from "@workspace/api-zod";

const router = Router();

function requireAuth(req: any, res: any): boolean {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  return true;
}

function boxToJson(b: any) {
  return {
    id: b.id,
    cardId: b.cardId,
    boxNumber: b.boxNumber,
    category: b.category,
    challengeText: b.challengeText,
    isRevealed: b.isRevealed,
    isCompleted: b.isCompleted,
    revealedAt: b.revealedAt ? b.revealedAt.toISOString() : null,
    completedAt: b.completedAt ? b.completedAt.toISOString() : null,
  };
}

async function getBoxAndVerifyOwnership(
  req: any,
  res: any,
  boxId: number,
  adminOnly = false,
): Promise<any | null> {
  const [box] = await db
    .select()
    .from(bingoBoxesTable)
    .where(eq(bingoBoxesTable.id, boxId));

  if (!box) {
    res.status(404).json({ error: "Box not found" });
    return null;
  }

  const [card] = await db
    .select()
    .from(bingoCardsTable)
    .where(eq(bingoCardsTable.id, box.cardId));

  if (!card) {
    res.status(404).json({ error: "Card not found" });
    return null;
  }

  const isAdmin = req.session.userRole === "admin";

  if (adminOnly && !isAdmin) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  if (!isAdmin && card.userId !== req.session.userId) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  return box;
}

router.get("/bingo-boxes/:id", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const params = GetBingoBoxParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const box = await getBoxAndVerifyOwnership(req, res, params.data.id);
  if (!box) return;

  res.json(GetBingoBoxResponse.parse(boxToJson(box)));
});

router.patch("/bingo-boxes/:id", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const params = UpdateBingoBoxParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // Only admins can update content/category/reset
  const existing = await getBoxAndVerifyOwnership(req, res, params.data.id, true);
  if (!existing) return;

  const parsed = UpdateBingoBoxBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.category !== undefined) updates.category = parsed.data.category;
  if (parsed.data.challengeText !== undefined) updates.challengeText = parsed.data.challengeText;
  if (parsed.data.isRevealed !== undefined) {
    updates.isRevealed = parsed.data.isRevealed;
    if (!parsed.data.isRevealed) {
      updates.isCompleted = false;
      updates.revealedAt = null;
      updates.completedAt = null;
    }
  }
  if (parsed.data.isCompleted !== undefined) updates.isCompleted = parsed.data.isCompleted;

  const [box] = await db
    .update(bingoBoxesTable)
    .set(updates)
    .where(eq(bingoBoxesTable.id, params.data.id))
    .returning();

  res.json(UpdateBingoBoxResponse.parse(boxToJson(box)));
});

router.post("/bingo-boxes/:id/reveal", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const params = RevealBingoBoxParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const existing = await getBoxAndVerifyOwnership(req, res, params.data.id);
  if (!existing) return;

  if (existing.isRevealed) {
    res.json(RevealBingoBoxResponse.parse(boxToJson(existing)));
    return;
  }

  const [box] = await db
    .update(bingoBoxesTable)
    .set({ isRevealed: true, revealedAt: new Date() })
    .where(eq(bingoBoxesTable.id, params.data.id))
    .returning();

  res.json(RevealBingoBoxResponse.parse(boxToJson(box)));
});

router.post("/bingo-boxes/:id/complete", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const params = CompleteBingoBoxParams.safeParse({ id: Number(req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const existing = await getBoxAndVerifyOwnership(req, res, params.data.id);
  if (!existing) return;

  if (!existing.isRevealed) {
    res.status(400).json({ error: "Box must be revealed before completing" });
    return;
  }

  if (existing.isCompleted) {
    res.json(CompleteBingoBoxResponse.parse(boxToJson(existing)));
    return;
  }

  const [box] = await db
    .update(bingoBoxesTable)
    .set({ isCompleted: true, completedAt: new Date() })
    .where(eq(bingoBoxesTable.id, params.data.id))
    .returning();

  res.json(CompleteBingoBoxResponse.parse(boxToJson(box)));
});

export default router;
