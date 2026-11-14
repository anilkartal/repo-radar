/** Render text with `backtick` spans as <code>. */
export function InlineCode({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
          <code
            key={i}
            className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.85em] break-words text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}
