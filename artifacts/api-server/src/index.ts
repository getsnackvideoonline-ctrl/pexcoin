import app from "./app";
import { logger } from "./lib/logger";
import { initializeStripe } from "./lib/stripeClient";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function init() {
  try {
    await initializeStripe();
    logger.info("Stripe initialized");
  } catch (err) {
    logger.warn({ err }, "Stripe initialization skipped (not configured)");
  }

  app.listen(port, (err?: Error) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }
    logger.info({ port }, "Server listening");
  });
}

init();
