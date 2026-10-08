"use client";

import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyLinkButton() {
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link");
    }
  }

  return (
    <Button variant="ghost" size="icon" className="size-8" onClick={copy} aria-label="Copy link to issue">
      <Link2 aria-hidden className="size-4" />
    </Button>
  );
}
