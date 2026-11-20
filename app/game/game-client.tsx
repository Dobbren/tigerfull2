"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { trackFb } from "@/lib/fbq";
import { ASSETS, preloadGameAssets, preloadVideoAssets } from "@/lib/images";

const gameBg = ASSETS.gameBg;
const fortuneTigerLogo = ASSETS.logo;
const tangerinaSym = ASSETS.symbols.tangerina;
const fogosSym = ASSETS.symbols.fogos;
const envelopeSym = ASSETS.symbols.envelope;
const sacoSym = ASSETS.symbols.saco;
const dragaoSym = ASSETS.symbols.dragao;
const ovosSym = ASSETS.symbols.ovos;
const wildSym = ASSETS.symbols.wild;


const SYMBOLS = [tangerinaSym, fogosSym, envelopeSym, sacoSym, dragaoSym, ovosSym, wildSym];

// Preload & pre-decode all symbol images immediately (client only)
if (typeof window !== "undefined") {
  preloadGameAssets();
}
const SYMBOL_NAMES: Record<string, string> = {
  [tangerinaSym]: "Tangerina",
  [fogosSym]: "Fogos de artifício",
  [envelopeSym]: "Envelope vermelho",
  [sacoSym]: "Saco de Moedas",
  [dragaoSym]: "Dragão de Jade",
  [ovosSym]: "Ovos de ouro",
  [wildSym]: "Wild"
};

const randomSymbol = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
const generateGrid = () =>
Array.from({ length: 3 }, () =>
Array.from({ length: 3 }, () => randomSymbol())
);

// Predefined winning grids with clear winning patterns + highlighted cells
// winCells = array of [row, col] positions that form the winning line
const WINNING_SEQUENCES = [
// Row wins
{ grid: [[sacoSym, sacoSym, sacoSym], [fogosSym, ovosSym, envelopeSym], [tangerinaSym, wildSym, fogosSym]], amount: 5000, type: "GRANDE GANHO", winCells: [[0, 0], [0, 1], [0, 2]] },
{ grid: [[envelopeSym, ovosSym, tangerinaSym], [fogosSym, fogosSym, fogosSym], [wildSym, sacoSym, envelopeSym]], amount: 8000, type: "GRANDE GANHO", winCells: [[1, 0], [1, 1], [1, 2]] },
{ grid: [[ovosSym, fogosSym, envelopeSym], [tangerinaSym, wildSym, sacoSym], [ovosSym, ovosSym, ovosSym]], amount: 10000, type: "MEGA GANHO", winCells: [[2, 0], [2, 1], [2, 2]] },
{ grid: [[dragaoSym, envelopeSym, fogosSym], [dragaoSym, ovosSym, sacoSym], [dragaoSym, wildSym, envelopeSym]], amount: 12000, type: "MEGA GANHO", winCells: [[0, 0], [1, 0], [2, 0]] },
{ grid: [[fogosSym, wildSym, ovosSym], [envelopeSym, wildSym, sacoSym], [tangerinaSym, wildSym, fogosSym]], amount: 15000, type: "MEGA GANHO", winCells: [[0, 1], [1, 1], [2, 1]] },
{ grid: [[envelopeSym, ovosSym, sacoSym], [fogosSym, envelopeSym, tangerinaSym], [wildSym, fogosSym, envelopeSym]], amount: 5000, type: "GRANDE GANHO", winCells: [[0, 0], [1, 1], [2, 2]] },
{ grid: [[tangerinaSym, fogosSym, wildSym], [ovosSym, wildSym, sacoSym], [wildSym, envelopeSym, ovosSym]], amount: 10000, type: "MEGA GANHO", winCells: [[0, 2], [1, 1], [2, 0]] },
{ grid: [[dragaoSym, dragaoSym, dragaoSym], [dragaoSym, wildSym, dragaoSym], [envelopeSym, fogosSym, ovosSym]], amount: 20000, type: "MEGA GANHO", winCells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2]] },
{ grid: [[wildSym, fogosSym, tangerinaSym], [wildSym, sacoSym, ovosSym], [wildSym, envelopeSym, fogosSym]], amount: 15000, type: "MEGA GANHO", winCells: [[0, 0], [1, 0], [2, 0]] },
{ grid: [[wildSym, wildSym, wildSym], [wildSym, wildSym, wildSym], [wildSym, wildSym, wildSym]], amount: 30000, type: "SUPER MEGA GANHO", winCells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]] }];


const MARQUEE_TEXTS = [
"🐯 Fortune Tiger · Jogue e ganhe grandes prémios!",
"💰 Multiplicadores até 2500x 🔥",
"🎰 Fortune Tiger · Jogue e ganhe grandes prémios!",
"💎 Multiplicadores até 2500x 💰"];


// === SOUND UTILITIES ===
const AudioCtx = typeof AudioContext !== "undefined" ? AudioContext : null;
let sharedAudioCtx: AudioContext | null = null;
const getAudioCtx = (): AudioContext | null => {
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
};

const playLoseSound = () => {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    // Descending sad tone
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.15);
      gain.gain.setValueAtTime(0.1, now + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.25);
    });
  } catch {}
};

