import { SearchX } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Page not found"
      description="The project or page you're looking for doesn't exist."
      className="h-dvh"
    >
      <Button asChild size="sm" variant="outline">
        <Link href="/">Go to DevFlow</Link>
      </Button>
    </EmptyState>
  );
}
