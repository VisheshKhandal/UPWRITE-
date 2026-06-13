import { FormEvent, useEffect, useMemo, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { ArticleEditor } from "../../components/article/ArticleEditor";
import { UploadDropzone } from "../../components/common/UploadDropzone";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Tabs } from "../../components/ui/Tabs";
import { Textarea } from "../../components/ui/Textarea";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useCreateArticleMutation, useMyArticleQuery, useUpdateArticleMutation } from "../../features/articles/articlesApi";
import { useCreatePostMutation } from "../../features/posts/postsApi";
import { pushToast } from "../../features/ui/uiSlice";
import { useUploadImageMutation } from "../../features/uploads/uploadsApi";
import { getImageSrc } from "../../utils/image";
import type { ImageAsset, PostType } from "../../types/models";
import { getErrorMessage } from "../../utils/errors";

type WriteTab = "article" | "post";

const postTypes: { value: PostType; label: string }[] = [
  { value: "learning", label: "Learning" },
  { value: "achievement", label: "Achievement" },
  { value: "insight", label: "Insight" },
  { value: "update", label: "Update" }
];

export default function WritePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<WriteTab>(() => (localStorage.getItem("upwrite-write-tab") as WriteTab | null) ?? "article");
  const [coverImage, setCoverImage] = useState<ImageAsset | undefined>();
  const { data: article } = useMyArticleQuery(id ?? "", { skip: !id });
  const currentUser = useAppSelector((state) => state.auth.user);
  const [createArticle, createState] = useCreateArticleMutation();
  const [updateArticle, updateState] = useUpdateArticleMutation();
  const [uploadImage, uploadState] = useUploadImageMutation();

  useEffect(() => {
    localStorage.setItem("upwrite-write-tab", tab);
  }, [tab]);

  const onUpload = async (file: File, context: "article_cover" | "post_media" = "article_cover") => {
    const asset = await uploadImage({ file, context }).unwrap();
    return { url: asset.url ?? asset.secureUrl, publicId: asset.publicId, secureUrl: asset.secureUrl };
  };

  const onArticleUpload = async (file: File) => {
    try {
      setCoverImage(await onUpload(file, "article_cover"));
      dispatch(pushToast({ title: "Cover uploaded", tone: "success" }));
    } catch (error) {
      dispatch(pushToast({ title: getErrorMessage(error, "Upload failed"), tone: "error" }));
    }
  };

  const save = async (input: Parameters<typeof createArticle>[0]) => {
    try {
      const saved = id
        ? await updateArticle({ id, body: input }).unwrap()
        : await createArticle(input).unwrap();
      dispatch(pushToast({ title: input.status === "published" ? "Article published" : "Draft saved", tone: "success" }));
      if (input.status === "published") navigate(`/articles/${saved.author?.username ?? currentUser?.username}/${saved.slug}`);
      else if (!id) navigate(`/write/${saved._id}`);
    } catch (error) {
      dispatch(pushToast({ title: getErrorMessage(error, "Could not save article"), tone: "error" }));
    }
  };

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-accent-700 dark:text-accent-300">Writing room</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Create knowledge worth returning to.</h1>
      </section>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "article", label: "Article" },
          { value: "post", label: "Post" }
        ]}
      />

      {tab === "article" ? (
        <ArticleEditor
          initialArticle={article}
          coverImage={coverImage ?? article?.coverImage}
          coverUploading={uploadState.isLoading}
          onCoverUpload={onArticleUpload}
          saving={createState.isLoading || updateState.isLoading}
          onSave={save}
        />
      ) : (
        <PostWriter onUpload={onUpload} uploadLoading={uploadState.isLoading} />
      )}
    </div>
  );
}

const PostWriter = ({
  onUpload,
  uploadLoading
}: {
  onUpload: (file: File, context: "article_cover" | "post_media") => Promise<ImageAsset>;
  uploadLoading: boolean;
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<PostType>("learning");
  const [tags, setTags] = useState("");
  const [cover, setCover] = useState<ImageAsset | null>(null);
  const [createPost, createState] = useCreatePostMutation();
  const tagList = useMemo(
    () => tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    [tags]
  );

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !body.trim() || body.length > 500) return;

    try {
      await createPost({
        title: title.trim(),
        body: body.trim(),
        type,
        tags: tagList,
        media: cover ? [cover] : undefined
      }).unwrap();
      dispatch(pushToast({ title: "Post published", tone: "success" }));
      navigate("/");
    } catch (error) {
      dispatch(pushToast({ title: getErrorMessage(error, "Could not publish post"), tone: "error" }));
    }
  };

  const uploadCover = async (file: File) => {
    try {
      setCover(await onUpload(file, "post_media"));
      dispatch(pushToast({ title: "Cover uploaded", tone: "success" }));
    } catch (error) {
      dispatch(pushToast({ title: getErrorMessage(error, "Upload failed"), tone: "error" }));
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <Card className="space-y-4 p-4 sm:p-6">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Post title" />
        <Textarea
          value={body}
          maxLength={500}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Share a focused update, idea, or lesson..."
          className="min-h-52 text-base leading-7"
        />
        <div className="flex justify-end text-sm text-ink-500">{body.length}/500</div>
        <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="react, launch, learning" />
        <UploadDropzone label="Optional post cover image" onFile={uploadCover} loading={uploadLoading} />
        {cover ? (
          <div className="relative overflow-hidden rounded-lg border border-ink-200 dark:border-ink-800">
            <img src={getImageSrc(cover)} alt="Post cover" className="h-56 w-full object-cover" />
            <Button type="button" variant="danger" size="sm" className="absolute right-3 top-3" onClick={() => setCover(null)}>
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
        ) : null}
      </Card>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="p-4">
          <h2 className="font-semibold text-ink-950 dark:text-ink-50">Category</h2>
          <Tabs value={type} onChange={setType} items={postTypes} className="mt-4 flex flex-wrap" />
        </Card>
        <Card className="p-4">
          <Button className="w-full" loading={createState.isLoading} disabled={!title.trim() || !body.trim() || body.length > 500}>
            <Send className="h-4 w-4" />
            Publish post
          </Button>
        </Card>
      </aside>
    </form>
  );
};
