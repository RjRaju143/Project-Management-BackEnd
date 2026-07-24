import MongoStore from "connect-mongo";
import cors from "cors";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import morgan from "morgan";

import api from "./api/index.js";
import { env } from "./config/env.js";
import * as middlewares from "./middlewares";

const app = express();

app.set("trust proxy", 1);
app.use(morgan("dev"));
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Session config — stored in MongoDB
app.use(session({
  name: "crm.sid",
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: env.MONGODB_URI,
    collectionName: "sessions",
    ttl: 7 * 24 * 60 * 60, // 7 days
  }),
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

app.use("/api/v1", api);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

export default app;