const playCoinsSound = () => {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;

    // === CASH REGISTER "KA-CHING" ===
    // Initial percussive hit
    const hitBuf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
    const hitData = hitBuf.getChannelData(0);
    for (let i = 0; i < hitData.length; i++) hitData[i] = (Math.random() * 2 - 1) * 0.6;
    const hit = ctx.createBufferSource();
    hit.buffer = hitBuf;
    const hitGain = ctx.createGain();
    hitGain.gain.setValueAtTime(0.25, now);
    hitGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    hit.connect(hitGain).connect(ctx.destination);
    hit.start(now);
    hit.stop(now + 0.04);

    // "Ka" - mechanical lever sound
    const ka = ctx.createOscillator();
    const kaGain = ctx.createGain();
    ka.type = "square";
    ka.frequency.setValueAtTime(150, now);
    ka.frequency.exponentialRampToValueAtTime(80, now + 0.06);
    kaGain.gain.setValueAtTime(0.12, now);
    kaGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    ka.connect(kaGain).connect(ctx.destination);
    ka.start(now);
    ka.stop(now + 0.08);

    // "CHING!" - bright bell ring
    const chingTime = now + 0.1;
    [4200, 5600, 6800].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, chingTime);
      g.gain.setValueAtTime(0.18 - i * 0.04, chingTime);
      g.gain.exponentialRampToValueAtTime(0.001, chingTime + 0.6);
      osc.connect(g).connect(ctx.destination);
      osc.start(chingTime);
      osc.stop(chingTime + 0.6);
    });

    // === MONEY/COINS CASCADE ===
    const cascadeStart = now + 0.3;
    for (let i = 0; i < 16; i++) {
      const t = cascadeStart + i * 0.05 + Math.random() * 0.02;
      const freq = 2000 + Math.random() * 3000;

      // Coin clink
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, t + 0.015);
      g.gain.setValueAtTime(0.1 + Math.random() * 0.06, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);

      // Tiny metallic noise per coin
      const nb = ctx.createBuffer(1, ctx.sampleRate * 0.015, ctx.sampleRate);
      const nd = nb.getChannelData(0);
      for (let j = 0; j < nd.length; j++) nd[j] = (Math.random() * 2 - 1) * 0.15;
      const ns = ctx.createBufferSource();
      ns.buffer = nb;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.06, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
      ns.connect(ng).connect(ctx.destination);
      ns.start(t);
      ns.stop(t + 0.015);
    }

    // Final double "CHING CHING!" 
    const finalT = cascadeStart + 16 * 0.05 + 0.1;
    [0, 0.12].forEach((offset) => {
      [4500, 5800].forEach((freq) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, finalT + offset);
        g.gain.setValueAtTime(0.2, finalT + offset);
        g.gain.exponentialRampToValueAtTime(0.001, finalT + offset + 0.5);
        osc.connect(g).connect(ctx.destination);
        osc.start(finalT + offset);
        osc.stop(finalT + offset + 0.5);
      });
    });
  } catch {}
};

const playBigWinSound = () => {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    // Ascending fanfare
    const notes = [523, 659, 784, 1047, 1319, 1568];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.1, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.3);
    });
  } catch {}
};

const playSpinSound = () => {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    
    // Lever pull sound at start
    const lever = ctx.createOscillator();
    const leverGain = ctx.createGain();
    lever.type = "sawtooth";
    lever.frequency.setValueAtTime(300, now);
    lever.frequency.exponentialRampToValueAtTime(100, now + 0.12);
    leverGain.gain.setValueAtTime(0.15, now);
    leverGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    lever.connect(leverGain).connect(ctx.destination);
    lever.start(now);
    lever.stop(now + 0.15);

    // Continuous reel spinning ticks (slot machine reels)
    const totalTicks = 18;
    for (let i = 0; i < totalTicks; i++) {
      const decel = i > 12 ? (i - 12) * 0.025 : 0;
      const t = now + 0.1 + i * 0.065 + decel;
      
      // Mechanical click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(600 + Math.random() * 200, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.03);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.04);
      
      // Metallic resonance
      const res = ctx.createOscillator();
      const rGain = ctx.createGain();
      res.type = "sine";
      res.frequency.setValueAtTime(1200 + Math.random() * 600, t);
      rGain.gain.setValueAtTime(0.08, t);
      rGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      res.connect(rGain).connect(ctx.destination);
      res.start(t);
      res.stop(t + 0.06);
    }
    
    // Final stop "clunk"
    const stopT = now + 1.2;
    const clunk = ctx.createOscillator();
    const clunkGain = ctx.createGain();
    clunk.type = "square";
    clunk.frequency.setValueAtTime(150, stopT);
    clunk.frequency.exponentialRampToValueAtTime(60, stopT + 0.08);
    clunkGain.gain.setValueAtTime(0.2, stopT);
    clunkGain.gain.exponentialRampToValueAtTime(0.001, stopT + 0.1);
    clunk.connect(clunkGain).connect(ctx.destination);
    clunk.start(stopT);
    clunk.stop(stopT + 0.1);
  } catch {};
};

// Sparkle particle component
const Sparkle = ({ x, y, delay, size }: {x: number;y: number;delay: number;size: number;}) =>
<div
  className="pointer-events-none fixed z-[101]"
  style={{
    left: `${x}%`,
    top: `${y}%`,
    width: size,
    height: size,
    borderRadius: "50%",
    background: `radial-gradient(circle, hsl(45 100% 70%), hsl(45 100% 50%), transparent)`,
    animation: `sparkle 0.8s ${delay}s ease-out forwards`,
    opacity: 0
  }} />;
