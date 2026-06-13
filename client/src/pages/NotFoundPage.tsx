import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export default function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <Card className="max-w-md p-8 text-center">
        <h1 className="text-3xl font-semibold tracking-normal">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-ink-600 dark:text-ink-400">This path does not exist in the current Upwrite app.</p>
        <Link to="/" className="mt-5 inline-flex">
          <Button>Back to feed</Button>
        </Link>
      </Card>
    </div>
  );
}
