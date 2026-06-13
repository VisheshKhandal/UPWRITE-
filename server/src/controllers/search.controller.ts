import { searchService } from "../services/search.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";

export const searchController = {
  search: asyncHandler(async (req, res) => {
    const results = await searchService.search(req);
    return sendSuccess(res, results, "Search results");
  })
};
