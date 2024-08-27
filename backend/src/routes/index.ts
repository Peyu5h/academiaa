import express from "express";
import authRoute from "./authRoute.js";
import adminOnlyRoute from "./adminOnlyRoute.js";
import classRoute from "./classRoute.js";
import messageRoute from "./messageRoute.js";
import { jwtMiddleware } from "../middlewares/jwtMiddleware.js";

const router = express.Router();

router.use("/auth", authRoute);
router.use("/admin", adminOnlyRoute);
router.use("/class", classRoute);
router.use("/chat", messageRoute);

export default router;
