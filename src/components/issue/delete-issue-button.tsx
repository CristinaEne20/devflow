"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteIssue } from "@/actions/issue-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type DeleteIssueButtonProps = { issueId: string; issueKey: string; onDeleted: () => void };

export function DeleteIssueButton({ issueId, issueKey, onDeleted }: DeleteIssueButtonProps) {
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    // Close the drawer first so it never renders the now-missing issue.
    onDeleted();
    startTransition(async () => {
      const result = await deleteIssue({ id: issueId });
      if (result.ok) toast.success(`${issueKey} deleted`);
      else toast.error(result.error);
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          aria-label={`Delete ${issueKey}`}
          disabled={isPending}
        >
          <Trash2 aria-hidden className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {issueKey}?</AlertDialogTitle>
          <AlertDialogDescription>
            The issue and its comments will be permanently deleted. Child issues are kept and lose their parent.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
            Delete issue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
