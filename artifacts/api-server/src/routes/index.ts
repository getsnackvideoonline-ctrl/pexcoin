import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import cryptoRouter from "./crypto";
import transactionsRouter from "./transactions";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(cryptoRouter);
router.use(transactionsRouter);
router.use(adminRouter);

export default router;
