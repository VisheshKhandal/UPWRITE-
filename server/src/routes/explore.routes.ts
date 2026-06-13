import { Router } from "express";
import { exploreController } from "../controllers/explore.controller";
import { optionalAuth } from "../middleware/auth";

const router = Router();

router.get("/trending-tags", exploreController.trendingTags);
router.get("/top-articles", exploreController.topArticles);
router.get("/featured-creators", exploreController.featuredCreators);
router.get("/people-you-may-know", optionalAuth, exploreController.peopleYouMayKnow);

export default router;
