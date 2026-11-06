import Image from "next/image";

interface AvatarProps {
  name: string;
  headshot?: { src: string; alt: string };
}

/** Round headshot, or the person's initials when there's no photo yet. */
export function Avatar({ name, headshot }: AvatarProps) {
  const className =
    "border-border size-20 shrink-0 rounded-full border-2 sm:size-24 print:hidden";

  if (headshot) {
    return (
      <Image
        src={headshot.src}
        alt={headshot.alt}
        width={192}
        height={192}
        priority
        className={`${className} object-cover`}
      />
    );
  }

  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    // The name is the h1 right next to this, so the initials are decorative.
    <div
      aria-hidden="true"
      className={`${className} bg-surface text-accent flex items-center justify-center font-mono text-2xl font-semibold sm:text-3xl`}
    >
      {initials}
    </div>
  );
}
