import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import cryptoRouter from "./crypto";
import transactionsRouter from "./transactions";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import openaiRouter from "./openai";
import stripeRouter from "./stripe";
import binanceRouter from "./binance";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(cryptoRouter);
router.use(transactionsRouter);
router.use(ordersRouter);
router.use(adminRouter);
router.use(openaiRouter);
router.use(stripeRouter);
router.use(binanceRouter);

export default router;
