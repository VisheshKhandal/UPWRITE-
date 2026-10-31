import { useLocation } from "react-router-dom";
import { Check, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFollowMutation, useUnfollowMutation } from "../../features/profiles/profilesApi";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { pushToast } from "../../features/ui/uiSlice";
import { Button } from "../ui/Button";
import { AuthPrompt } from "../auth/AuthPrompt";

export const FollowButton = ({ userId, username, following = false }: { userId: string; username?: string; following?: boolean }) => {
  const location = useLocation();
  const resumed = useRef(false);
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

  useEffect(() => {
    const state = location.state as { resumeAction?: string } | null;
    const marker = `upwrite.follow.resumed:${location.key}:${user?._id}:${userId}`;
    if (!user || resumed.current || state?.resumeAction !== `follow:${userId}` || sessionStorage.getItem(marker)) return;
    resumed.current = true; sessionStorage.setItem(marker, "true");
    if (!following) void follow({ id: userId, username }).unwrap().then(() => setIsFollowing(true)).catch(() => dispatch(pushToast({ title: "Could not follow this author. Please retry.", tone: "error" })));
  }, [user, userId, username, following, location.key, location.state, follow, dispatch]);

  return (
    <>
      <Button
        variant={isFollowing ? "secondary" : "primary"}
        loading={followState.isLoading || unfollowState.isLoading}
        onClick={toggleFollow}
        className="min-w-[6.75rem] tabular-nums"
      >
        {isFollowing ? <Check className="h-4 w-4 shrink-0" /> : <UserPlus className="h-4 w-4 shrink-0" />}
        <span>{isFollowing ? "Following" : "Follow"}</span>
      </Button>
      <AuthPrompt open={authOpen} message="Sign in to follow this author." action={`follow:${userId}`} onClose={() => setAuthOpen(false)} />
    </>
  );
};
