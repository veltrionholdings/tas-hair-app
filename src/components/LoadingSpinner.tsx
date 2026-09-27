import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  /** Diameter of the spinner in pixels. Default 72. */
  size?: number;
  /** Optional message shown below the spinner. */
  label?: string;
  /** When true, fills its parent and centres itself (for full-page loading states). */
  fullPage?: boolean;
  /** When true, renders as a fixed overlay covering the viewport. */
  overlay?: boolean;
}

/**
 * Branded loading indicator: the Tas Hair mark inside an animated circular ring.
 * Use `fullPage` for in-page loading states and `overlay` for blocking actions.
 */
export default function LoadingSpinner({
  size = 72,
  label,
  fullPage = false,
  overlay = false,
}: LoadingSpinnerProps) {
  const ringSize = size;
  const markSize = Math.round(size * 0.56);

  const spinner = (
    <div className="loading-spinner" role="status" aria-live="polite">
      <div
        className="loading-spinner__ring"
        style={{ width: ringSize, height: ringSize }}
      >
        <svg
          className="loading-spinner__ring-svg"
          viewBox="0 0 50 50"
          width={ringSize}
          height={ringSize}
          aria-hidden="true"
        >
          <circle
            className="loading-spinner__track"
            cx="25"
            cy="25"
            r="22"
            fill="none"
            strokeWidth="3"
          />
          <circle
            className="loading-spinner__arc"
            cx="25"
            cy="25"
            r="22"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>

        {/* Tas Hair mark (matches favicon.svg) */}
        <svg
          className="loading-spinner__mark"
          viewBox="0 0 64 64"
          width={markSize}
          height={markSize}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="lsHairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E8CCF0" />
              <stop offset="45%" stopColor="#D8A8E8" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="14" fill="#7B2D8B" />
          <path
            d="M 22 16 L 44 16 L 27 38 Z"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinejoin="round"
            opacity="0.95"
          />
          <g fill="url(#lsHairGrad)">
            <path d="M 33 19 C 41 24, 43 33, 40 43 C 37 49, 33 53, 32 58 C 31 53, 33 47, 34 42 C 31 47, 28 52, 27 57 C 26 52, 29 45, 31 40 C 28 44, 25 48, 24 53 C 24 47, 28 40, 32 35 C 31 29, 31 24, 33 19 Z" />
          </g>
        </svg>
      </div>

      {label && <p className="loading-spinner__label">{label}</p>}
      <span className="sr-only">Loading</span>
    </div>
  );

  if (overlay) {
    return <div className="loading-spinner__overlay">{spinner}</div>;
  }

  if (fullPage) {
    return <div className="loading-spinner__fullpage">{spinner}</div>;
  }

  return spinner;
}
