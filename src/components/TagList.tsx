interface TagListProps {
  items: string[];
  label: string;
}

export function TagList({ items, label }: TagListProps) {
  return (
    <ul
      aria-label={label}
      className="flex flex-wrap gap-2 print:gap-x-1.5 print:gap-y-0"
    >
      {items.map((item) => (
        <li
          key={item}
          className="border-border text-muted rounded-full border px-3 py-1 font-mono text-xs print:rounded-none print:border-0 print:p-0 print:font-sans print:text-[0.95em] print:after:content-[','] print:last:after:content-none"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
