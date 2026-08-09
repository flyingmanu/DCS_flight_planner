interface LogoProps {
  size?: number;
}

/** Compass ring + aircraft silhouette badge, used as the app icon in the header and favicon. */
export function Logo({ size = 26 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="47" fill="#0d1f30" />
      <circle cx="50" cy="50" r="47" fill="none" stroke="#e8a33d" strokeWidth="4" />
      <path
        d="M50,10 L58,34 L92,62 L74,62 L58,48 L60,78 L73,90 L50,82 L27,90 L40,78 L42,48 L26,62 L8,62 L42,34 Z"
        fill="#eef3f8"
      />
    </svg>
  );
}
