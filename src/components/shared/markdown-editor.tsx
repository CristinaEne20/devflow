"use client";

import type { KeyboardEvent } from "react";
import { Markdown } from "@/components/shared/markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  /** Called on ⌘/Ctrl+Enter. */
  onSubmit?: () => void;
  /** When set, a hidden input carries the value so the editor works inside <form>. */
  name?: string;
  placeholder?: string;
  autoFocus?: boolean;
  rows?: number;
  maxLength?: number;
  "aria-label"?: string;
};

export function MarkdownEditor({
  value,
  onChange,
  onSubmit,
  name,
  placeholder = "Write in Markdown…",
  autoFocus,
  rows = 6,
  maxLength,
  "aria-label": ariaLabel,
}: MarkdownEditorProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && onSubmit) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <Tabs defaultValue="write" className="gap-2">
      {name && <input type="hidden" name={name} value={value} />}
      <TabsList className="h-8">
        <TabsTrigger value="write" className="text-xs">
          Write
        </TabsTrigger>
        <TabsTrigger value="preview" className="text-xs">
          Preview
        </TabsTrigger>
      </TabsList>
      <TabsContent value="write">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={rows}
          maxLength={maxLength}
          aria-label={ariaLabel}
          className="min-h-24 resize-y font-mono text-[13px] leading-relaxed"
        />
      </TabsContent>
      <TabsContent value="preview">
        <div className="min-h-24 rounded-md border px-3 py-2">
          {value.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing to preview.</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