const playSuperMegaSound = () => {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;

    // === DRAMATIC DRUM ROLL ===
    for (let i = 0; i < 20; i++) {
      const t = now + i * 0.04;
      const nb = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
      const nd = nb.getChannelData(0);
      for (let j = 0; j < nd.length; j++) nd[j] = (Math.random() * 2 - 1) * (0.1 + i * 0.015);
      const ns = ctx.createBufferSource();
      ns.buffer = nb;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.05 + i * 0.01, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      ns.connect(ng).connect(ctx.destination);
      ns.start(t);
      ns.stop(t + 0.03);
    }

    // === EPIC CYMBAL CRASH ===
    const crashT = now + 0.85;
    const crashBuf = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
    const crashData = crashBuf.getChannelData(0);
    for (let i = 0; i < crashData.length; i++) crashData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.3));
    const crashSrc = ctx.createBufferSource();
    crashSrc.buffer = crashBuf;
    const crashFilter = ctx.createBiquadFilter();
    crashFilter.type = "highpass";
    crashFilter.frequency.value = 3000;
    const crashGain = ctx.createGain();
    crashGain.gain.setValueAtTime(0.25, crashT);
    crashGain.gain.exponentialRampToValueAtTime(0.001, crashT + 0.8);
    crashSrc.connect(crashFilter).connect(crashGain).connect(ctx.destination);
    crashSrc.start(crashT);
    crashSrc.stop(crashT + 0.8);

    // === TRIUMPHANT FANFARE (brass-like) ===
    const fanfareT = now + 0.9;
    const fanfareNotes = [
      { freq: 523, dur: 0.2 },  // C5
      { freq: 659, dur: 0.2 },  // E5
      { freq: 784, dur: 0.2 },  // G5
      { freq: 1047, dur: 0.4 }, // C6 (hold)
      { freq: 1319, dur: 0.2 }, // E6
      { freq: 1568, dur: 0.6 }, // G6 (grand hold)
    ];
    let offset = 0;
    fanfareNotes.forEach(({ freq, dur }) => {
      const t = fanfareT + offset;
      // Main tone
      const osc1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(freq, t);
      g1.gain.setValueAtTime(0.08, t);
      g1.gain.setValueAtTime(0.08, t + dur * 0.7);
      g1.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc1.connect(g1).connect(ctx.destination);
      osc1.start(t);
      osc1.stop(t + dur);

      // Harmonic for richness
      const osc2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc2.type = "square";
      osc2.frequency.setValueAtTime(freq * 2, t);
      g2.gain.setValueAtTime(0.03, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc2.connect(g2).connect(ctx.destination);
      osc2.start(t);
      osc2.stop(t + dur);

      offset += dur * 0.85;
    });

    // === MASSIVE COIN EXPLOSION ===
    const coinStart = now + 1.8;
    for (let i = 0; i < 30; i++) {
      const t = coinStart + i * 0.04 + Math.random() * 0.03;
      const freq = 2500 + Math.random() * 4000;

      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.01);
      g.gain.setValueAtTime(0.12 + Math.random() * 0.06, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    }

    // === DEEP BASS IMPACT ===
    const bassT = now + 0.88;
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = "sine";
    bassOsc.frequency.setValueAtTime(80, bassT);
    bassOsc.frequency.exponentialRampToValueAtTime(30, bassT + 0.5);
    bassGain.gain.setValueAtTime(0.3, bassT);
    bassGain.gain.exponentialRampToValueAtTime(0.001, bassT + 0.5);
    bassOsc.connect(bassGain).connect(ctx.destination);
    bassOsc.start(bassT);
    bassOsc.stop(bassT + 0.5);

    // === FINAL GRAND "CHA-CHING!!!" ===
    const grandT = now + 3.2;
    [0, 0.15, 0.3].forEach((off) => {
      [4200, 5600, 7000].forEach((freq) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, grandT + off);
        g.gain.setValueAtTime(0.2, grandT + off);
        g.gain.exponentialRampToValueAtTime(0.001, grandT + off + 0.7);
        osc.connect(g).connect(ctx.destination);
        osc.start(grandT + off);
        osc.stop(grandT + off + 0.7);
      });
    });
  } catch {}
};



const FloatingCoin = ({ delay, left, emoji }: {delay: number;left: number;emoji: string;}) =>
<div
  className="pointer-events-none fixed z-[100] text-2xl"
  style={{
    left: `${left}%`,
    animation: `coinFall 2s ${delay}s ease-in forwards`,
    top: "-30px"
  }}>

    {emoji}
  </div>;


// Confetti piece for win popup
const CONFETTI_COLORS = [
"hsl(45 100% 50%)", "hsl(0 80% 50%)", "hsl(145 60% 45%)",
"hsl(45 100% 70%)", "hsl(280 80% 60%)", "hsl(200 80% 55%)",
"hsl(30 100% 50%)", "hsl(350 80% 55%)"];


const ConfettiPiece = ({ delay, left, color, size, duration }: {delay: number;left: number;color: string;size: number;duration: number;}) =>
<div
  className="pointer-events-none absolute z-[92]"
  style={{
    left: `${left}%`,
    top: "-2%",
    width: size,
    height: size * (Math.random() > 0.5 ? 2.5 : 1),
    background: color,
    borderRadius: Math.random() > 0.5 ? "50%" : "2px",
    animation: `confettiFall ${duration}s ${delay}s ease-in forwards`,
    opacity: 0,
    animationFillMode: "forwards"
  }} />;



const GoldCoin = ({ delay, left }: {delay: number;left: number;}) =>
<div
  className="pointer-events-none absolute z-[92] flex items-center justify-center rounded-full border-2"
  style={{
    left: `${left}%`,
    top: "-5%",
    width: 28,
    height: 28,
    background: "linear-gradient(135deg, hsl(45 100% 65%), hsl(40 90% 45%))",
    borderColor: "hsl(45 100% 40%)",
    animation: `goldCoinSpin ${2.5 + Math.random()}s ${delay}s ease-in forwards`,
    opacity: 0
  }}>

    <span className="text-xs font-black" style={{ color: "hsl(40 90% 30%)" }}>$</span>
  </div>;


type Screen = "game" | "finished" | "levantamento" | "iban" | "multicaixa" | "verificando" | "verificado";

// Generate a 10-round plan: fixed structure, total exactly 115k
// Rounds 1-2: WIN, Rounds 3-10: 3 losses scattered, round 7 is MEGA WIN (42k)
const generateRoundPlan = () => {
  const FIXED_TOTAL = 115000;
  const MEGA_AMOUNT = 42000;
  const MEGA_ROUND = 6; // index 6 = round 7
  
  // Fixed: exactly 3 losses, never on rounds 1,2 or 7
  // Possible loss positions: 2,3,4,5,7,8,9 (indices)
  const possibleLossIndices = [2, 3, 4, 5, 7, 8, 9];
  const shuffled = [...possibleLossIndices].sort(() => Math.random() - 0.5);
  const lossRounds = new Set(shuffled.slice(0, 3));
  
  // Remaining amount for non-mega wins
  const remainingAmount = FIXED_TOTAL - MEGA_AMOUNT; // 73,000
  
  // Win rounds excluding mega round
  const normalWinIndices: number[] = [];
  for (let i = 0; i < 10; i++) {
    if (i !== MEGA_ROUND && !lossRounds.has(i)) {
      normalWinIndices.push(i);
    }
  }
  
  // Distribute remainingAmount across normal wins
  let distributed = 0;
  const amounts: number[] = [];
  normalWinIndices.forEach((_, idx) => {
    if (idx < normalWinIndices.length - 1) {
      // Random between 8k-18k, rounded to 1000
      const amt = (8 + Math.floor(Math.random() * 11)) * 1000;
      amounts.push(amt);
      distributed += amt;
    } else {
      amounts.push(remainingAmount - distributed);
    }
  });
  
  // Build plan
  const plan: { isWin: boolean; seqIndex: number; amount: number }[] = [];
  let normalIdx = 0;
  
  for (let i = 0; i < 10; i++) {
    if (lossRounds.has(i)) {
      plan.push({ isWin: false, seqIndex: 0, amount: 0 });
    } else if (i === MEGA_ROUND) {
      // Round 7 always uses the SUPER MEGA GANHO sequence (index 9 - all wilds)
      plan.push({ isWin: true, seqIndex: WINNING_SEQUENCES.length - 1, amount: MEGA_AMOUNT });
    } else {
      // Normal wins: pick any sequence EXCEPT the last one (SUPER MEGA GANHO)
      plan.push({ isWin: true, seqIndex: Math.floor(Math.random() * (WINNING_SEQUENCES.length - 1)), amount: amounts[normalIdx] });
      normalIdx++;
    }
  }
  
  return plan;
};

