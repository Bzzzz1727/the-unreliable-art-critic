import { ArtworkCategory } from '../types';

export interface SampleArtworkDef {
  id: string;
  name: string;
  category: ArtworkCategory;
  statement: string;
  svgContent: string;
}

export const SAMPLE_ARTWORKS: SampleArtworkDef[] = [
  {
    id: 'sample-01',
    name: 'EXHIBITION 1972 — KUNSTHALLE BASEL',
    category: 'Poster',
    statement: 'A revival of late Swiss modernism exploring structural hierarchy and asymmetric tension.',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1200" width="800" height="1200">
      <rect width="800" height="1200" fill="#0A0A0A" />
      <line x1="60" y1="60" x2="740" y2="60" stroke="#292929" stroke-width="1" />
      <text x="60" y="140" fill="#F5F5F5" font-family="Helvetica, Arial, sans-serif" font-size="44" font-weight="900" letter-spacing="-1">INTERNATIONALE</text>
      <text x="60" y="190" fill="#F5F5F5" font-family="Helvetica, Arial, sans-serif" font-size="44" font-weight="900" letter-spacing="-1">TYPOGRAPHIE 72</text>
      <text x="60" y="240" fill="#D71920" font-family="Helvetica, Arial, sans-serif" font-size="16" font-weight="bold" letter-spacing="4">BASEL / KUNSTHALLE</text>
      <rect x="60" y="320" width="480" height="480" fill="#D71920" />
      <circle cx="540" cy="800" r="220" fill="#F5F5F5" opacity="0.9" />
      <rect x="180" y="520" width="300" height="420" fill="#0A0A0A" />
      <text x="210" y="620" fill="#F5F5F5" font-family="Courier, monospace" font-size="14" letter-spacing="1">GRID 12-COL / SYS-A</text>
      <text x="210" y="650" fill="#929292" font-family="Courier, monospace" font-size="12">SCALE: 1:1.414</text>
      <line x1="60" y1="1080" x2="740" y2="1080" stroke="#292929" stroke-width="1" />
      <text x="60" y="1120" fill="#929292" font-family="Helvetica, Arial, sans-serif" font-size="12" letter-spacing="1">CURATED BY THE DIALECTICAL COMMITTEE</text>
      <text x="620" y="1120" fill="#F5F5F5" font-family="Courier, monospace" font-size="12">NR. 00481</text>
    </svg>`
  },
  {
    id: 'sample-02',
    name: 'DISCORDANT MONOLITH — ALBUM COVER',
    category: 'Album cover',
    statement: 'Album sleeve for an experimental drone quartet. Strict monochromatic claustrophobia and raw soundscape.',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
      <rect width="1000" height="1000" fill="#000000" />
      <rect x="100" y="100" width="800" height="800" fill="none" stroke="#292929" stroke-width="1" />
      <polygon points="500,180 820,780 180,780" fill="#141414" stroke="#F5F5F5" stroke-width="2" />
      <line x1="500" y1="180" x2="500" y2="780" stroke="#D71920" stroke-width="3" />
      <circle cx="500" cy="540" r="140" fill="#000000" stroke="#292929" stroke-width="2" />
      <text x="140" y="150" fill="#929292" font-family="Courier, monospace" font-size="14" letter-spacing="2">SIDE A — 33 RPM</text>
      <text x="860" y="150" fill="#D71920" font-family="Courier, monospace" font-size="14" text-anchor="end">STEREO</text>
      <text x="500" y="930" fill="#F5F5F5" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="300" letter-spacing="8" text-anchor="middle">THE MONOLITH SINGS</text>
    </svg>`
  },
  {
    id: 'sample-03',
    name: 'SILHOUETTE NOIR — EXPRESSIVE FIGURE',
    category: 'Illustration',
    statement: 'Minimalist high-contrast character study exploring negative space and deliberate visual discomfort.',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
      <rect width="800" height="1000" fill="#121212" />
      <circle cx="400" cy="360" r="180" fill="#EAEAEA" />
      <path d="M 280,360 Q 400,200 520,360 Q 480,560 380,540 Z" fill="#D71920" />
      <circle cx="440" cy="340" r="30" fill="#121212" />
      <path d="M 200,900 C 260,600 540,600 600,900 Z" fill="#050505" stroke="#2A2A2A" stroke-width="2" />
      <line x1="120" y1="940" x2="680" y2="940" stroke="#D71920" stroke-width="2" />
      <text x="400" y="975" fill="#888888" font-family="Courier, monospace" font-size="14" letter-spacing="4" text-anchor="middle">FIGURE // NOCTURNE</text>
    </svg>`
  },
  {
    id: 'sample-04',
    name: 'MANUSCRIPT OF ANOMALIES — TYPOGRAPHY',
    category: 'Typography',
    statement: 'A typographic investigation into redacted historical records and institutional silence.',
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1200" width="900" height="1200">
      <rect width="900" height="1200" fill="#070707" />
      <text x="80" y="120" fill="#929292" font-family="Courier, monospace" font-size="14">DOCUMENT CLASSIFICATION: UNVERIFIED</text>
      <line x1="80" y1="140" x2="820" y2="140" stroke="#D71920" stroke-width="2" />
      <text x="80" y="240" fill="#F5F5F5" font-family="Georgia, serif" font-size="64" font-weight="normal">Redacted</text>
      <text x="80" y="320" fill="#F5F5F5" font-family="Georgia, serif" font-size="64" font-style="italic">Discourse.</text>
      <rect x="80" y="380" width="560" height="24" fill="#F5F5F5" />
      <rect x="80" y="420" width="420" height="24" fill="#D71920" />
      <rect x="80" y="460" width="680" height="24" fill="#F5F5F5" />
      <rect x="80" y="500" width="300" height="24" fill="#292929" />
      <text x="80" y="600" fill="#929292" font-family="Courier, monospace" font-size="16">PARAGRAPH 9 — EXCISED BY CURATORIAL DECREE</text>
      <line x1="80" y1="620" x2="820" y2="620" stroke="#292929" stroke-width="1" />
      <text x="80" y="740" fill="#F5F5F5" font-family="Georgia, serif" font-size="28" font-style="italic">"We searched for truth and found only alignment guides."</text>
      <circle cx="700" cy="950" r="100" fill="none" stroke="#D71920" stroke-width="1" stroke-dasharray="4 4" />
      <text x="700" y="955" fill="#D71920" font-family="Courier, monospace" font-size="12" text-anchor="middle">ANOMALY DETECTED</text>
    </svg>`
  }
];

export function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}
