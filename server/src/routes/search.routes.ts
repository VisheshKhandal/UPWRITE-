import { Router } from "express";
import { searchController } from "../controllers/search.controller";
import { validateRequest } from "../middleware/validateRequest";
import { searchQuerySchema } from "../validations/search.validation";

const router = Router();

router.get("/", validateRequest(searchQuerySchema), searchController.search);

export default router;
