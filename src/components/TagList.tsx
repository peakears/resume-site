interface TagListProps {
  items: string[];
  label: string;
}

export function TagList({ items, label }: TagListProps) {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="border-border text-muted rounded-full border px-3 py-1 font-mono text-xs"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
