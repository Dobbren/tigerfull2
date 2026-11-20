"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Gift, Check } from "lucide-react";
import { trackFb } from "@/lib/fbq";
import { ASSETS, preloadGameAssets } from "@/lib/images";

const perks = ["Sem depósito inicial", "Prémios reais em Kwanzas", "Activação imediata"];

const Bonus = () => {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/game");
    preloadGameAssets();
  }, [router]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-8">
      {/* Fundo do templo desfocado */}
      <img
        src={ASSETS.templeBg}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        loading="eager"
        decoding="async"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full scale-110 object-cover object-center blur-md"
      />
      <div className="absolute inset-0 z-0 bg-black/65" aria-hidden="true" />

      <div className="card-animate relative z-10 flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-border bg-card/90 px-6 py-8 text-center backdrop-blur-sm sm:px-8">
        <img
          src={ASSETS.logo}
          alt="Fortune Tiger"
          width={200}
          height={100}
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="h-20 w-auto drop-shadow-2xl"
        />

        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent">Parabéns</p>
          <h1 className="text-balance text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">
            Bem-vindo ao Fortune Tiger
          </h1>
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            A sua conta foi selecionada para uma oferta exclusiva
          </p>
        </div>

        {/* Elemento assinatura: o bónus */}
        <div className="glow-pulse flex w-full flex-col items-center gap-1 rounded-xl border border-primary/40 bg-background/60 px-6 py-6">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <Gift className="h-4 w-4" aria-hidden="true" />
            Bónus de Boas-Vindas
          </span>
          <p className="text-6xl font-black leading-none text-primary sm:text-7xl">10</p>
          <p className="text-lg font-bold uppercase tracking-wide text-foreground">Jogadas</p>
        </div>

        <ul className="flex w-full flex-col gap-2.5">
          {perks.map((perk) => (
            <li key={perk} className="flex items-center gap-2.5 text-left text-sm text-muted-foreground">
              <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              {perk}
            </li>
          ))}
        </ul>

        <button
          onClick={() => {
            trackFb("CompleteRegistration", { content_name: "bonus_claim" });
            router.push("/game");
          }}
          className="animate-pulse-glow w-full rounded-xl bg-gradient-to-r from-primary to-amber-400 px-6 py-4 text-lg font-extrabold text-primary-foreground transition-transform hover:scale-[1.03] active:scale-95"
        >
          Resgatar e Jogar
        </button>
      </div>
    </main>
  );
};

export default Bonus;
