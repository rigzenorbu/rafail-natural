// A small mountain in a circle, the same mark as on the Snow Land labels.
function Mark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 32 32">
        <path d="M5 23 13.2 11.5l3.3 4.4 2.6-3.4L27 23" />
        <path d="m13.2 11.5 1.6 4.1 1.7-.7" />
      </svg>
    </span>
  );
}

export function Logo({ tag = "From the heights of Ladakh" }: { tag?: string }) {
  return (
    <span className="brand">
      <Mark />
      <span className="brand-text">
        <span className="brand-name">Rafail Natural</span>
        <span className="brand-tag">{tag}</span>
      </span>
    </span>
  );
}
