import { useEffect, useMemo, useState } from "react";
import { Send, Trash2 } from "lucide-react";
import { useCreatePostMutation } from "../../features/posts/postsApi";
import { useUploadImageMutation } from "../../features/uploads/uploadsApi";
import type { ImageAsset, PostType } from "../../types/models";
import { getErrorMessage } from "../../utils/errors";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../features/ui/uiSlice";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Textarea } from "../ui/Textarea";
import { Tabs } from "../ui/Tabs";
import { UploadDropzone } from "../common/UploadDropzone";

const postTypes: { value: PostType; label: string }[] = [
  { value: "learning", label: "Learning" },
  { value: "achievement", label: "Achievement" },
  { value: "insight", label: "Insight" },
  { value: "update", label: "Update" }
];

export const PostComposer = () => {
  const dispatch = useAppDispatch();
  const [type, setType] = useState<PostType>("learning");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [mediaAsset, setMediaAsset] = useState<ImageAsset | null>(null);
  const [createPost, { isLoading }] = useCreatePostMutation();
  const [uploadImage, uploadState] = useUploadImageMutation();

  const tagList = useMemo(
    () =>
      tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tags]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMediaAsset(null);
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreviewUrl(undefined);
    setMediaAsset(null);
  };

  const onSubmit = async () => {
    if (!body.trim()) return;

    try {
      let media = mediaAsset ? [mediaAsset] : undefined;

      if (selectedFile && !mediaAsset) {
        const upload = await uploadImage({ file: selectedFile, context: "post_media" }).unwrap();
        const freshMedia: ImageAsset = {
          url: upload.url ?? upload.secureUrl,
          secureUrl: upload.secureUrl ?? upload.url,
          publicId: upload.publicId
        };
        setMediaAsset(freshMedia);
        media = [freshMedia];
      }

      await createPost({
        type,
        body: body.trim(),
        tags: tagList,
        media
      }).unwrap();

      setBody("");
      setTags("");
      clearImage();
      dispatch(pushToast({ title: "Post shared", tone: "success" }));
    } catch (error) {
      dispatch(pushToast({ title: getErrorMessage(error, "Could not create post"), tone: "error" }));
    }
  };

  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        <Tabs items={postTypes} value={type} onChange={setType} className="w-full overflow-x-auto sm:w-auto" />
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="What did you learn, build, understand, or complete today?"
          className="min-h-28 border-0 bg-ink-50 text-base shadow-none dark:bg-ink-950"
        />

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-3">
            <UploadDropzone label="Attach an image to this post" onFile={handleFile} loading={uploadState.isLoading} />
            {previewUrl ? (
              <div className="relative overflow-hidden rounded-2xl border border-ink-200 bg-ink-100 dark:border-ink-800 dark:bg-ink-900">
                <img src={previewUrl} alt="Post preview" className="h-52 w-full object-cover" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/70 px-3 py-1 text-xs text-white transition hover:bg-black"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="react, system-design, dsa"
              className="h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm dark:border-ink-800 dark:bg-ink-900"
            />
            <Button onClick={onSubmit} loading={isLoading || uploadState.isLoading} disabled={!body.trim()}>
              <Send className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
