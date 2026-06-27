import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import participantsRouter from "./participants";
import bingoCardsRouter from "./bingo-cards";
import bingoBoxesRouter from "./bingo-boxes";
import reflectionsRouter from "./reflections";
import passportRouter from "./passport";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(participantsRouter);
router.use(bingoCardsRouter);
router.use(bingoBoxesRouter);
router.use(reflectionsRouter);
router.use(passportRouter);
router.use(dashboardRouter);

export default router;
