import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

let isConnected = false;

async function ensureDbConnected() {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
    }
    catch (err) {
      console.error("Failed to connect to MongoDB:", err);
      throw err;
    }
  }
}

// Vercel serverless: export handler
export default async function handler(req: unknown, res: unknown) {
  await ensureDbConnected();
  return (app as Function)(req, res);
}

// Local dev: start the server if not running on Vercel
if (!process.env.VERCEL) {
  async function main() {
    const port = env.PORT;
    await ensureDbConnected();

    const server = app.listen(port, () => {
      /* eslint-disable no-console */
      console.log(`Listening: http://localhost:${port}`);
      /* eslint-enable no-console */
    });

    server.on("error", (err) => {
      if ("code" in err && err.code === "EADDRINUSE") {
        console.error(`Port ${env.PORT} is already in use. Please choose another port or stop the process using it.`);
      }
      else {
        console.error("Failed to start server:", err);
      }
      process.exit(1);
    });
  }

  main();
}
