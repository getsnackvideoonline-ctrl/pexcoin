import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import cryptoRouter from "./crypto";
import transactionsRouter from "./transactions";
import adminRouter from "./admin";
import openaiRouter from "./openai";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(cryptoRouter);
router.use(transactionsRouter);
router.use(adminRouter);
router.use(openaiRouter);
router.use(stripeRouter);

export default router;
