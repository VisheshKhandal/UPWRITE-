import { userService } from "../services/user.service";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { routeParam } from "../utils/request";

export const userController = {
  list: asyncHandler(async (req, res) => {
    const result = await userService.list(req);
    return sendSuccess(res, result.items, "Users", 200, result.meta);
  }),

  getProfile: asyncHandler(async (req, res) => {
    const user = await userService.getByUsername(routeParam(req, "username"), req.user?.id);
    return sendSuccess(res, user, "Profile");
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const user = await userService.updateProfile(req.user!.id, req.body);
    return sendSuccess(res, user, "Profile updated");
  })
};
