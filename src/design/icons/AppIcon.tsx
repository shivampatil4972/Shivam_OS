import { useId, type ReactNode } from "react";
import type { AppId } from "@/os/apps";

/**
 * Original dimensional icon family.
 * Shared material rules: one light source from the top-left; every tile has a
 * vertical body gradient, a soft top gloss, a hairline edge highlight and an
 * ambient-occlusion shade at the bottom; every glyph has a lit face gradient,
 * a darker extruded side offset down-right, and a soft contact shadow.
 */
type Palette = { top: string; bottom: string; angle?: "vertical" | "diagonal" };

const TILES: Record<AppId, Palette> = {
  home: { top: "#4f93ff", bottom: "#1745c4" },
  projects: { top: "#ffc659", bottom: "#ee6a1a" },
  ask: { top: "#ff9f72", bottom: "#6b3df2", angle: "diagonal" },
  about: { top: "#43e3c8", bottom: "#0c8574" },
  skills: { top: "#b8a1ff", bottom: "#5f31dc" },
  education: { top: "#7482ff", bottom: "#272c97" },
  experience: { top: "#8693a8", bottom: "#283141" },
  research: { top: "#55e6a3", bottom: "#0a8453" },
  "ai-lab": { top: "#a06cff", bottom: "#12bfdc", angle: "diagonal" },
  xray: { top: "#1f3160", bottom: "#050916" },
  github: { top: "#3e4656", bottom: "#12161d" },
  terminal: { top: "#2d333d", bottom: "#06080b" },
  resume: { top: "#ff8080", bottom: "#c4223f" },
  contact: { top: "#62ccff", bottom: "#1271d0" },
  settings: { top: "#b3bcc9", bottom: "#4f5868" },
  quality: { top: "#ff80c4", bottom: "#b81a6e" },
  recruiter: { top: "#ffb69c", bottom: "#b8472f" },
  // Spotlight is not a window app but shares the family.
} as Record<AppId, Palette>;

const SPOTLIGHT_TILE: Palette = { top: "#f6f8fc", bottom: "#b3bdcc" };

type Ref = (name: string) => string;

