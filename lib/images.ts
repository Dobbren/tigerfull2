// Helper to serve all local assets as optimized WebP via Next.js + sharp
// without modifying or replacing the original files in /public/assets.
export function optImg(src: string, width: 96 | 128 | 256 | 384 | 640 | 1080, quality: 75 | 80 = 75): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

export const ASSETS = {
  templeBg: optImg("/assets/fortune-tiger-bg.webp", 640, 75),
  logo: optImg("/assets/fortune-tiger-logo.png", 384, 80),
  tiger: optImg("/assets/symbols/tiger.png", 256, 80),
  gameBg: optImg("/assets/game-bg.jpg", 1080, 75),
  symbols: {
    tangerina: optImg("/assets/symbols/tangerina.png", 256, 75),
    fogos: optImg("/assets/symbols/fogos.png", 256, 75),
    envelope: optImg("/assets/symbols/envelope.png", 256, 75),
    saco: optImg("/assets/symbols/saco.png", 256, 75),
    dragao: optImg("/assets/symbols/dragao.png", 256, 75),
    ovos: optImg("/assets/symbols/ovos.png", 256, 75),
    wild: optImg("/assets/symbols/wild_new.png", 256, 75),
  },
  virginia: optImg("/assets/virginia.jpg", 96, 75),
  commenters: {
    f1: optImg("/assets/commenters/f1.jpg", 96, 75),
    f2: optImg("/assets/commenters/f2.jpg", 96, 75),
    f3: optImg("/assets/commenters/f3.jpg", 96, 75),
    f4: optImg("/assets/commenters/f4.jpg", 96, 75),
    h1: optImg("/assets/commenters/h1.jpg", 96, 75),
    h2: optImg("/assets/commenters/h2.jpg", 96, 75),
    h3: optImg("/assets/commenters/h3.jpg", 96, 75),
    h4: optImg("/assets/commenters/h4.jpg", 96, 75),
  },
  comprovativos: {
    comp1: optImg("/assets/comprovativos/comp-1.jpg", 384, 80), // 119.300,00 Kz
    comp2: optImg("/assets/comprovativos/comp-2.jpg", 384, 80), // 107.820,00 Kz
    comp3: optImg("/assets/comprovativos/comp-3.jpg", 384, 80), // 103.078,64 Kz
    comp4: optImg("/assets/comprovativos/comp-4.jpg", 384, 80), // 140.000,00 Kz
    comp5: optImg("/assets/comprovativos/comp-5.jpg", 384, 80), // 148.000,00 Kz
    comp6: optImg("/assets/comprovativos/comp-6.jpg", 384, 80), // 200.000,00 Kz
    comp7: optImg("/assets/comprovativos/comp-7.jpg", 384, 80), // 183.200,00 Kz
    comp8: optImg("/assets/comprovativos/comp-8.jpg", 384, 80), // 281.250,00 Kz (Benedito Antonio Pedro)
  },
} as const;

export const GAME_SYMBOL_LIST = [
  ASSETS.symbols.tangerina,
  ASSETS.symbols.fogos,
  ASSETS.symbols.envelope,
  ASSETS.symbols.saco,
  ASSETS.symbols.dragao,
  ASSETS.symbols.ovos,
  ASSETS.symbols.wild,
];

// Keep decoded Image objects alive in memory so the browser never evicts
// decoded bitmaps when switching pages or spinning the slot machine.
const imageCache = new Map<string, HTMLImageElement>();

export function preloadAndDecode(urls: string[], priority: "high" | "low" = "low") {
  if (typeof window === "undefined") return;
  for (const url of urls) {
    if (imageCache.has(url)) continue;
    const img = new Image();
    img.decoding = "async";
    if ("fetchPriority" in img) {
      (img as HTMLImageElement & { fetchPriority: string }).fetchPriority = priority;
    }
    img.src = url;
    img.decode?.().catch(() => {});
    imageCache.set(url, img);
  }
}

export function preloadGameAssets() {
  preloadAndDecode([ASSETS.gameBg, ASSETS.logo, ...GAME_SYMBOL_LIST], "high");
}

export function preloadVideoAssets() {
  preloadAndDecode(
    [
      ASSETS.virginia,
      ...Object.values(ASSETS.commenters),
      ...Object.values(ASSETS.comprovativos),
    ],
    "low"
  );
}
