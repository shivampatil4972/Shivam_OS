/**
 * Original vector wallpapers. All four render on the server; CSS shows the one
 * selected by <html data-wallpaper> and recolours it for the active theme, so
 * switching never flashes or downloads anything.
 */
const stop = (offset: string, color: string, opacity = 1) => (
  <stop offset={offset} style={{ stopColor: color, stopOpacity: opacity }} />
);

export function Wallpaper() {
  return (
    <div className="wallpaper pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="wp wp-aurora">
        <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
          <defs>
            <linearGradient id="wa-r1" x1="0" y1="0" x2="1" y2="0.4">
              {stop("0", "var(--wp-a1)", 0)}
              {stop("0.35", "var(--wp-a1)", 0.9)}
              {stop("0.7", "var(--wp-a2)", 0.75)}
              {stop("1", "var(--wp-a2)", 0)}
            </linearGradient>
            <linearGradient id="wa-r2" x1="0" y1="1" x2="1" y2="0">
              {stop("0", "var(--wp-a3)", 0)}
              {stop("0.5", "var(--wp-a3)", 0.7)}
              {stop("1", "var(--wp-a1)", 0)}
            </linearGradient>
            <filter id="wa-blur" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="38" />
            </filter>
          </defs>
          <g filter="url(#wa-blur)">
            <path d="M-100 520C200 330 420 300 700 380s560 120 1000-120l40 160c-420 260-700 230-1000 140S180 520-80 700Z" fill="url(#wa-r1)" />
            <path d="M-60 860c300-260 640-300 980-200s520 40 760-120l20 140c-260 180-520 220-800 140S200 760-40 980Z" fill="url(#wa-r2)" />
            <ellipse cx="1250" cy="170" rx="300" ry="120" style={{ fill: "var(--wp-a2)", opacity: 0.35 }} />
          </g>
          <path d="M-50 600C300 420 600 470 860 520s500 10 800-160" fill="none" style={{ stroke: "var(--wp-line)" }} strokeWidth="1.2" />
          <path d="M-50 640C320 470 620 520 880 560s500 0 780-170" fill="none" style={{ stroke: "var(--wp-line)", opacity: 0.6 }} strokeWidth="1" />
        </svg>
      </div>

      <div className="wp wp-graphite">
        <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
          <defs>
            <linearGradient id="wg-sky" x1="0" y1="0" x2="0" y2="1">
              {stop("0", "var(--wp-g0)")}
              {stop("1", "var(--wp-g1)")}
            </linearGradient>
            <linearGradient id="wg-r" x1="0" y1="0" x2="0" y2="1">
              {stop("0", "var(--wp-g2)")}
              {stop("1", "var(--wp-g3)")}
            </linearGradient>
          </defs>
          <rect width="1600" height="1000" fill="url(#wg-sky)" />
          <circle cx="1180" cy="250" r="90" style={{ fill: "var(--wp-g-sun)" }} opacity="0.5" />
          <path d="M0 640 220 470l140 90 210-210 200 170 160-120 260 220 180-140 230 160v380H0Z" fill="url(#wg-r)" opacity="0.55" />
          <path d="M0 740 180 600l170 110 230-170 210 160 190-110 240 170 200-100 160 90v250H0Z" fill="url(#wg-r)" opacity="0.8" />
          <path d="M0 850 240 720l220 100 260-130 240 140 240-90 220 110 180-60v210H0Z" fill="url(#wg-r)" />
          <path d="M220 470l140 90 210-210 200 170 160-120 260 220 180-140" fill="none" style={{ stroke: "var(--wp-line)" }} strokeWidth="1.2" />
        </svg>
      </div>

      <div className="wp wp-tide">
        <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
          <defs>
            <linearGradient id="wt-bg" x1="0" y1="0" x2="0" y2="1">
              {stop("0", "var(--wp-t0)")}
              {stop("1", "var(--wp-t1)")}
            </linearGradient>
            <linearGradient id="wt-w" x1="0" y1="0" x2="1" y2="1">
              {stop("0", "var(--wp-t2)", 0.9)}
              {stop("1", "var(--wp-t3)", 0.9)}
            </linearGradient>
          </defs>
          <rect width="1600" height="1000" fill="url(#wt-bg)" />
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M0 ${520 + i * 110}C260 ${430 + i * 110} 520 ${620 + i * 110} 800 ${540 + i * 110}S1340 ${440 + i * 110} 1600 ${520 + i * 110}V1000H0Z`}
              fill="url(#wt-w)"
              opacity={0.25 + i * 0.2}
            />
          ))}
          <path d="M0 520C260 430 520 620 800 540s540-100 800-20" fill="none" style={{ stroke: "var(--wp-line)" }} strokeWidth="1.4" />
        </svg>
      </div>

      <div className="wp wp-mist">
        <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
          <defs>
            <radialGradient id="wm-1" cx="0.25" cy="0.3" r="0.6">
              {stop("0", "var(--wp-m1)")}
              {stop("1", "var(--wp-m1)", 0)}
            </radialGradient>
            <radialGradient id="wm-2" cx="0.8" cy="0.75" r="0.6">
              {stop("0", "var(--wp-m2)")}
              {stop("1", "var(--wp-m2)", 0)}
            </radialGradient>
          </defs>
          <rect width="1600" height="1000" style={{ fill: "var(--wp-m0)" }} />
          <rect width="1600" height="1000" fill="url(#wm-1)" />
          <rect width="1600" height="1000" fill="url(#wm-2)" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={i} cx={800} cy={500} r={160 + i * 110} fill="none" style={{ stroke: "var(--wp-line)" }} strokeWidth="1" opacity={0.7 - i * 0.1} />
          ))}
        </svg>
      </div>
    </div>
  );
}