function Defs({ r, tile }: { r: Ref; tile: Palette }) {
  const diagonal = tile.angle === "diagonal";
  return (
    <>
      <linearGradient id={r("tile")} x1="0" y1="0" x2={diagonal ? "1" : "0"} y2="1">
        <stop offset="0" stopColor={tile.top} />
        <stop offset="1" stopColor={tile.bottom} />
      </linearGradient>
      <linearGradient id={r("gloss")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.42" />
        <stop offset="0.48" stopColor="#fff" stopOpacity="0.06" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={r("ao")} cx="0.5" cy="1.08" r="0.62">
        <stop offset="0" stopColor="#000" stopOpacity="0.32" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={r("edge")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
        <stop offset="0.35" stopColor="#fff" stopOpacity="0.08" />
        <stop offset="1" stopColor="#fff" stopOpacity="0.18" />
      </linearGradient>
      {/* Glyph materials */}
      <linearGradient id={r("ceramic")} x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="1" stopColor="#d5deec" />
      </linearGradient>
      <linearGradient id={r("ceramicSide")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9aa8bf" />
        <stop offset="1" stopColor="#6c7a93" />
      </linearGradient>
      <linearGradient id={r("metal")} x1="0.1" y1="0" x2="0.9" y2="1">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.45" stopColor="#c9d1dc" />
        <stop offset="0.55" stopColor="#aeb8c6" />
        <stop offset="1" stopColor="#e9edf3" />
      </linearGradient>
      <linearGradient id={r("glass")} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.55" />
      </linearGradient>
      <filter id={r("shadow")} x="-30%" y="-30%" width="160%" height="170%">
        <feDropShadow dx="0" dy="1.8" stdDeviation="1.5" floodColor="#000" floodOpacity="0.32" />
      </filter>
    </>
  );
}

/** A glyph's darker extruded side: the same shape offset down-right. */
function Extrude({ children, r }: { children: ReactNode; r: Ref }) {
  return (
    <g transform="translate(1.1 1.6)" fill={`url(#${r("ceramicSide")})`} opacity="0.9">
      {children}
    </g>
  );
}

function gearPath(cx: number, cy: number, outer: number, inner: number, teeth: number): string {
  const pts: string[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const corners = [
      [a - step * 0.28, inner],
      [a - step * 0.16, outer],
      [a + step * 0.16, outer],
      [a + step * 0.28, inner],
    ] as const;
    for (const [ang, rad] of corners) pts.push(`${(cx + rad * Math.cos(ang)).toFixed(2)},${(cy + rad * Math.sin(ang)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

const GEAR = gearPath(32, 32, 19.5, 15.2, 9);
/** Speech bubble with a tail at the lower left (Ask SHIVAM.OS). */
const BUBBLE = "M17 16h30a5.5 5.5 0 0 1 5.5 5.5v16A5.5 5.5 0 0 1 47 43H28.5l-8.6 7.2a1.1 1.1 0 0 1-1.8-.85V43H17a5.5 5.5 0 0 1-5.5-5.5v-16A5.5 5.5 0 0 1 17 16Z";

function Glyph({ id, r }: { id: AppId | "spotlight"; r: Ref }) {
  const C = `url(#${r("ceramic")})`;
  const M = `url(#${r("metal")})`;
  switch (id) {
    case "home":
      return (
        <>
          <Extrude r={r}>
            <path d="M32 15 49 29v18a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2V29Z" />
          </Extrude>
          <path d="M32 15 49 29v18a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2V29Z" fill={C} />
          <path d="M12.5 30.5 32 14l19.5 16.5" fill="none" stroke="#fff" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12.5 30.5 32 14l19.5 16.5" fill="none" stroke="#000" strokeOpacity="0.12" strokeWidth="1" transform="translate(0 2.6)" strokeLinecap="round" />
          <rect x="27.5" y="35" width="9" height="14" rx="2.2" fill="#1745c4" />
          <rect x="28.6" y="36.2" width="3" height="11" rx="1.2" fill="#fff" opacity="0.22" />
          <circle cx="34.4" cy="42.5" r="0.9" fill="#ffc659" />
        </>
      );
    case "projects":
      return (
        <>
          <path d="M14 20a3 3 0 0 1 3-3h9.5l3.5 4H47a3 3 0 0 1 3 3v19H14Z" fill="#fde2b3" />
          <path d="M14 20a3 3 0 0 1 3-3h9.5l3.5 4H47a3 3 0 0 1 3 3v2H14Z" fill="#fff" opacity="0.5" />
          <Extrude r={r}>
            <path d="M11 29a3 3 0 0 1 3-3h36a3 3 0 0 1 3 3l-2 17a3 3 0 0 1-3 2.7H16a3 3 0 0 1-3-2.7Z" />
          </Extrude>
          <path d="M11 29a3 3 0 0 1 3-3h36a3 3 0 0 1 3 3l-2 17a3 3 0 0 1-3 2.7H16a3 3 0 0 1-3-2.7Z" fill={C} />
          <path d="M14 27.2h36" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
          <rect x="27" y="33" width="10" height="3" rx="1.5" fill="#ee6a1a" opacity="0.75" />
        </>
      );
    case "ask":
      return (
        <>
          <linearGradient id={r("spark")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff9f72" />
            <stop offset="1" stopColor="#6b3df2" />
          </linearGradient>
          <Extrude r={r}>
            <path d={BUBBLE} />
          </Extrude>
          <path d={BUBBLE} fill={C} />
          <path d="M17.5 17.9h29" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M24.5 22.5c.9 4.7 2.7 6.5 7.4 7.4-4.7.9-6.5 2.7-7.4 7.4-.9-4.7-2.7-6.5-7.4-7.4 4.7-.9 6.5-2.7 7.4-7.4Z" fill={`url(#${r("spark")})`} />
          <path d="M23.4 25.6c.3 1.6.9 2.4 2.2 2.9" stroke="#fff" strokeOpacity="0.7" strokeWidth="0.9" strokeLinecap="round" fill="none" />
          <path d="M35.5 20.5c.4 2 1.1 2.7 3.1 3.1-2 .4-2.7 1.1-3.1 3.1-.4-2-1.1-2.7-3.1-3.1 2-.4 2.7-1.1 3.1-3.1Z" fill="#ff9f72" />
          <rect x="35" y="30" width="12" height="2.4" rx="1.2" fill="#7a879c" />
          <rect x="35" y="34.6" width="8" height="2.2" rx="1.1" fill="#a6b1c2" />
        </>
      );
    case "about":
      return (
        <>
          <radialGradient id={r("head")} cx="0.35" cy="0.3" r="0.75">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#cfdbe8" />
          </radialGradient>
          <Extrude r={r}>
            <path d="M16.5 50c0-9.4 6.8-15 15.5-15s15.5 5.6 15.5 15Z" />
          </Extrude>
          <path d="M16.5 50c0-9.4 6.8-15 15.5-15s15.5 5.6 15.5 15Z" fill={C} />
          <circle cx="33" cy="25.6" r="8.6" fill="#0c8574" opacity="0.35" />
          <circle cx="32" cy="24.4" r="8.6" fill={`url(#${r("head")})`} />
          <ellipse cx="29" cy="20.6" rx="3" ry="1.8" fill="#fff" opacity="0.8" />
        </>
      );
    case "skills":
      return (
        <>
          <path d="M32 13 49 22.5v19L32 51 15 41.5v-19Z" fill="#3b1aa6" opacity="0.35" transform="translate(1 1.6)" />
          <path d="M32 13 49 22.5 32 32 15 22.5Z" fill="#f4efff" />
          <path d="M15 22.5 32 32v19l-17-9.5Z" fill="#cbbcff" />
          <path d="M49 22.5 32 32v19l17-9.5Z" fill="#9479f2" />
          <path d="M32 13 49 22.5 32 32 15 22.5Z" fill="none" stroke="#fff" strokeWidth="0.8" />
          <path d="M32 32v19" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.8" />
          <path d="M24 18.5 32 23l8-4.5" fill="none" stroke="#5f31dc" strokeOpacity="0.35" strokeWidth="1.2" />
        </>
      );
    case "education":
      return (
        <>
          <path d="M20 31v9.5c0 4 24 4 24 0V31l-12 5.4Z" fill="#c9cff7" />
          <path d="M20 31v9.5c0 1.5 3.5 2.6 8 3V34Z" fill="#fff" opacity="0.35" />
          <path d="M32 15.5 55 26 32 36.5 9 26Z" fill="#1d2170" opacity="0.35" transform="translate(0.8 1.6)" />
          <path d="M32 15.5 55 26 32 36.5 9 26Z" fill={C} />
          <path d="M32 15.5 55 26" stroke="#fff" strokeWidth="1" />
          <path d="M32 26 49 30.5V41" fill="none" stroke="#ffc659" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M47.6 41h2.8l.9 5h-4.6Z" fill="#ffc659" />
          <circle cx="32" cy="26" r="1.8" fill="#ffc659" />
        </>
      );
    case "experience":
      return (
        <>
          <linearGradient id={r("leather")} x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor="#f6cf9a" />
            <stop offset="1" stopColor="#bf7f40" />
          </linearGradient>
          <path d="M25 21v-3.2a3.2 3.2 0 0 1 3.2-3.2h7.6a3.2 3.2 0 0 1 3.2 3.2V21" fill="none" stroke="#8a5525" strokeWidth="3.4" />
          <rect x="13" y="21" width="38" height="28" rx="5.5" fill="#6e4218" transform="translate(1 1.6)" opacity="0.6" />
          <rect x="13" y="21" width="38" height="28" rx="5.5" fill={`url(#${r("leather")})`} />
          <path d="M13 31.5h38" stroke="#8a5525" strokeOpacity="0.6" strokeWidth="1.4" />
          <rect x="13.6" y="21.6" width="36.8" height="4" rx="2" fill="#fff" opacity="0.25" />
          <rect x="28.5" y="28.6" width="7" height="6.4" rx="1.6" fill={M} />
        </>
      );
    case "research":
      return (
        <>
          <clipPath id={r("flask")}>
            <path d="M27.5 24 16.5 45.5c-1.2 2.4.6 4.5 3 4.5h25c2.4 0 4.2-2.1 3-4.5L36.5 24Z" />
          </clipPath>
          <path d="M27.5 24 16.5 45.5c-1.2 2.4.6 4.5 3 4.5h25c2.4 0 4.2-2.1 3-4.5L36.5 24Z" fill="#053d27" opacity="0.4" transform="translate(1 1.6)" />
          <path d="M27.5 24 16.5 45.5c-1.2 2.4.6 4.5 3 4.5h25c2.4 0 4.2-2.1 3-4.5L36.5 24Z" fill={`url(#${r("glass")})`} />
          <g clipPath={`url(#${r("flask")})`}>
            <rect x="10" y="36" width="44" height="20" fill="#b7f7d6" />
            <rect x="10" y="40" width="44" height="16" fill="#2fd38a" />
            <ellipse cx="32" cy="36.4" rx="13" ry="1.6" fill="#fff" opacity="0.8" />
            <circle cx="27" cy="44" r="1.6" fill="#fff" opacity="0.8" />
            <circle cx="35" cy="41.5" r="1.1" fill="#fff" opacity="0.7" />
            <circle cx="31" cy="47" r="0.9" fill="#fff" opacity="0.7" />
          </g>
          <rect x="26" y="12" width="12" height="13" rx="1.6" fill={`url(#${r("glass")})`} />
          <rect x="24.5" y="11" width="15" height="3.4" rx="1.7" fill="#fff" />
          <path d="M20.5 44 28 29" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
        </>
      );
    case "ai-lab":
      return (
        <>
          <radialGradient id={r("core")} cx="0.36" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.45" stopColor="#dcd2ff" />
            <stop offset="1" stopColor="#6d3ee6" />
          </radialGradient>
          <ellipse cx="32" cy="33" rx="22" ry="8.5" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="2" transform="rotate(-18 32 33)" />
          <circle cx="32" cy="33" r="11.5" fill="#2b1580" opacity="0.35" transform="translate(1 1.6)" />
          <circle cx="32" cy="33" r="11.5" fill={`url(#${r("core")})`} />
          <ellipse cx="28.4" cy="28.4" rx="3.6" ry="2.2" fill="#fff" opacity="0.85" />
          <path d="M10.6 39.4C14 43 24 43.4 36 40s17.8-8.6 17.8-13" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" transform="rotate(-2 32 33)" />
          <circle cx="51.6" cy="27.2" r="2.3" fill="#fff" />
          <circle cx="13" cy="40.2" r="1.6" fill="#a7f3ff" />
          <path d="M48 12.5c.5 2.8 1.6 3.9 4.4 4.4-2.8.5-3.9 1.6-4.4 4.4-.5-2.8-1.6-3.9-4.4-4.4 2.8-.5 3.9-1.6 4.4-4.4Z" fill="#fff" />
        </>
      );
    case "xray":
      return (
        <>
          <linearGradient id={r("plate")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#c9fbff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#3cc8e8" stopOpacity="0.65" />
          </linearGradient>
          {[0, 1, 2].map((i) => {
            const y = 38 - i * 9;
            return (
              <g key={i} opacity={0.55 + i * 0.22}>
                <path d={`M32 ${y - 9} 50 ${y} 32 ${y + 9} 14 ${y}Z`} fill={`url(#${r("plate")})`} />
                <path d={`M14 ${y}v2.2L32 ${y + 11.2}l18-9V${y}L32 ${y + 9}Z`} fill="#0a6c8a" />
                <path d={`M32 ${y - 9} 50 ${y}`} stroke="#fff" strokeWidth="0.8" />
              </g>
            );
          })}
          <rect x="8" y="26.2" width="48" height="1.6" rx="0.8" fill="#7af3ff" />
          <rect x="8" y="24" width="48" height="6" rx="3" fill="#7af3ff" opacity="0.18" />
        </>
      );
    case "github":
      return (
        <>
          <path d="M22 18v28M22 24c0 7 20 2 20 9" fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="4.2" strokeLinecap="round" transform="translate(1 1.6)" />
          <path d="M22 18v28M22 24c0 7 20 2 20 9" fill="none" stroke={M} strokeWidth="4.2" strokeLinecap="round" />
          <circle cx="22" cy="17" r="5.4" fill={C} />
          <circle cx="22" cy="47" r="5.4" fill={C} />
          <circle cx="42" cy="33" r="6" fill={C} />
          <circle cx="42" cy="33" r="2.8" fill="#3ddc84" />
          <circle cx="22" cy="17" r="2.2" fill="#3e4656" />
          <circle cx="22" cy="47" r="2.2" fill="#3e4656" />
        </>
      );
    case "terminal":
      return (
        <>
          <rect x="10.5" y="15" width="43" height="34" rx="6" fill="#000" opacity="0.5" transform="translate(1 1.6)" />
          <rect x="10.5" y="15" width="43" height="34" rx="6" fill="#0d131c" stroke="#fff" strokeOpacity="0.16" />
          <rect x="11" y="15.5" width="42" height="7" rx="5.5" fill="#fff" opacity="0.08" />
          <circle cx="16" cy="19" r="1.2" fill="#ff6b6b" />
          <circle cx="20" cy="19" r="1.2" fill="#ffc04d" />
          <circle cx="24" cy="19" r="1.2" fill="#3ddc84" />
          <path d="m18.5 28.5 7 5-7 5" fill="none" stroke="#3ddc84" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="29" y="37" width="13" height="3.4" rx="1.7" fill="#eef2f9" />
        </>
      );
    case "spotlight":
      return (
        <>
          <linearGradient id={r("lens")} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#dff0ff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#5aa2ff" stopOpacity="0.55" />
          </linearGradient>
          <path d="m38.5 38.5 10 10" stroke="#3b4658" strokeWidth="7.4" strokeLinecap="round" transform="translate(0.8 1.4)" opacity="0.5" />
          <path d="m38.5 38.5 10 10" stroke="#5b6678" strokeWidth="6.6" strokeLinecap="round" />
          <path d="m40 40 8 8" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="28" cy="28" r="13" fill={`url(#${r("lens")})`} />
          <circle cx="28" cy="28" r="13" fill="none" stroke={M} strokeWidth="4.4" />
          <path d="M20.5 25a8.5 8.5 0 0 1 6-6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        </>
      );
    case "resume":
      return (
        <>
          <Extrude r={r}>
            <path d="M19 11.5h19l10.5 10.5v27a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3v-34.5a3 3 0 0 1 3-3Z" />
          </Extrude>
          <path d="M19 11.5h19l10.5 10.5v27a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3v-34.5a3 3 0 0 1 3-3Z" fill={C} />
          <path d="M38 11.5V19a3 3 0 0 0 3 3h7.5Z" fill="#c4cfe0" />
          <circle cx="24.5" cy="22.5" r="3.6" fill="#c4223f" opacity="0.85" />
          <rect x="30.5" y="20.2" width="8" height="2.2" rx="1.1" fill="#7a879c" />
          <rect x="30.5" y="23.8" width="5.5" height="1.8" rx="0.9" fill="#a6b1c2" />
          {[31, 35.5, 40, 44.5].map((y, i) => (
            <rect key={y} x="21" y={y} width={i === 3 ? 14 : 22} height="2" rx="1" fill="#a6b1c2" />
          ))}
        </>
      );
    case "contact":
      return (
        <>
          <Extrude r={r}>
            <rect x="11.5" y="18" width="41" height="29" rx="4.5" />
          </Extrude>
          <rect x="11.5" y="18" width="41" height="29" rx="4.5" fill={C} />
          <path d="m12.8 20.5 19.2 14 19.2-14" fill="none" stroke="#1271d0" strokeOpacity="0.55" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="m13 45 13.5-11.5M51 45 37.5 33.5" stroke="#9fb0c8" strokeWidth="1.4" />
          <path d="M14 19.2h36" stroke="#fff" strokeWidth="1.1" />
        </>
      );
    case "settings":
      return (
        <>
          <path d={GEAR} fill="#2b313c" opacity="0.45" transform="translate(1 1.6)" />
          <path d={GEAR} fill={M} />
          <circle cx="32" cy="32" r="11" fill="none" stroke="#8a95a6" strokeWidth="1" />
          <circle cx="32" cy="32" r="6.4" fill="#4f5868" />
          <circle cx="32" cy="32" r="6.4" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1" />
          <path d="M25 22.5a12 12 0 0 1 8-3" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
        </>
      );
    case "quality":
      return (
        <>
          <Extrude r={r}>
            <path d="M32 11.5 48.5 18v12c0 11-7.3 18.4-16.5 22.2C22.8 48.4 15.5 41 15.5 30V18Z" />
          </Extrude>
          <path d="M32 11.5 48.5 18v12c0 11-7.3 18.4-16.5 22.2C22.8 48.4 15.5 41 15.5 30V18Z" fill={C} />
          <path d="M32 11.5V52.2C22.8 48.4 15.5 41 15.5 30V18Z" fill="#fff" opacity="0.4" />
          <path d="m24 31.5 6 6 11-12" fill="none" stroke="#1fb35a" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    case "recruiter":
      return (
        <>
          <Extrude r={r}>
            <rect x="12.5" y="19" width="39" height="29" rx="5" />
          </Extrude>
          <rect x="12.5" y="19" width="39" height="29" rx="5" fill={C} />
          <rect x="27.5" y="13" width="9" height="9" rx="2.4" fill={M} />
          <rect x="29.5" y="16.5" width="5" height="1.6" rx="0.8" fill="#6b7686" />
          <circle cx="24" cy="31" r="5" fill="#d9674a" />
          <path d="M17 42.5c.6-3.6 3.4-5.4 7-5.4s6.4 1.8 7 5.4Z" fill="#d9674a" />
          <rect x="34" y="28" width="12.5" height="2.4" rx="1.2" fill="#7a879c" />
          <rect x="34" y="33" width="9" height="2" rx="1" fill="#a6b1c2" />
          <rect x="34" y="37.4" width="11" height="2" rx="1" fill="#a6b1c2" />
        </>
      );
    default:
      return null;
  }
}

export interface AppIconProps {
  app: AppId | "spotlight";
  size?: number;
  className?: string;
  /** Accessible name; omit when the icon sits next to visible text. */
  label?: string;
}

export function AppIcon({ app, size = 56, className, label }: AppIconProps) {
  const raw = useId();
  const prefix = `ic${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
  const r: Ref = (name) => `${prefix}-${name}`;
  const tile = app === "spotlight" ? SPOTLIGHT_TILE : TILES[app];
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <defs>
        <Defs r={r} tile={tile} />
      </defs>
      <rect width="64" height="64" rx="14.5" fill={`url(#${r("tile")})`} />
      <rect width="64" height="64" rx="14.5" fill={`url(#${r("ao")})`} />
      <rect width="64" height="64" rx="14.5" fill={`url(#${r("gloss")})`} />
      <g filter={`url(#${r("shadow")})`}>
        <Glyph id={app} r={r} />
      </g>
      <rect x="0.5" y="0.5" width="63" height="63" rx="14" fill="none" stroke={`url(#${r("edge")})`} strokeWidth="1" />
    </svg>
  );
}
