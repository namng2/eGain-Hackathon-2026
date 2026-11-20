import Link from "next/link";
import { Card, buttonClasses } from "@/components/ui";

export default function NotFound() {
  return (
    <Card>
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="mt-2 text-sm text-stone-600">
        The link may be wrong, or the event may have been removed.
      </p>
      <Link href="/" className={`mt-4 ${buttonClasses("secondary")}`}>
        Back to home
      </Link>
    </Card>
  );
}
