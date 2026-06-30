export function FractalBackground({
  patternId,
  strokeColor,
}: {
  patternId: string;
  strokeColor: string;
}) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.025] select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={patternId} x="0" y="0" width="80" height="69.28" patternUnits="userSpaceOnUse">
          <polygon points="40,0 80,69.28 0,69.28" fill="none" stroke={strokeColor} strokeWidth="0.5" />
          <polygon points="0,0 40,69.28 80,0" fill="none" stroke={strokeColor} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
