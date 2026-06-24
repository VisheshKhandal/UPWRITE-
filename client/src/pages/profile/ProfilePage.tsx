
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArticleCard } from "../../components/article/ArticleCard";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { PostCard } from "../../components/feed/PostCard";
import { FeedSkeleton } from "../../components/ui/Skeleton";
import { Tabs } from "../../components/ui/Tabs";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useArticlesQuery, useDeleteArticleMutation, useMyArticlesQuery } from "../../features/articles/articlesApi";
import { usePostsQuery } from "../../features/posts/postsApi";
import { useProfileQuery } from "../../features/profiles/profilesApi";
import { pushToast } from "../../features/ui/uiSlice";
import { getErrorMessage } from "../../utils/errors";
import { formatDate } from "../../utils/formatDate";

type ProfileTab = "articles" | "posts" | "drafts" | "activity";

export default function ProfilePage() {
  const { username = "" } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isOwnProfile = currentUser?.username === username;
  const profile = useProfileQuery(username, { skip: !username });
  const articles = useArticlesQuery(
    { limit: 12, author: profile.data?.username },
    { skip: !profile.data?.username }
  );
  const posts = usePostsQuery(
    { limit: 12, author: profile.data?.username },
    { skip: !profile.data?.username }
  );
  const drafts = useMyArticlesQuery({ status: "draft", limit: 20 }, { skip: !isOwnProfile });
  const [deleteArticle, deleteState] = useDeleteArticleMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("articles");

  const isLoading = profile.isLoading || articles.isLoading || posts.isLoading;

  const tabs = useMemo(() => {
    const items: Array<{ value: ProfileTab; label: string }> = [
      { value: "articles", label: "Articles" },
      { value: "posts", label: "Posts" },
      { value: "activity", label: "Activity" }
    ];

    if (isOwnProfile) {
      items.splice(2, 0, { value: "drafts", label: "Drafts" });
    }

    return items;
  }, [isOwnProfile]);

  const handleContinue = (draftId: string) => navigate(`/write/${draftId}`);

  const handleDelete = async (draftId: string) => {
    try {
      setDeletingId(draftId);
      await deleteArticle(draftId).unwrap();
      dispatch(pushToast({ title: "Draft deleted", tone: "success" }));
    } catch (error) {
      dispatch(pushToast({ title: getErrorMessage(error, "Could not delete draft"), tone: "error" }));
    } finally {
      setDeletingId(null);
    }
  };

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile/${username}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      dispatch(pushToast({ title: "Profile link copied", tone: "success" }));
    } catch {
      dispatch(pushToast({ title: "Unable to copy profile link", tone: "error" }));
    }
  };
