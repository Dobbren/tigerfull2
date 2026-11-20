"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trackFb } from "@/lib/fbq";
import { ASSETS, preloadGameAssets, preloadVideoAssets } from "@/lib/images";

// Copies para teste A/B do título (rodam aleatoriamente a cada visita)
const AB_TITLES = [
  "As tuas 10 rodadas grátis já estão à tua espera. Toca em Jogar Agora e começa já.",
  "Milhares de angolanos já estão a jogar. Resgata as tuas 10 rodadas grátis agora.",
  "Hoje é o teu dia de sorte: 10 rodadas grátis reservadas só para ti.",
  "Não fiques de fora. Ativa as tuas 10 rodadas grátis e joga sem gastar nada.",
  "O tigre da sorte escolheu-te: 10 rodadas grátis para começares a ganhar.",
  "Entra agora e recebe 10 rodadas grátis. Sem depósito para começar.",
];

const Welcome = () => {
  const router = useRouter();
  const [title, setTitle] = useState(AB_TITLES[0]);

  useEffect(() => {
    // Selecção aleatória da copy para teste A/B
    const index = Math.floor(Math.random() * AB_TITLES.length);
    setTitle(AB_TITLES[index]);

    // Prefetch das próximas rotas e pré-decodificação das imagens WebP em segundo plano
    router.prefetch("/bonus");
    router.prefetch("/game");
    router.prefetch("/video");
    preloadGameAssets();
    preloadVideoAssets();
  }, [router]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-3 py-4 sm:px-4 sm:py-8">
      {/* Background com blur carregado com alta prioridade */}
      <img
        src={ASSETS.templeBg}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        loading="eager"
        decoding="async"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full scale-110 object-cover object-center blur-md"
      />
      {/* Overlay escuro para contraste */}
      <div className="absolute inset-0 z-0 bg-black/50" aria-hidden="true" />

      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center gap-4 rounded-2xl border border-primary/40 bg-black/60 px-5 py-6 text-center backdrop-blur-sm">
        <img
          src={ASSETS.logo}
          alt="Fortune Tiger"
          width={220}
          height={110}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="h-auto w-44 object-contain drop-shadow-lg sm:w-52"
        />
        <img
          src={ASSETS.tiger}
          alt=""
          aria-hidden="true"
          width={160}
          height={160}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="h-32 w-32 object-contain drop-shadow-[0_0_24px_rgba(251,191,36,0.55)] sm:h-40 sm:w-40"
        />
        <h1
          className="text-balance text-2xl font-extrabold uppercase leading-tight text-primary sm:text-3xl"
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}
        >
          Bem-vindo ao Fortune Tiger
        </h1>
        <p className="text-pretty text-base font-medium leading-relaxed text-white/90">
          {title}
        </p>
      </div>

      <button
        onClick={() => {
          trackFb("Lead", { content_name: "intro_cta" });
          router.push("/bonus");
        }}
        className="animate-pulse-glow relative z-10 mt-4 w-full max-w-[340px] rounded-xl bg-gradient-to-r from-primary to-amber-400 px-5 py-3 text-base font-extrabold text-primary-foreground transition-transform hover:scale-105 active:scale-95 sm:mt-6 sm:max-w-[400px] sm:px-6 sm:py-4 sm:text-lg"
      >
        🐅 Jogar Agora
      </button>
    </div>
  );
};

export default Welcome;
