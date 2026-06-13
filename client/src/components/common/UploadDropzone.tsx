import { Upload } from "lucide-react";
import { useRef } from "react";
import { Button } from "../ui/Button";

export const UploadDropzone = ({
  label,
  onFile,
  loading
}: {
  label: string;
  onFile: (file: File) => void;
  loading?: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-lg border border-dashed border-ink-300 bg-ink-50 p-4 text-center dark:border-ink-700 dark:bg-ink-950">
      <Upload className="mx-auto h-5 w-5 text-ink-400" />
      <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
        }}
      />
      <Button variant="secondary" size="sm" loading={loading} className="mt-3" onClick={() => inputRef.current?.click()}>
        Choose image
      </Button>
    </div>
  );
};
