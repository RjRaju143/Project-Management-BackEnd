import express from "express";

import leadRouter from "./lead/index.js";
import projectRouter from "./project/index.js";
import userRouter from "./user/index.js";

const router = express.Router();

router.get<object>("/", (_req, res) => {
  res.json({
    message: "Hello World",
  });
});

router.use("/user", userRouter);
router.use("/leads", leadRouter);
router.use("/projects", projectRouter);

export default router;
