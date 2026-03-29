import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import booksRouter from "./books.js";
import usersRouter from "./users.js";
import loansRouter from "./loans.js";
import reservationsRouter from "./reservations.js";
import readerRouter from "./reader.js";
import dashboardRouter from "./dashboard.js";
import notesRouter from "./notes.js";
import adminsRouter from "./admins.js";
import geminiRouter from "./gemini.js";
import setupRouter from "./setup.js";

const router: IRouter = Router();

router.use(setupRouter);
router.use(healthRouter);
router.use(authRouter);
router.use(booksRouter);
router.use(usersRouter);
router.use(loansRouter);
router.use(reservationsRouter);
router.use(readerRouter);
router.use(dashboardRouter);
router.use(notesRouter);
router.use(adminsRouter);
router.use(geminiRouter);

export default router;
