import { Router } from "express";
import { fetchReport } from "../controllers/fetchReportController.js";

const router = Router();

router.get("/", fetchReport);

export default router;