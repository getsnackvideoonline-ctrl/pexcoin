import { Router } from "express";
import { getUncachableStripeClient } from "../lib/stripeClient";
import { stripeStorage } from "../lib/stripeStorage";
import { getAuthUser } from "./auth";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/stripe/products", async (_req, res): Promise<void> => {
  try {
    const products = await stripeStorage.listProductsWithPrices();
    res.json({ data: products });
  } catch (err) {
    res.json({ data: [] });
  }
});

router.post("/stripe/checkout", async (req, res): Promise<void> => {
  const auth = getAuthUser(req);
  if (!auth) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { priceId, successUrl, cancelUrl } = req.body as {
    priceId: string;
    successUrl?: string;
    cancelUrl?: string;
  };

  if (!priceId) {
    res.status(400).json({ error: "priceId is required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, auth.userId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  try {
    const stripe = await getUncachableStripeClient();

    const baseUrl = successUrl?.startsWith("http")
      ? ""
      : `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost"}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: successUrl || `${baseUrl}/buy-crypto?success=true`,
      cancel_url: cancelUrl || `${baseUrl}/buy-crypto?canceled=true`,
      metadata: { userId: String(user.id) },
    });

    res.json({ url: session.url });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create checkout session" });
  }
});

export default router;
