/** Inline mark matching the app icon — shield + folded receipt. */
export function LogoMark({
  className = "h-8 w-8",
  gradientId = "pv-logo-grad",
}: {
  className?: string;
  /** Unique per page — duplicate SVG ids break some WebViews when header + body both show the mark. */
  gradientId?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="4"
          y1="4"
          x2="28"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <path
        fill="white"
        fillOpacity="0.95"
        d="M16 6.5l7 3.2v7.4c0 4.1-2.8 7.9-7 9.1-4.2-1.2-7-5-7-9.1V9.7l7-3.2Zm0 1.5l-5.5 2.5v6.6c0 3.2 2.2 6.3 5.5 7.4 3.3-1.1 5.5-4.2 5.5-7.4v-6.6L16 8Z"
      />
      {/* Receipt sheet */}
      <path fill="white" fillOpacity="0.95" d="M13 13h5l2 2v7h-7v-9z" />
      {/* Folded corner */}
      <path fill="white" fillOpacity="0.75" d="M18 13v2h2l-2-2z" />
    </svg>
  );
}