if (profile.isLoading) return <FeedSkeleton />;
if (profile.error || !profile.data) return <ErrorState error={profile.error} />;
  const completionScore = [
  !!profile.data?.bio,
  !!profile.data?.skills?.length,
  !!profile.data?.interests?.length,
  !!profile.data?.socialLinks?.website,
  !!profile.data?.location
].filter(Boolean).length;

  const profileStrength = Math.round((completionScore / 5) * 100);
  const featuredArticle = articles.data?.[0] ?? null;
  const totalReads = articles.data?.reduce((sum, article) => sum + (article.stats?.viewsCount ?? 0), 0) ?? 0;
  const totalLikes = profile.data?.likesReceived ?? articles.data?.reduce((sum, article) => sum + (article.stats?.likesCount ?? 0), 0) ?? 0;

  const stats = [
    { label: "Articles", value: profile.data?.stats?.articlesCount ?? 0 },
    { label: "Posts", value: profile.data?.stats?.postsCount ?? 0 },
    { label: "Total reads", value: totalReads },
    { label: "Total likes", value: totalLikes },
    { label: "Followers", value: profile.data?.stats?.followersCount ?? 0 }
  ];

  // if (profile.isLoading) return <FeedSkeleton />;
  // if (profile.error || !profile.data) return <ErrorState error={profile.error} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <ProfileHeader profile={profile.data} isOwnProfile={isOwnProfile} onEdit={() => navigate("/settings/profile")} />

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <Card key={item.label} className="p-5">
              <p className="text-3xl font-semibold text-ink-950 dark:text-ink-50">{item.value}</p>
              <p className="mt-2 text-sm text-ink-500">{item.label}</p>
            </Card>
          ))}
          <Card className="p-5">
            <p className="text-sm uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Creator progress</p>
            <p className="mt-3 text-3xl font-semibold text-ink-950 dark:text-ink-50">{profileStrength}%</p>
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">Profile completion based on bio, socials, and creator details.</p>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Pinned article</p>
              <h2 className="mt-2 text-xl font-semibold text-ink-950 dark:text-ink-50">{isOwnProfile ? "Spotlight your best work" : `${profile.data.name}'s featured work`}</h2>
              <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">The latest published article is highlighted here until explicit pinning is available.</p>
            </div>
            {featuredArticle ? (
              <div className="rounded-3xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-800 dark:bg-ink-950/70">
                <h3 className="text-lg font-semibold text-ink-950 dark:text-ink-50">{featuredArticle.title}</h3>
                <p className="mt-2 text-sm text-ink-600 dark:text-ink-400 line-clamp-3">{featuredArticle.excerpt}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.3em] text-ink-500 dark:text-ink-400">Featured</span>
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/articles/${profile.data.username}/${featuredArticle.slug}`)}>
                    View article
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-ink-200 bg-ink-50 p-6 text-center text-sm text-ink-500 dark:border-ink-800 dark:bg-ink-950/70 dark:text-ink-400">
                No featured article yet.
                {isOwnProfile ? (
                  <Button className="mt-4" variant="secondary" size="sm" onClick={() => navigate("/write")}>Write your next feature</Button>
                ) : null}
              </div>
            )}
            <div className="grid gap-2">
              {isOwnProfile ? (
                <Button variant="secondary" onClick={() => navigate("/settings/profile")}>Edit profile</Button>
              ) : (
                <Link to={`/profile/${profile.data.username}`} className="text-sm font-medium text-accent-700 hover:underline dark:text-accent-300">View full profile</Link>
              )}
              <Button variant="ghost" onClick={handleShare}>Share profile</Button>
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Creator dashboard</p>
            <h1 className="text-3xl font-semibold text-ink-950 dark:text-ink-50">{profile.data.name}&apos;s content</h1>
          </div>
          <Tabs value={activeTab} onChange={setActiveTab} items={tabs} />
        </div>

        {activeTab === "articles" ? (
          isLoading ? (
            <FeedSkeleton />
          ) : articles.data?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {articles.data.map((article) => <ArticleCard key={article._id} article={article} />)}
            </div>
          ) : (
            <EmptyState title="No articles yet" description="This creator has not published any articles yet." />
          )
        ) : activeTab === "posts" ? (
          isLoading ? (
            <FeedSkeleton />
          ) : posts.data?.length ? (
            <div className="grid gap-4">
              {posts.data.map((post) => <PostCard key={post._id} post={post} />)}
            </div>
          ) : (
            <EmptyState title="No posts yet" description="This creator has not shared any posts yet." />
          )
        ) : activeTab === "drafts" ? (
          isOwnProfile ? (
            drafts.isLoading ? (
              <FeedSkeleton />
            ) : drafts.error ? (
              <ErrorState error={drafts.error} />
            ) : drafts.data?.length ? (
              <div className="grid gap-4">
                {drafts.data.map((draft) => (
                  <Card key={draft._id} className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium uppercase tracking-[0.16em] text-ink-500 dark:text-ink-400">Draft</p>
                        <h3 className="mt-2 text-xl font-semibold text-ink-950 dark:text-ink-50">{draft.title || "Untitled draft"}</h3>
                        <div className="mt-2 flex flex-wrap gap-2 text-sm text-ink-600 dark:text-ink-400">
                          <span>Last updated {formatDate(draft.updatedAt ?? draft.createdAt)}</span>
                          <span className="capitalize">Status: {draft.status}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleContinue(draft._id)}>
                          Continue editing
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={deleteState.isLoading && deletingId === draft._id}
                          onClick={() => handleDelete(draft._id)}
                        >
                          Delete draft
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No drafts yet"
                description="Save a draft from the writing page and it will appear here for easy access."
                action={<Button onClick={() => navigate("/write")}>Create first draft</Button>}
              />
            )
          ) : (
            <EmptyState title="Drafts are private" description="Drafts are only visible to the profile owner." />
          )
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="p-5">
              <h2 className="text-xl font-semibold text-ink-950 dark:text-ink-50">Activity overview</h2>
              <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
                Stay on top of your creator momentum and see how your work is resonating.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Card className="rounded-3xl p-5">
                  <p className="text-sm text-ink-500">Published articles</p>
                  <p className="mt-3 text-3xl font-semibold text-ink-950 dark:text-ink-50">{profile.data.stats?.articlesCount ?? 0}</p>
                </Card>
                <Card className="rounded-3xl p-5">
                  <p className="text-sm text-ink-500">Published posts</p>
                  <p className="mt-3 text-3xl font-semibold text-ink-950 dark:text-ink-50">{profile.data.stats?.postsCount ?? 0}</p>
                </Card>
                <Card className="rounded-3xl p-5">
                  <p className="text-sm text-ink-500">Likes received</p>
                  <p className="mt-3 text-3xl font-semibold text-ink-950 dark:text-ink-50">{profile.data.likesReceived ?? 0}</p>
                </Card>
                <Card className="rounded-3xl p-5">
                  <p className="text-sm text-ink-500">Followers</p>
                  <p className="mt-3 text-3xl font-semibold text-ink-950 dark:text-ink-50">{profile.data.stats?.followersCount ?? 0}</p>
                </Card>
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-xl font-semibold text-ink-950 dark:text-ink-50">What&apos;s next</h2>
              <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">Use this space to publish more content, grow your audience, and keep your profile in sync.</p>
              <div className="mt-5 flex flex-col gap-3">
                <Button variant="secondary" onClick={() => navigate("/write")}>Write a new article</Button>
                <Button variant="secondary" onClick={() => navigate("/write")}>Share an update</Button>
                <Button variant="ghost" onClick={() => navigate("/notifications")}>Review notifications</Button>
              </div>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
