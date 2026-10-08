export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {messages[0]}
    </p>
  );
}