const Game = () => {
  const router = useRouter();
  const [grid, setGrid] = useState(generateGrid);
  const [spinning, setSpinning] = useState(false);
  const [rodadas, setRodadas] = useState(0);
  const [saldo, setSaldo] = useState(0);
  const [roundPlan] = useState(() => generateRoundPlan());
  const [ganho, setGanho] = useState(0);
  const [aposta] = useState(1000);
  const [showWinPopup, setShowWinPopup] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [winType, setWinType] = useState("GRANDE GANHO");
  const [showCoins, setShowCoins] = useState(false);
  const [showWinGlow, setShowWinGlow] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [tigerCelebrating, setTigerCelebrating] = useState(false);
  const [winCells, setWinCells] = useState<number[][]>([]);
  const [isSuperMega, setIsSuperMega] = useState(false);
  const [screen, setScreen] = useState<Screen>("game");
  const [showLimitMsg, setShowLimitMsg] = useState(false);
  const [mcxNumber, setMcxNumber] = useState("");
  const [ibanNumber, setIbanNumber] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const autoPlayRef = useRef(false);
  const [turbo, setTurbo] = useState(false);

  useEffect(() => {
    preloadGameAssets();
    preloadVideoAssets();
    router.prefetch("/video");
  }, [router]);

  const spin = useCallback(() => {
    if (spinning) return;
    if (rodadas >= 10) {
      setShowLimitMsg(true);
      setTimeout(() => setShowLimitMsg(false), 3000);
      return;
    }
    setSpinning(true);
    setGanho(0);
    setShowWinPopup(false);
    setShowWinGlow(false);
    playSpinSound();

    let count = 0;
    const maxTicks = turbo ? 8 : 12;
    const tickMs = turbo ? 35 : 55;
    intervalRef.current = setInterval(() => {
      setGrid(generateGrid());
      count++;
      if (count >= maxTicks) {
        if (intervalRef.current) clearInterval(intervalRef.current);

        const currentPlan = roundPlan[rodadas];
        const newRodadas = rodadas + 1;
        setRodadas(newRodadas);
        setSpinning(false);

        if (currentPlan.isWin) {
          const winSeq = WINNING_SEQUENCES[currentPlan.seqIndex];
          const isMega = winSeq.type === "SUPER MEGA GANHO";
          setGrid(winSeq.grid);
          setGanho(currentPlan.amount);
          setSaldo((s) => s + currentPlan.amount);
          setWinAmount(currentPlan.amount);
          setWinType(winSeq.type);
          setIsSuperMega(isMega);

          if (isMega) {
            playSuperMegaSound();
          } else {
            playCoinsSound();
          }
          setShowWinGlow(true);
          setWinCells(winSeq.winCells);
          setTigerCelebrating(true);
          setTimeout(() => setTigerCelebrating(false), isMega ? 1500 : 800);

          setTimeout(() => {
            setShowWinPopup(true);
            setShowCoins(true);
            setShowFlash(true);

            if (!isMega && currentPlan.amount >= 10000) {
              playBigWinSound();
            }

            setTimeout(() => setShowFlash(false), isMega ? 1500 : 500);

            if (autoPlayRef.current && newRodadas < 10) {
              setTimeout(() => {
                setShowWinPopup(false);
                setShowCoins(false);
                setShowWinGlow(false);
                setWinCells([]);
                setIsSuperMega(false);
              }, isMega ? 3000 : 1500);
            } else if (autoPlayRef.current && newRodadas >= 10) {
              autoPlayRef.current = false;
              setAutoPlay(false);
            }
          }, isMega ? 800 : 500);

          setTimeout(() => setShowCoins(false), isMega ? 8000 : 5000);
        } else {
          // Loss round - random grid, no win
          setGrid(generateGrid());
          setGanho(0);
          setWinCells([]);
          playLoseSound();

          // Auto-play: continue after brief pause
          if (autoPlayRef.current && newRodadas < 10) {
            // no popup needed
          } else if (autoPlayRef.current && newRodadas >= 10) {
            autoPlayRef.current = false;
            setAutoPlay(false);
          }
        }
      }
    }, tickMs);
  }, [spinning, rodadas, roundPlan, turbo]);

  // Auto-play: watch for popup dismiss to trigger next spin
  useEffect(() => {
    if (autoPlayRef.current && !spinning && !showWinPopup && rodadas > 0 && rodadas < 10) {
      const timer = setTimeout(() => {
        if (autoPlayRef.current) {
          spin();
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [showWinPopup, spinning, rodadas, spin]);

  const toggleAutoPlay = useCallback(() => {
    if (autoPlay) {
      autoPlayRef.current = false;
      setAutoPlay(false);
    } else {
      if (rodadas >= 10) return;
      autoPlayRef.current = true;
      setAutoPlay(true);
      if (!spinning) spin();
    }
  }, [autoPlay, rodadas, spinning, spin]);

  // Random coins & sparkles
  const coins = useMemo(() =>
  showCoins ?
  Array.from({ length: isSuperMega ? 60 : 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * (isSuperMega ? 2.5 : 1.5),
    left: Math.random() * 100,
    emoji: isSuperMega
      ? ["💰", "🪙", "💎", "🔥", "⭐", "👑"][Math.floor(Math.random() * 6)]
      : ["💰", "🪙", "✨", "💎", "🔥"][Math.floor(Math.random() * 5)]
  })) :
  [],
  [showCoins, isSuperMega]
  );

  const sparkles = useMemo(() =>
  showWinGlow ?
  Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: 20 + Math.random() * 60,
    y: 10 + Math.random() * 40,
    delay: Math.random() * 0.5,
    size: 4 + Math.random() * 8
  })) :
  [],
  [showWinGlow]
  );

  // Confetti for popup
  const confetti = useMemo(() =>
  showWinPopup ?
  Array.from({ length: 50 }, (_, i) => ({
    id: i,
    delay: Math.random() * 1.2,
    left: Math.random() * 100,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 5 + Math.random() * 8,
    duration: 2 + Math.random() * 2
  })) :
  [],
  [showWinPopup]
  );

  // Gold coins for popup
  const popupCoins = useMemo(() =>
  showWinPopup ?
  Array.from({ length: 15 }, (_, i) => ({
    id: i,
    delay: 0.2 + Math.random() * 1,
    left: 5 + Math.random() * 90
  })) :
  [],
  [showWinPopup]
  );

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden">
      {/* High-priority WebP game background */}
      <img
        src={gameBg}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        loading="eager"
        decoding="async"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover object-center"
      />

      {/* Background flash on big wins */}
      {showFlash &&
      <div
        className={`${isSuperMega ? "super-mega-flash" : "bg-flash"} pointer-events-none fixed inset-0 z-[80]`}
        style={{ background: isSuperMega
          ? "radial-gradient(circle, hsl(45 100% 70% / 0.7), hsl(30 100% 50% / 0.5), hsl(0 80% 50% / 0.3), transparent)"
          : "radial-gradient(circle, hsl(45 100% 70% / 0.5), hsl(0 80% 50% / 0.3), transparent)"
        }} />
      }

      {/* Sparkle particles */}
      {sparkles.map((s) =>
      <Sparkle key={s.id} x={s.x} y={s.y} delay={s.delay} size={s.size} />
      )}

      {/* Coin rain */}
      {coins.map((c) =>
      <FloatingCoin key={c.id} delay={c.delay} left={c.left} emoji={c.emoji} />
      )}

      {/* Top bar */}
      <div className="relative z-10 flex w-full items-center justify-between px-4 py-3">
        <div className="rounded-lg border border-primary/50 bg-secondary/90 px-3 py-1 text-xs font-bold text-secondary-foreground">
          RODADAS GRÁTIS
          <div className="text-center text-sm text-accent">{rodadas}/10</div>
        </div>
        <span className="font-extrabold tracking-widest text-primary drop-shadow-lg text-center text-xs">
          FORTUNE TIGER
        </span>
        <div className="rounded-lg border border-primary/50 bg-secondary/90 px-3 py-1 text-xs font-bold text-secondary-foreground">
          SALDO
          <div className="text-center text-sm text-primary">
            {saldo.toLocaleString("pt-AO")} Kz
          </div>
        </div>
      </div>


      {/* Tiger mascot */}
      <img
        src={fortuneTigerLogo}
        alt="Fortune Tiger"
        fetchPriority="high"
        loading="eager"
        decoding="async"
        className={`relative z-10 -mb-8 h-24 w-auto drop-shadow-2xl ${
        tigerCelebrating ? "tiger-celebrate" : ""}`
        } />


      {/* Slot machine */}
      <div
        className={`relative z-10 mx-0 rounded-2xl border-[6px] p-3 shadow-2xl transition-shadow sm:mx-1 sm:p-3 ${
        spinning ? "machine-active" : ""} ${
        showWinGlow ? "machine-active" : ""}`}
        style={{ 
          background: "linear-gradient(180deg, hsl(43 75% 75%), hsl(40 65% 60%), hsl(38 60% 50%))",
          borderColor: "hsl(43 80% 55%)",
          boxShadow: "inset 0 2px 6px hsl(45 100% 85% / 0.5), 0 4px 20px hsl(0 0% 0% / 0.5)"
        }}>

        <div className="relative grid grid-cols-3 gap-1.5 sm:gap-2">
          {grid.map((row, ri) =>
          row.map((symbol, ci) => {
            const isWinCell = winCells.some(([r, c]) => r === ri && c === ci);
            return (
              <div
                key={`${ri}-${ci}`}
                className={`relative flex h-[5.5rem] w-[5.5rem] items-center justify-center overflow-hidden rounded-xl border-[3px] shadow-inner transition-all sm:h-28 sm:w-28 ${
                spinning ? "slot-spinning" : ""} ${
                isWinCell && !spinning ? "win-glow" : ""}`}
                style={{ 
                  background: isWinCell && !spinning 
                    ? "linear-gradient(135deg, hsl(45 90% 92%), hsl(45 80% 85%))" 
                    : "linear-gradient(135deg, hsl(350 60% 25%), hsl(350 50% 18%))",
                  borderColor: isWinCell && !spinning ? "hsl(45 100% 55%)" : "hsl(43 70% 50%)",
                  boxShadow: isWinCell && !spinning 
                    ? "inset 0 0 12px hsl(45 100% 50% / 0.4), 0 0 8px hsl(45 100% 50% / 0.3)"
                    : "inset 0 2px 8px hsl(0 0% 0% / 0.3)"
                }}>

                  <img
                  src={symbol}
                  alt={SYMBOL_NAMES[symbol] || "Symbol"}
                  loading="eager"
                  decoding="async"
                  className={`h-full w-full object-cover transition-transform ${
                  isWinCell && !spinning ? "scale-110" : ""}`
                  } />

                  {/* Win line stripe across winning cell */}
                  {isWinCell && !spinning &&
                <div
                  className="pointer-events-none absolute inset-x-0 z-10"
                  style={{
                    top: "50%",
                    transform: "translateY(-50%)",
                    height: 4,
                    background: "linear-gradient(90deg, transparent, hsl(45 100% 55%), hsl(45 100% 65%), hsl(45 100% 55%), transparent)",
                    boxShadow: "0 0 8px hsl(45 100% 50% / 0.8), 0 0 16px hsl(45 100% 50% / 0.4)"
                  }} />

                }
                </div>);

          })
          )}
        </div>

        {/* Row numbers */}
        <div className="absolute -left-6 top-1/2 flex -translate-y-1/2 flex-col gap-8 text-xs font-bold text-primary">
          <span>1</span><span>2</span><span>3</span>
        </div>
        <div className="absolute -right-6 top-1/2 flex -translate-y-1/2 flex-col gap-8 text-xs font-bold text-primary">
          <span>6</span><span>2</span><span>4</span>
        </div>
      </div>

      {/* Marquee */}
      <div className="relative z-10 mt-1 w-[280px] overflow-hidden rounded-b-lg bg-secondary/90 px-2 py-1 sm:w-[370px]">
        <div className="animate-marquee whitespace-nowrap text-xs font-semibold text-primary">
          {MARQUEE_TEXTS.join("   ·   ")}
        </div>
      </div>

      {/* Stats bar */}
      <div className="relative z-10 mt-2 flex w-full max-w-[340px] sm:max-w-[400px] sm:mt-3">
        <div className="flex flex-1 flex-col items-center justify-center rounded-l-lg py-2"
          style={{ background: "linear-gradient(180deg, hsl(350 60% 22%), hsl(350 50% 15%))", borderRight: "1px solid hsl(43 70% 45% / 0.4)" }}>
          <div className="flex items-center gap-1">
            <span className="text-xs">💰</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary sm:text-[10px]">Saldo</span>
          </div>
          <div className="text-sm font-extrabold text-primary sm:text-base">{saldo.toLocaleString("pt-AO")} Kz</div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center py-2"
          style={{ background: "linear-gradient(180deg, hsl(350 60% 22%), hsl(350 50% 15%))", borderRight: "1px solid hsl(43 70% 45% / 0.4)" }}>
          <div className="flex items-center gap-1">
            <span className="text-xs">🎰</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary sm:text-[10px]">Aposta Grátis</span>
          </div>
          <div className="text-sm font-extrabold text-primary sm:text-base">{aposta.toLocaleString("pt-AO")} Kz</div>
        </div>
        <div className={`flex flex-1 flex-col items-center justify-center rounded-r-lg py-2 transition-all ${ganho > 0 ? "scale-105" : ""}`}
          style={{ background: "linear-gradient(180deg, hsl(350 60% 22%), hsl(350 50% 15%))" }}>
          <div className="flex items-center gap-1">
            <span className="text-xs">🏆</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary sm:text-[10px]">Ganho</span>
          </div>
          <div className="text-sm font-extrabold text-primary sm:text-base">{ganho.toLocaleString("pt-AO")} Kz</div>
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 mt-3 flex items-center gap-3 sm:mt-4 sm:gap-4">
        {/* TURBO */}
        <button
          onClick={() => setTurbo((t) => !t)}
          className="flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 transition-transform hover:scale-110 sm:h-14 sm:w-14"
          style={{
            borderColor: turbo ? "hsl(45 100% 55%)" : "hsl(25 90% 50%)",
            background: turbo
              ? "linear-gradient(180deg, hsl(45 95% 50%), hsl(30 95% 40%))"
              : "linear-gradient(180deg, hsl(25 85% 45%), hsl(25 90% 35%))"
          }}>
          <span className="text-lg">⚡</span>
          <span className="text-[7px] font-bold uppercase tracking-wide text-white/90 sm:text-[8px]">TURBO</span>
        </button>
        {/* Minus */}
        <button className="flex h-12 w-12 items-center justify-center rounded-full border-2 text-xl font-bold text-white transition-transform hover:scale-110 sm:h-14 sm:w-14 sm:text-2xl"
          style={{ borderColor: "hsl(0 0% 35%)", background: "linear-gradient(180deg, hsl(0 0% 25%), hsl(0 0% 15%))" }}>
          −
        </button>
        {/* JOGAR */}
        <button
          onClick={autoPlay ? toggleAutoPlay : spin}
          disabled={spinning && !autoPlay}
          className={`flex h-16 w-16 items-center justify-center rounded-full border-[3px] text-base font-extrabold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 sm:h-[72px] sm:w-[72px] sm:text-lg ${
          !spinning && rodadas < 10 ? "animate-pulse-glow" : ""}`}
          style={{ 
            borderColor: "hsl(43 80% 50%)", 
            background: "linear-gradient(180deg, hsl(145 60% 42%), hsl(145 65% 32%))",
            boxShadow: "0 0 12px hsl(145 60% 45% / 0.4), inset 0 1px 0 hsl(145 50% 60% / 0.3)"
          }}>
          {autoPlay ? "PARAR" : "JOGAR"}
        </button>
        {/* Plus */}
        <button className="flex h-12 w-12 items-center justify-center rounded-full border-2 text-xl font-bold text-white transition-transform hover:scale-110 sm:h-14 sm:w-14 sm:text-2xl"
          style={{ borderColor: "hsl(0 0% 35%)", background: "linear-gradient(180deg, hsl(0 0% 25%), hsl(0 0% 15%))" }}>
          +
        </button>
        {/* AUTO */}
        <button
          onClick={toggleAutoPlay}
          className="flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 transition-transform hover:scale-110 sm:h-14 sm:w-14"
          style={{ 
            borderColor: autoPlay ? "hsl(145 60% 45%)" : "hsl(210 80% 50%)", 
            background: autoPlay 
              ? "linear-gradient(180deg, hsl(145 60% 42%), hsl(145 65% 32%))" 
              : "linear-gradient(180deg, hsl(210 75% 45%), hsl(210 80% 35%))" 
          }}>
          <span className="text-lg">🔄</span>
          <span className="text-[7px] font-bold uppercase tracking-wide text-white/90 sm:text-[8px]">AUTO</span>
        </button>
      </div>

      {/* Full-screen mandatory withdrawal popup after 10 rounds */}
      {rodadas >= 10 && saldo > 0 && !showWinPopup && screen === "game" &&
      <div className="overlay-animate fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="card-animate mx-4 w-full max-w-sm rounded-2xl border-2 border-primary bg-card p-6 text-center shadow-2xl">
          <div className="mb-3 text-5xl">⚠️</div>
          <h2 className="mb-2 text-xl font-extrabold text-primary">Rodadas Esgotadas!</h2>
          <p className="mb-1 text-sm text-muted-foreground">Completaste as 10 rodadas gratuitas.</p>
          <p className="mb-4 text-sm text-muted-foreground">Levanta o teu saldo agora antes que expire.</p>
          <div className="mb-4 rounded-xl bg-primary/10 py-3">
            <span className="text-2xl font-extrabold text-primary">{saldo.toLocaleString("pt-AO")} Kz</span>
          </div>
          <button
            onClick={() => setScreen("levantamento")}
            className="animate-pulse-glow w-full rounded-xl bg-gradient-to-r from-primary to-amber-400 px-6 py-4 text-lg font-extrabold text-primary-foreground transition-transform hover:scale-105 active:scale-95">
            💰 LEVANTAR AGORA
          </button>
        </div>
      </div>
      }

      {/* Win Popup */}
      {showWinPopup &&
      <div
        className={`overlay-animate fixed inset-0 z-[90] flex items-center justify-center cursor-pointer backdrop-blur-sm ${isSuperMega ? "bg-black/60" : "bg-black/40"}`}
        onClick={() => {
          setShowWinPopup(false);
          setShowCoins(false);
          setShowWinGlow(false);
          setWinCells([]);
          setIsSuperMega(false);
          if (rodadas >= 10) {
            setTimeout(() => setScreen("finished"), 500);
          }
        }}>

          {/* Golden rays behind popup for SUPER MEGA */}
          {isSuperMega && (
            <div className="super-mega-rays pointer-events-none absolute" style={{
              width: 500, height: 500,
              background: "conic-gradient(from 0deg, transparent, hsl(45 100% 50% / 0.15), transparent, hsl(45 100% 50% / 0.15), transparent, hsl(45 100% 50% / 0.15), transparent, hsl(45 100% 50% / 0.15), transparent)",
              borderRadius: "50%"
            }} />
          )}

          {/* Firework particles for SUPER MEGA */}
          {isSuperMega && Array.from({ length: 20 }, (_, i) => {
            const angle = (i / 20) * Math.PI * 2;
            const dist = 80 + Math.random() * 120;
            return (
              <div key={`fw-${i}`} className="firework-particle pointer-events-none absolute rounded-full"
                style={{
                  width: 6 + Math.random() * 6,
                  height: 6 + Math.random() * 6,
                  background: ["hsl(45 100% 55%)", "hsl(30 100% 50%)", "hsl(0 80% 55%)", "hsl(50 100% 70%)"][i % 4],
                  "--fw-x": `${Math.cos(angle) * dist}px`,
                  "--fw-y": `${Math.sin(angle) * dist}px`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  boxShadow: "0 0 6px currentColor"
                } as React.CSSProperties} />
            );
          })}

          <div
          className={`relative rounded-xl px-10 py-6 text-center ${isSuperMega ? "super-mega-popup super-mega-glow" : "popup-explosion"}`}
          style={{
            background: isSuperMega
              ? "linear-gradient(180deg, hsl(40 80% 25%), hsl(30 90% 15%), hsl(0 70% 12%))"
              : "linear-gradient(180deg, hsl(0 70% 28%), hsl(0 80% 18%))",
            border: isSuperMega ? "4px solid hsl(45 100% 55%)" : "3px solid hsl(45 100% 50%)",
            boxShadow: isSuperMega
              ? "0 0 40px hsl(45 100% 50% / 0.6), 0 0 80px hsl(45 100% 50% / 0.3), 0 0 120px hsl(30 100% 50% / 0.2), inset 0 1px 0 hsl(45 100% 70% / 0.3)"
              : "0 0 30px hsl(45 100% 50% / 0.4), 0 0 60px hsl(0 80% 40% / 0.3), inset 0 1px 0 hsl(45 100% 70% / 0.2)",
            minWidth: isSuperMega ? 300 : 260
          }}>

            {/* Crown for super mega */}
            {isSuperMega && <p className="mb-1 text-4xl">👑</p>}

            {/* Win type */}
            <p className={`mb-1 font-extrabold tracking-wide ${isSuperMega ? "super-mega-text text-2xl" : "text-lg"}`} style={{ color: "hsl(45 100% 60%)" }}>
              {isSuperMega ? "🔥 SUPER MEGA GANHO 🔥" : `🪙 ${winType} 🪙`}
            </p>

            {/* Amount */}
            <p className={`mb-2 font-black ${isSuperMega ? "super-mega-text text-4xl" : "text-3xl"}`} style={{ color: "hsl(45 100% 65%)" }}>
              +{winAmount.toLocaleString("pt-AO")} Kz
            </p>

            {/* Tiger */}
            <p className={isSuperMega ? "text-5xl" : "text-3xl"}>🐯</p>

            {isSuperMega && <p className="mt-1 text-xs font-bold" style={{ color: "hsl(45 100% 50% / 0.8)" }}>TOQUE PARA CONTINUAR</p>}
          </div>
        </div>
      }

      {/* Finished Popup */}
      {screen === "finished" &&
      <div className="overlay-animate fixed inset-0 z-[95] flex items-center justify-center bg-black/70 px-4">
          <div className="card-animate w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
            <p className="mb-4 text-3xl">🐯</p>
            <h2 className="mb-2 text-xl font-extrabold text-foreground">
              As tuas jogadas bónus terminaram
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Os ganhos obtidos estão agora disponíveis para levantamento
            </p>
            <p className="mb-1 text-xs text-muted-foreground">Total ganho:</p>
            <p className="mb-6 text-3xl font-black text-accent">
              {saldo.toLocaleString("pt-AO")} Kz
            </p>
            <button
            onClick={() => setScreen("levantamento")}
            className="animate-pulse-glow w-full rounded-xl bg-gradient-to-r from-primary to-amber-400 px-6 py-4 text-lg font-extrabold text-primary-foreground transition-transform hover:scale-105 active:scale-95">

              💰 Sacar
            </button>
          </div>
        </div>
      }

      {/* Levantamento */}
      {screen === "levantamento" &&
      <div className="overlay-animate fixed inset-0 z-[95] flex items-center justify-center bg-black/70 px-4">
          <div className="card-animate w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
            <h2 className="mb-2 text-xl font-extrabold text-foreground">Levantamento</h2>
            <p className="mb-1 text-sm text-muted-foreground">Escolha o meio de recebimento</p>
            <p className="mb-1 text-2xl font-black text-accent">{saldo.toLocaleString("pt-AO")} Kz</p>
            <p className="mb-6 text-xs text-muted-foreground">Montante total disponível</p>

            <button
            onClick={() => setScreen("iban")}
            className="mb-3 flex w-full items-center gap-4 rounded-xl border border-border bg-muted/50 p-4 text-left transition-all hover:scale-[1.02] hover:bg-muted">

              <span className="text-2xl">🏦</span>
              <div>
                <p className="font-bold text-foreground">Registrar IBAN</p>
                <p className="text-xs text-muted-foreground">Transferência bancária directa</p>
              </div>
            </button>

            <button
            onClick={() => setScreen("multicaixa")}
            className="flex w-full items-center gap-4 rounded-xl border border-border bg-muted/50 p-4 text-left transition-all hover:scale-[1.02] hover:bg-muted">

              <span className="text-2xl">📱</span>
              <div>
                <p className="font-bold text-foreground">Registrar Multicaixa Express</p>
                <p className="text-xs text-muted-foreground">Receba no seu Express</p>
              </div>
            </button>
          </div>
        </div>
      }

      {/* IBAN form */}
      {screen === "iban" &&
      <div className="overlay-animate fixed inset-0 z-[95] flex items-center justify-center bg-black/70 px-4">
          <div className="card-animate w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
            <button
            onClick={() => setScreen("levantamento")}
            className="mb-4 text-sm text-muted-foreground hover:text-foreground">

              ← Voltar
            </button>
            <h2 className="mb-6 text-xl font-extrabold text-foreground">Registrar IBAN</h2>

            <label className="mb-2 block text-xs font-semibold text-muted-foreground">
              IBAN:
            </label>
            <input
            type="text"
            placeholder="AO06 0000 0000 0000 0000 0000 0"
            value={ibanNumber}
            onChange={(e) => {
              const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
              setIbanNumber(val);
            }}
            maxLength={23}
            className={`mb-1 w-full rounded-lg border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${ibanNumber && (!/^AO\d{21}$/.test(ibanNumber)) ? "border-red-500" : "border-border"}`} />
            {ibanNumber && !/^AO\d{21}$/.test(ibanNumber) && (
              <p className="mb-4 text-xs text-red-500">IBAN angolano inválido (AO + 21 dígitos)</p>
            )}
            {(!ibanNumber || /^AO\d{21}$/.test(ibanNumber)) && <div className="mb-5" />}

            <button
            disabled={!/^AO\d{21}$/.test(ibanNumber)}
            onClick={() => {
              if (/^AO\d{21}$/.test(ibanNumber)) {
                setScreen("verificando");
                setTimeout(() => setScreen("verificado"), 4000);
              }
            }}
            className="animate-pulse-glow w-full rounded-xl bg-gradient-to-r from-primary to-amber-400 px-6 py-4 text-lg font-extrabold text-primary-foreground transition-transform hover:scale-105 active:scale-95">

              Confirmar Levantamento
            </button>
          </div>
        </div>
      }


      {screen === "multicaixa" &&
      <div className="overlay-animate fixed inset-0 z-[95] flex items-center justify-center bg-black/70 px-4">
          <div className="card-animate w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
            <button
            onClick={() => setScreen("levantamento")}
            className="mb-4 text-sm text-muted-foreground hover:text-foreground">

              ← Voltar
            </button>
            <h2 className="mb-6 text-xl font-extrabold text-foreground">Multicaixa Express</h2>

            <label className="mb-2 block text-xs font-semibold text-muted-foreground">
              Número Express:
            </label>
            <input
            type="tel"
            placeholder="9XX XXX XXX"
            value={mcxNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setMcxNumber(val);
            }}
            maxLength={9}
            className={`mb-1 w-full rounded-lg border bg-input px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${mcxNumber && mcxNumber.length !== 9 ? "border-red-500" : "border-border"}`} />
            {mcxNumber && mcxNumber.length !== 9 && (
              <p className="mb-4 text-xs text-red-500">Número deve ter exactamente 9 dígitos</p>
            )}
            {(!mcxNumber || mcxNumber.length === 9) && <div className="mb-5" />}

            <button
            disabled={mcxNumber.length !== 9}
            onClick={() => {
              if (mcxNumber.length === 9) {
                setScreen("verificando");
                setTimeout(() => setScreen("verificado"), 4000);
              }
            }}
            className="animate-pulse-glow w-full rounded-xl bg-gradient-to-r from-primary to-amber-400 px-6 py-4 text-lg font-extrabold text-primary-foreground transition-transform hover:scale-105 active:scale-95">

              Confirmar Levantamento
            </button>
          </div>
        </div>
      }

      {/* Verificando dados - loading screen */}
      {screen === "verificando" &&
      <div className="loading-animate fixed inset-0 z-[99] flex flex-col items-center justify-center bg-background">
          <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-foreground" />
          <h2 className="mb-2 text-xl font-bold text-foreground">Verificando seus dados</h2>
          <p className="mb-6 text-sm text-muted-foreground">Por favor aguarde</p>
          <div className="h-1 w-64 overflow-hidden rounded-full bg-muted">
            <div className="h-full animate-progress rounded-full bg-foreground" />
          </div>
        </div>
      }

      {/* Dados verificados com sucesso */}
      {screen === "verificado" &&
      <div className="overlay-animate fixed inset-0 z-[95] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="card-animate w-full max-w-sm rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-[#1a1a2e] to-[#0d0d1a] p-8 text-center shadow-[0_0_40px_rgba(0,0,0,0.8)]">
            
            {/* Green checkmark icon */}
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
              <svg className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="mb-2 text-xl font-extrabold text-emerald-400">Dados verificados com sucesso</h2>
            <p className="mb-6 text-sm text-gray-400">Os seus dados foram validados</p>

            <p className="mb-2 text-xs text-gray-500">Total disponível para levantamento</p>
            <p className="mb-5 text-4xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">{saldo.toLocaleString("pt-AO")} Kz</p>

            <div className="mb-6 flex items-center justify-center gap-2 rounded-xl border border-gray-700/50 bg-[#111827] px-4 py-3 text-sm">
              <span className="text-lg">📱</span>
              <span className="text-gray-400">Express:</span>
              <span className="font-bold text-white tracking-wide">{mcxNumber}</span>
            </div>

            <button
              onClick={() => {
                trackFb("AddToCart", { content_name: "levantar_ganhos", value: saldo, currency: "AOA" });
                router.push(`/video?saldo=${saldo.toLocaleString("pt-AO")}`);
              }}
              className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-4 text-lg font-extrabold text-black shadow-[0_4px_20px_rgba(251,191,36,0.4)] transition-all hover:scale-[1.03] hover:shadow-[0_4px_30px_rgba(251,191,36,0.6)] active:scale-95"
            >
              💰 Levantar meus ganhos agora
            </button>
          </div>
        </div>
      }
    </div>);

};

export default Game;
