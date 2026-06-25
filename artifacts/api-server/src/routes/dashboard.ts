import { Router } from "express";
import { eq, count, and } from "drizzle-orm";
import { db, usersTable, bingoCardsTable, bingoBoxesTable, reflectionsTable } from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";

const router = Router();

function requireAuth(req: any, res: any): boolean {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  return true;
}

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const isAdmin = req.session.userRole === "admin";

  if (isAdmin) {
    // Admin stats
    const [participantCount] = await db
      .select({ value: count() })
      .from(usersTable)
      .where(eq(usersTable.role, "participant"));

    const [cardCount] = await db.select({ value: count() }).from(bingoCardsTable);

    const allBoxes = await db.select().from(bingoBoxesTable);
    const totalBoxesRevealed = allBoxes.filter((b) => b.isRevealed && !b.isCompleted).length;
    const totalBoxesCompleted = allBoxes.filter((b) => b.isCompleted).length;

    const [reflectionCount] = await db.select({ value: count() }).from(reflectionsTable);

    // Recent reflections (last 5)
    const recentReflections = await db
      .select()
      .from(reflectionsTable)
      .orderBy(reflectionsTable.createdAt)
      .limit(5);

    const allUsers = await db.select({ id: usersTable.id, name: usersTable.name }).from(usersTable);
    const userMap: Record<number, string> = {};
    for (const u of allUsers) userMap[u.id] = u.name;

    res.json(
      GetDashboardSummaryResponse.parse({
        role: "admin",
        totalParticipants: participantCount?.value ?? 0,
        totalCards: cardCount?.value ?? 0,
        totalBoxesRevealed,
        totalBoxesCompleted,
        totalReflections: reflectionCount?.value ?? 0,
        recentReflections: recentReflections.map((r) => ({
          id: r.id,
          userId: r.userId,
          participantName: userMap[r.userId] ?? "Unknown",
          date: r.date,
          whatIChose: r.whatIChose,
          whatIDid: r.whatIDid,
          impact: r.impact,
          createdAt: r.createdAt.toISOString(),
        })),
        myBoxesTotal: null,
        myBoxesRevealed: null,
        myBoxesCompleted: null,
        myReflectionsCount: null,
        hasReflectedToday: null,
      }),
    );
  } else {
    // Participant stats
    const myCards = await db
      .select()
      .from(bingoCardsTable)
      .where(eq(bingoCardsTable.userId, req.session.userId!));

    let myBoxesTotal = 0;
    let myBoxesRevealed = 0;
    let myBoxesCompleted = 0;

    for (const card of myCards) {
      const boxes = await db
        .select()
        .from(bingoBoxesTable)
        .where(eq(bingoBoxesTable.cardId, card.id));

      myBoxesTotal += boxes.length;
      myBoxesRevealed += boxes.filter((b) => b.isRevealed && !b.isCompleted).length;
      myBoxesCompleted += boxes.filter((b) => b.isCompleted).length;
    }

    const [myReflCount] = await db
      .select({ value: count() })
      .from(reflectionsTable)
      .where(eq(reflectionsTable.userId, req.session.userId!));

    const today = new Date().toISOString().split("T")[0];
    const [todayRefl] = await db
      .select()
      .from(reflectionsTable)
      .where(
        and(
          eq(reflectionsTable.userId, req.session.userId!),
          eq(reflectionsTable.date, today),
        ),
      );

    res.json(
      GetDashboardSummaryResponse.parse({
        role: "participant",
        totalParticipants: null,
        totalCards: null,
        totalBoxesRevealed: null,
        totalBoxesCompleted: null,
        totalReflections: null,
        recentReflections: [],
        myBoxesTotal,
        myBoxesRevealed,
        myBoxesCompleted,
        myReflectionsCount: myReflCount?.value ?? 0,
        hasReflectedToday: !!todayRefl,
      }),
    );
  }
});

export default router;
