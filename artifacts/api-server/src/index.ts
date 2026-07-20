import app from "./app";
import { logger } from "./lib/logger";

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

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // ── Heartbeat: ping health endpoint every 4 min to keep repl alive 24x7 ──
  const appUrl = process.env.APP_URL;
  if (appUrl) {
    const heartbeatUrl = `${appUrl}/api/healthz`;
    setInterval(async () => {
      try {
        const res = await fetch(heartbeatUrl);
        logger.info({ status: res.status }, "Heartbeat ping");
      } catch (e) {
        logger.warn({ err: e }, "Heartbeat ping failed");
      }
    }, 4 * 60 * 1000); // every 4 minutes
  }
});
