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

        {/* Tas Hair mark */}
        <img
          className="loading-spinner__mark"
          src="/logo-mark.png"
          alt=""
          width={markSize}
          height={markSize}
          aria-hidden="true"
        />
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
