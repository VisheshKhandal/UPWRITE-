import { Check, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useFollowMutation, useUnfollowMutation } from "../../features/profiles/profilesApi";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { pushToast } from "../../features/ui/uiSlice";
import { Button } from "../ui/Button";
import { AuthPrompt } from "../auth/AuthPrompt";

export const FollowButton = ({ userId, username, following = false }: { userId: string; username?: string; following?: boolean }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [isFollowing, setIsFollowing] = useState(following);
  const [authOpen, setAuthOpen] = useState(false);
  const [follow, followState] = useFollowMutation();
  const [unfollow, unfollowState] = useUnfollowMutation();

  useEffect(() => {
    setIsFollowing(following);
  }, [following, userId]);

  const toggleFollow = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    const next = !isFollowing;
    setIsFollowing(next);
    try {
      if (next) {
        await follow({ id: userId, username }).unwrap();
        dispatch(pushToast({ title: "Followed creator", tone: "success" }));
      } else {
        await unfollow({ id: userId, username }).unwrap();
        dispatch(pushToast({ title: "Unfollowed creator", tone: "success" }));
      }
    } catch {
      setIsFollowing(!next);
      dispatch(pushToast({ title: "Sign in to follow this creator.", tone: "error" }));
    }
  };

  return (
    <>
      <Button
        variant={isFollowing ? "secondary" : "primary"}
        loading={followState.isLoading || unfollowState.isLoading}
        onClick={toggleFollow}
      >
        {isFollowing ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
        {isFollowing ? "Following" : "Follow"}
      </Button>
      <AuthPrompt open={authOpen} message="Sign in to follow this author." action="follow" onClose={() => setAuthOpen(false)} />
    </>
  );
};
