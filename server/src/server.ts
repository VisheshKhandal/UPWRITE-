import http from "http";
import { createApp } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { env } from "./config/env";

const startServer = async () => {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${env.PORT} is already in use. Please stop the process using it or set a different PORT in .env.`);
    } else {
      console.error("Server error", error);
    }
    process.exit(1);
  });

  server.listen(env.PORT, () => {
    console.log(`Upwrite API running on port ${env.PORT}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received. Shutting down gracefully.`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
};

startServer().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
