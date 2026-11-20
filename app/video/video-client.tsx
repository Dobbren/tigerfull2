"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Player from "./player";
import { ASSETS, optImg, preloadVideoAssets } from "@/lib/images";

const WHATSAPP_NUMBER = "244923000000";
const PRODUCT_NAME = "Fortune Tiger Angola";
const PAGE_NAME = "Virgínia Fonseca · Fortune Tiger";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    smartplayer?: {
      instances?: Array<{
        video?: { currentTime?: number };
      }>;
    };
  }
}

function trackFb(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event, params);
  }
}

export type ReactionType = "Gosto" | "Adoro" | "Força" | "Uau";

export interface ScriptedThreadReply {
  delaySec: number;
  name: string;
  avatar?: string;
  text: string;
  image?: string;
  likes: number;
  isModerator?: boolean;
}

export interface ScriptedComment {
  id: number;
  timestamp: number;
  name: string;
  avatar: string;
  text: string;
  likes: number;
  thread?: ScriptedThreadReply[];
}

export interface LiveReply {
  uid: string;
  name: string;
  avatar?: string;
  text: string;
  image?: string;
  likes: number;
  likedByMe?: boolean;
  timeLabel: string;
  isModerator?: boolean;
  isLead?: boolean;
  whatsappUrl?: string;
}

export interface LiveComment {
  uid: string;
  name: string;
  avatar?: string;
  text: string;
  image?: string;
  likes: number;
  likedByMe?: boolean;
  timeLabel: string;
  isModerator?: boolean;
  isLead?: boolean;
  whatsappUrl?: string;
  replies: LiveReply[];
  typingAuthor?: {
    name: string;
    avatar?: string;
    isModerator?: boolean;
  } | null;
}

interface FloatingReaction {
  id: number;
  type: ReactionType;
  rightOffset: number;
  swayClass: string;
}

const RECEIPT_POOL = [
  { img: ASSETS.comprovativos.comp1, amount: "119.300,00 Kz" },
  { img: ASSETS.comprovativos.comp2, amount: "107.820,00 Kz" },
  { img: ASSETS.comprovativos.comp3, amount: "103.078,64 Kz" },
  { img: ASSETS.comprovativos.comp4, amount: "140.000,00 Kz" },
  { img: ASSETS.comprovativos.comp5, amount: "148.000,00 Kz" },
  { img: ASSETS.comprovativos.comp6, amount: "200.000,00 Kz" },
  { img: ASSETS.comprovativos.comp7, amount: "183.200,00 Kz" },
  { img: ASSETS.comprovativos.comp8, amount: "281.250,00 Kz" },
];

// Inline fallback for synchronized comments + nested verification conversations
const FALLBACK_COMMENTS: ScriptedComment[] = [
  {
    id: 1,
    timestamp: 2,
    name: "Luísa Capitango",
    avatar: ASSETS.commenters.f1,
    text: "Boa noite gente! Cheguei agora na transmissão em direto da Virgínia 🙌🇦🇴",
    likes: 14,
  },
  {
    id: 2,
    timestamp: 12,
    name: "Carlos Mateus",
    avatar: ASSETS.commenters.h3,
    text: "Já fiz a minha verificação agora mesmo como a Virgínia explicou no vídeo, estou a aguardar a transferência!",
    likes: 31,
    thread: [
      {
        delaySec: 7,
        isModerator: true,
        name: `Assistente ${PRODUCT_NAME}`,
        text: "@Carlos Mateus Verificação confirmada no sistema! A tua transferência IBAN de 119.300,00 Kz acabou de ser realizada com sucesso. Aqui está o teu comprovativo oficial, o dinheiro já está na tua conta! ✅👇",
        image: ASSETS.comprovativos.comp1,
        likes: 24,
      },
      {
        delaySec: 7,
        name: "Carlos Mateus",
        avatar: ASSETS.commenters.h3,
        text: "Gente!! Já recebi o comprovativo e o dinheiro já está na minha conta! 119.300,00 Kz certinhos no meu banco, funciona mesmo!! 🙌🔥",
        likes: 38,
      },
      {
        delaySec: 8,
        name: "Domingos Neto",
        avatar: "/images/avatars/domingos-neto.jpg",
        text: "@Carlos Mateus Irmão, demorou muito tempo depois que concluíste a verificação para o dinheiro cair?",
        likes: 12,
      },
      {
        delaySec: 7,
        name: "Carlos Mateus",
        avatar: ASSETS.commenters.h3,
        text: "@Domingos Neto Nada mano, foi menos de 2 minutos! Assim que terminei a verificação o Assistente mandou o comprovativo e o banco notificou logo.",
        likes: 29,
      },
    ],
  },
  {
    id: 3,
    timestamp: 28,
    name: "Ana Paula",
    avatar: ASSETS.commenters.f2,
    text: "A assistir em direto desde Luanda! Vou terminar de ver o passo a passo para fazer a minha verificação também 🔥",
    likes: 19,
  },
  {
    id: 4,
    timestamp: 44,
    name: "Júlio Tavares",
    avatar: ASSETS.commenters.h4,
    text: "Acabei de concluir! Já fiz a minha verificação com o meu IBAN, podem confirmar por favor?",
    likes: 27,
    thread: [
      {
        delaySec: 7,
        isModerator: true,
        name: `Assistente ${PRODUCT_NAME}`,
        text: "@Júlio Tavares Tudo validado, Júlio! A transferência de 107.820,00 Kz já foi processada para o teu IBAN sem qualquer custo. Segue abaixo o comprovativo da operação, o valor já está na conta! 🇦🇴✅",
        image: ASSETS.comprovativos.comp2,
        likes: 21,
      },
      {
        delaySec: 7,
        name: "Júlio Tavares",
        avatar: ASSETS.commenters.h4,
        text: "Confirmado!! Vi o comprovativo aqui e já caiu os 107.820,00 Kz na minha conta bancária! Muito obrigado equipa 👏💰",
        likes: 33,
      },
      {
        delaySec: 8,
        name: "Teresa Chimuco",
        avatar: "/images/avatars/teresa-chimuco.jpg",
        text: "@Júlio Tavares O teu IBAN é do BAI ou do BFA? Caiu o valor todo sem descontar nada?",
        likes: 15,
      },
      {
        delaySec: 7,
        name: "Júlio Tavares",
        avatar: ASSETS.commenters.h4,
        text: "@Teresa Chimuco O meu é do BFA! Caiu os 107.820,00 Kz completos, custo totalmente isento como mostra aí na foto do comprovativo.",
        likes: 26,
      },
    ],
  },
  {
    id: 5,
    timestamp: 62,
    name: "Beatriz Sousa",
    avatar: ASSETS.commenters.f4,
    text: "Onde é que aparece o botão para concluir a verificação do saldo? Ainda estou a acompanhar o vídeo.",
    likes: 28,
    thread: [
      {
        delaySec: 7,
        isModerator: true,
        name: `Assistente ${PRODUCT_NAME}`,
        text: "@Beatriz Sousa O botão oficial aparece automaticamente aqui no vídeo assim que a explicação do passo a passo terminar. Continua a assistir sem fechar a página! 👇",
        likes: 19,
      },
    ],
  },
  {
    id: 6,
    timestamp: 80,
    name: "Helena Sebastião",
    avatar: ASSETS.commenters.f3,
    text: "Já fiz a minha verificação completa agora mesmo! Podem enviar o meu comprovativo?",
    likes: 35,
    thread: [
      {
        delaySec: 7,
        isModerator: true,
        name: `Assistente ${PRODUCT_NAME}`,
        text: "@Helena Sebastião Foi imediato, Helena! A tua verificação libertou o pagamento automático de 103.078,64 Kz via transferência IBAN. Confere o teu comprovativo abaixo, o dinheiro já entrou na conta! ✅👇",
        image: ASSETS.comprovativos.comp3,
        likes: 27,
      },
      {
        delaySec: 7,
        name: "Helena Sebastião",
        avatar: ASSETS.commenters.f3,
        text: "Meu Deus é verdade!! Já recebi o comprovativo e o dinheiro já está na conta, 103.078,64 Kz disponíveis no meu Multicaixa Express! 😭❤️",
        likes: 42,
      },
      {
        delaySec: 8,
        name: "Marisa Lukamba",
        avatar: "/images/avatars/marisa-lukamba.jpg",
        text: "@Helena Sebastião Mana, eu estava com medo porque já tentei outras coisas na internet que não pagavam… esse caiu mesmo de verdade?",
        likes: 18,
      },
      {
        delaySec: 7,
        name: "Helena Sebastião",
        avatar: ASSETS.commenters.f3,
        text: "@Marisa Lukamba Eu também tinha receio mana! Mas fiz a verificação certinha e o saldo já está aqui no meu Express, podes fazer sem medo.",
        likes: 34,
      },
    ],
  },
  {
    id: 7,
    timestamp: 102,
    name: "Luísa Capitango",
    avatar: ASSETS.commenters.f1,
    text: "Meninas e rapazes, já fiz a minha verificação passo a passo! A aguardar a minha transferência 🙏",
    likes: 41,
    thread: [
      {
        delaySec: 7,
        isModerator: true,
        name: `Assistente ${PRODUCT_NAME}`,
        text: "@Luísa Capitango Parabéns Luísa! A tua verificação foi aprovada e a transferência IBAN de 140.000,00 Kz já foi concluída com sucesso. Aqui está o comprovativo, o dinheiro já está na tua conta! 🎉✅",
        image: ASSETS.comprovativos.comp4,
        likes: 31,
      },
      {
        delaySec: 7,
        name: "Luísa Capitango",
        avatar: ASSETS.commenters.f1,
        text: "Acabei de abrir o Express!! O comprovativo bateu certo e os 140.000,00 Kz já estão na minha conta! Deus abençoe Virgínia 🎉🇦🇴",
        likes: 49,
      },
      {
        delaySec: 8,
        name: "António Bastos",
        avatar: "/images/avatars/antonio-bastos.jpg",
        text: "@Luísa Capitango Depois que fizeste a verificação pediram mais alguma taxa ou liberou logo os 140.000 Kz?",
        likes: 16,
      },
      {
        delaySec: 7,
        name: "Luísa Capitango",
        avatar: ASSETS.commenters.f1,
        text: "@António Bastos Não pedem mais nada! É só concluir a verificação única explicada no vídeo e o valor cai direto na conta.",
        likes: 37,
      },
    ],
  },
  {
    id: 8,
    timestamp: 126,
    name: "Manuel Fernando",
    avatar: ASSETS.commenters.h1,
    text: "Já fiz a minha verificação agora mesmo pelo vídeo, já está tudo confirmado do meu lado!",
    likes: 39,
    thread: [
      {
        delaySec: 7,
        isModerator: true,
        name: `Assistente ${PRODUCT_NAME}`,
        text: "@Manuel Fernando Verificação concluída com sucesso, Manuel! Acabámos de emitir a tua transferência IBAN no valor de 148.000,00 Kz. Segue o teu comprovativo oficial abaixo, o dinheiro já está na conta! 💸✅",
        image: ASSETS.comprovativos.comp5,
        likes: 28,
      },
      {
        delaySec: 7,
        name: "Manuel Fernando",
        avatar: ASSETS.commenters.h1,
        text: "Estou sem palavras! Já recebi o comprovativo e o dinheiro já está na conta, 148.000,00 Kz recebidos na hora! 🤯👏",
        likes: 45,
      },
      {
        delaySec: 8,
        name: "Silvano Dala",
        avatar: "/images/avatars/silvano-dala.jpg",
        text: "@Manuel Fernando Estás em Luanda ou noutra província? Aqui no Huambo será que cai rápido também?",
        likes: 14,
      },
      {
        delaySec: 7,
        name: "Manuel Fernando",
        avatar: ASSETS.commenters.h1,
        text: "@Silvano Dala Estou em Benguela irmão! Como é transferência bancária por IBAN e Multicaixa Express, cai na mesma hora em qualquer província.",
        likes: 30,
      },
    ],
  },
  {
    id: 9,
    timestamp: 152,
    name: "Paulo Kassoma",
    avatar: "/images/avatars/paulo-kassoma.jpg",
    text: "Já fiz a minha verificação e ativei o levantamento do meu saldo, podem verificar?",
    likes: 46,
    thread: [
      {
        delaySec: 7,
        isModerator: true,
        name: `Assistente ${PRODUCT_NAME}`,
        text: "@Paulo Kassoma Verificado no sistema, Paulo! A tua transferência IBAN de 200.000,00 Kz foi realizada com sucesso e isenta de custos. Aqui tens o comprovativo, o dinheiro já está na tua conta! 🔥✅",
        image: ASSETS.comprovativos.comp6,
        likes: 35,
      },
      {
        delaySec: 7,
        name: "Paulo Kassoma",
        avatar: "/images/avatars/paulo-kassoma.jpg",
        text: "Bateu na conta agora mesmo!! 200.000,00 Kz confirmados com o comprovativo, pessoal façam a verificação que cai na hora!! 🚀🇦🇴",
        likes: 53,
      },
      {
        delaySec: 8,
        name: "Nuno Quiala",
        avatar: "/images/avatars/nuno-quiala.jpg",
        text: "@Paulo Kassoma Os 200.000 Kz entraram de uma só vez ou dividiram em partes?",
        likes: 17,
      },
      {
        delaySec: 7,
        name: "Paulo Kassoma",
        avatar: "/images/avatars/paulo-kassoma.jpg",
        text: "@Nuno Quiala Entrou tudo de uma só vez irmão! Abre a foto do comprovativo aí em cima para veres, 200.000,00 Kz limpos.",
        likes: 39,
      },
    ],
  },
  {
    id: 10,
    timestamp: 178,
    name: "Cláudia Muhongo",
    avatar: "/images/avatars/claudia-muhongo.jpg",
    text: "Já fiz a minha verificação certinha sem pular nada! A aguardar a confirmação da equipa 🙏",
    likes: 52,
    thread: [
      {
        delaySec: 7,
        isModerator: true,
        name: `Assistente ${PRODUCT_NAME}`,
        text: "@Cláudia Muhongo Tudo certo com a tua verificação, Cláudia! A transferência IBAN de 183.200,00 Kz já foi efetuada para a tua conta. Confere abaixo o comprovativo bancário, o saldo já está disponível! ✅👇",
        image: ASSETS.comprovativos.comp7,
        likes: 36,
      },
      {
        delaySec: 7,
        name: "Cláudia Muhongo",
        avatar: "/images/avatars/claudia-muhongo.jpg",
        text: "Já recebi o comprovativo e o dinheiro já está na minha conta!! 183.200,00 Kz certinhos, muito obrigada mesmo! 😍🙏",
        likes: 48,
      },
      {
        delaySec: 8,
        name: "Yola Cambinda",
        avatar: "/images/avatars/yola-cambinda.jpg",
        text: "@Cláudia Muhongo Amiga, fizeste tudo pelo telemóvel mesmo? É fácil fazer a verificação?",
        likes: 19,
      },
      {
        delaySec: 7,
        name: "Cláudia Muhongo",
        avatar: "/images/avatars/claudia-muhongo.jpg",
        text: "@Yola Cambinda Sim amiga, fiz tudo pelo telemóvel em 1 minutinho! Assim que clicares no botão do vídeo é super rápido.",
        likes: 41,
      },
    ],
  },
  {
    id: 11,
    timestamp: 205,
    name: "Benedito António Pedro",
    avatar: "/images/avatars/benedito-antonio-pedro.jpg",
    text: "Já fiz a minha verificação agora mesmo com o meu IBAN, tudo preenchido e confirmado!",
    likes: 63,
    thread: [
      {
        delaySec: 7,
        isModerator: true,
        name: `Assistente ${PRODUCT_NAME}`,
        text: "@Benedito António Pedro Excelente, Benedito! Verificação validada e transferência IBAN de 281.250,00 Kz realizada com sucesso em teu nome. Aqui está o teu comprovativo, o valor já se encontra disponível na tua conta! 🏆✅",
        image: ASSETS.comprovativos.comp8,
        likes: 44,
      },
      {
        delaySec: 7,
        name: "Benedito António Pedro",
        avatar: "/images/avatars/benedito-antonio-pedro.jpg",
        text: "Comprovativo recebido com o meu nome completo certinho e os 281.250,00 Kz já estão na minha conta!! Quem ainda não fez a verificação, faça agora mesmo! 🔥🙌",
        likes: 67,
      },
      {
        delaySec: 8,
        name: "Edson Miguel",
        avatar: ASSETS.commenters.h2,
        text: "@Benedito António Pedro Grande Benedito! Vi que até o teu nome completo apareceu aí no comprovativo oficial do banco, transparência total!",
        likes: 28,
      },
      {
        delaySec: 7,
        name: "Benedito António Pedro",
        avatar: "/images/avatars/benedito-antonio-pedro.jpg",
        text: "@Edson Miguel Verdade irmão, transferência direta para o meu IBAN em meu nome, caiu na hora sem complicação!",
        likes: 52,
      },
    ],
  },
];

function resolveAvatarUrl(name: string, rawAvatar?: string): string {
  if (rawAvatar && rawAvatar.startsWith("/_next/image")) return rawAvatar;
  if (rawAvatar && rawAvatar.startsWith("/assets/")) {
    return optImg(rawAvatar, 96, 75);
  }
  const slug = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return rawAvatar || `/images/avatars/${slug}.jpg`;
}

function resolveReceiptUrl(rawImg?: string): string | undefined {
  if (!rawImg) return undefined;
  if (rawImg.startsWith("/_next/image")) return rawImg;
  if (rawImg.startsWith("/assets/")) return optImg(rawImg, 384, 80);
  return rawImg;
}

const AVATAR_COLORS = [
  "#1877F2",
  "#E41E3F",
  "#2ABBA7",
  "#F5533D",
  "#8B5CF6",
  "#0D9488",
  "#D97706",
  "#DB2777",
  "#4F46E5",
  "#16A34A",
];

function getDeterministicColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "FT";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Highlight @Mentions in Facebook blue inside comment & reply text
function renderTextWithMentions(text: string) {
  const match = text.match(/^(@[A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+){0,2})\s+(.*)$/);
  if (!match) return text;
  return (
    <>
      <span className="font-semibold text-[#1877F2]">{match[1]}</span>{" "}
      {match[2]}
    </>
  );
}

// === OFFICIAL FACEBOOK SVG REACTION EMBLEMS ===
export function FbLikeBadge({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="fbLikeGrad" x1="18" y1="0" x2="18" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#378FE9" />
          <stop offset="100%" stopColor="#1877F2" />
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="18" fill="url(#fbLikeGrad)" />
      <path
        d="M12.2 16.2H9.5c-.66 0-1.2.54-1.2 1.2v8.4c0 .66.54 1.2 1.2 1.2h2.7c.66 0 1.2-.54 1.2-1.2v-8.4c0-.66-.54-1.2-1.2-1.2zm14.35-.15h-4.92c.46-1.57.82-3.44.82-4.65 0-1.92-1.22-3.1-2.55-3.1-.92 0-1.58.56-1.85 1.38l-.52 1.66c-.45 1.44-1.48 2.86-2.53 3.74-.32.27-.5.66-.5 1.08v8.49c0 .78.63 1.42 1.42 1.42h7.76c1.05 0 1.96-.72 2.18-1.75l1.34-5.78c.32-1.38-.73-2.49-2.15-2.49z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function FbLoveBadge({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="fbLoveGrad" x1="18" y1="0" x2="18" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF5A79" />
          <stop offset="100%" stopColor="#E41E3F" />
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="18" fill="url(#fbLoveGrad)" />
      <path
        d="M23.1 10.2c-2.12 0-3.92 1.22-5.1 2.98-1.18-1.76-2.98-2.98-5.1-2.98-3.42 0-6.1 2.75-6.1 6.24 0 5.36 9.35 10.66 10.65 11.38.34.19.76.19 1.1 0 1.3-.72 10.65-6.02 10.65-11.38 0-3.49-2.68-6.24-6.1-6.24z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function FbCareBadge({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="fbCareGrad" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFE169" />
          <stop offset="100%" stopColor="#F7B125" />
        </radialGradient>
      </defs>
      <circle cx="18" cy="18" r="18" fill="url(#fbCareGrad)" />
      <ellipse cx="12.5" cy="13.5" rx="1.7" ry="2.1" fill="#3B230A" />
      <ellipse cx="23.5" cy="13.5" rx="1.7" ry="2.1" fill="#3B230A" />
      <path d="M15.2 17.5c1.1.9 4.5.9 5.6 0" stroke="#3B230A" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M22.2 18.8c-1.35 0-2.48.78-3.2 1.88-.72-1.1-1.85-1.88-3.2-1.88-2.15 0-3.85 1.72-3.85 3.92 0 3.35 5.88 6.68 6.7 7.14.22.12.48.12.7 0 .82-.46 6.7-3.79 6.7-7.14 0-2.2-1.7-3.92-3.85-3.92z"
        fill="#E41E3F"
      />
      <path
        d="M7.5 21.5c1.8 2.2 4.8 3.2 7.5 2.5M28.5 21.5c-1.8 2.2-4.8 3.2-7.5 2.5"
        stroke="#D98A00"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FbWowBadge({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="fbWowGrad" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFE169" />
          <stop offset="100%" stopColor="#F7B125" />
        </radialGradient>
      </defs>
      <circle cx="18" cy="18" r="18" fill="url(#fbWowGrad)" />
      <path d="M10.2 10.2c1.2-1.1 3-1.1 4.2 0M21.6 10.2c1.2-1.1 3-1.1 4.2 0" stroke="#3B230A" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="12.3" cy="14.5" rx="2.1" ry="2.6" fill="#3B230A" />
      <ellipse cx="23.7" cy="14.5" rx="2.1" ry="2.6" fill="#3B230A" />
      <ellipse cx="18" cy="24.2" rx="3.8" ry="5.1" fill="#3B230A" />
    </svg>
  );
}

export function ReactionEmblem({ type, size = 24 }: { type: ReactionType; size?: number }) {
  switch (type) {
    case "Gosto":
      return <FbLikeBadge size={size} />;
    case "Adoro":
      return <FbLoveBadge size={size} />;
    case "Força":
      return <FbCareBadge size={size} />;
    case "Uau":
      return <FbWowBadge size={size} />;
  }
}

const VerifiedBadgeSvg = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="inline-block shrink-0" aria-label="Verificado">
    <path
      d="M12 2L14.39 4.39L17.71 3.77L18.33 7.09L20.72 9.5L19.33 12.6L20.72 15.7L18.33 18.11L17.71 21.43L14.39 20.81L12 23.2L9.61 20.81L6.29 21.43L5.67 18.11L3.28 15.7L4.67 12.6L3.28 9.5L5.67 7.09L6.29 3.77L9.61 4.39L12 2Z"
      fill="#1877F2"
    />
    <path d="M10.4 15.6L6.8 12L8.2 10.6L10.4 12.8L15.8 7.4L17.2 8.8L10.4 15.6Z" fill="#FFFFFF" />
  </svg>
);

const GlobeSvg = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="#65676B" className="inline-block shrink-0" aria-hidden="true">
    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm4.9 4.5h-2.1a11.3 11.3 0 00-.9-2.7A5.53 5.53 0 0112.9 5.5zM8 2.5c.6.8 1.1 1.9 1.4 3H6.6c.3-1.1.8-2.2 1.4-3zM2.7 9.5a5.4 5.4 0 010-3h2.4c-.1.5-.1 1-.1 1.5s0 1 .1 1.5H2.7zm.4 1h2.1c.2 1 .5 1.9.9 2.7a5.53 5.53 0 01-3-2.7zm2.1-5H3.1a5.53 5.53 0 013-2.7c-.4.8-.7 1.7-.9 2.7zM8 13.5c-.6-.8-1.1-1.9-1.4-3h2.8c-.3 1.1-.8 2.2-1.4 3zm1.6-4H6.4c-.1-.5-.1-1-.1-1.5s0-1 .1-1.5h3.2c.1.5.1 1 .1 1.5s0 1-.1 1.5zm.3 3.7c.4-.8.7-1.7.9-2.7h2.1a5.53 5.53 0 01-3 2.7zm1-3.7c.1-.5.1-1 .1-1.5s0-1-.1-1.5h2.4a5.4 5.4 0 010 3h-2.4z" />
  </svg>
);

function CommentAvatar({
  name,
  avatar,
  isModerator,
  size = 36,
}: {
  name: string;
  avatar?: string;
  isModerator?: boolean;
  size?: number;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const resolvedSrc = isModerator ? ASSETS.virginia : resolveAvatarUrl(name, avatar);
  const bgColor = getDeterministicColor(name);
  const initials = getInitials(name);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {!imgFailed && resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={name}
          width={size}
          height={size}
          loading="eager"
          decoding="async"
          onError={() => setImgFailed(true)}
          className="h-full w-full rounded-full border border-black/10 object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full font-bold text-white select-none"
          style={{
            backgroundColor: bgColor,
            fontSize: Math.max(10, Math.floor(size * 0.38)),
          }}
          aria-hidden="true"
        >
          {initials}
        </div>
      )}
      {isModerator && (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#31A24C]"
          title="Online"
        />
      )}
    </div>
  );
}

export default function Video() {
  const searchParams = useSearchParams();
  const saldo = searchParams.get("saldo") || "115.000";
  const isReprise = searchParams.get("mode") === "reprise";

  // Detect lead's name from previous funnel storage or URL without showing any popup
  const [leadName, setLeadName] = useState("Visitante");
  useEffect(() => {
    try {
      const fromUrl = searchParams.get("name") || searchParams.get("nome");
      if (fromUrl && fromUrl.trim()) {
        setLeadName(fromUrl.trim());
        return;
      }
      const keys = ["name", "userName", "lead_name", "leadName", "user_name", "store"];
      for (const k of keys) {
        const raw = window.localStorage.getItem(k) || window.sessionStorage.getItem(k);
        if (!raw) continue;
        if (raw.startsWith("{")) {
          const parsed = JSON.parse(raw);
          if (typeof parsed?.name === "string" && parsed.name.trim()) {
            setLeadName(parsed.name.trim());
            return;
          }
        } else if (raw.trim().length > 1 && raw.trim().length < 50) {
          setLeadName(raw.trim());
          return;
        }
      }
    } catch {
      /* ignore storage errors */
    }
  }, [searchParams]);

  const firstName = leadName.split(/\s+/)[0] || "Visitante";

  // Meta Pixel ViewContent + preload avatars & receipts
  useEffect(() => {
    trackFb("ViewContent", { content_name: "VSL Tinge da Sorte" });
    preloadVideoAssets();
  }, []);

  // Audience counter: starts at 1584, oscillates every 2.8s strictly between 1500 and 1700 (-10 to +12)
  const [watching, setWatching] = useState(1584);
  useEffect(() => {
    const interval = setInterval(() => {
      setWatching((prev) => {
        const delta = randomBetween(-10, 12);
        const next = prev + delta;
        return Math.min(1700, Math.max(1500, next));
      });
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Stats counters: 1.248 reactions, 386 comments, 94 shares
  const [reactionCount, setReactionCount] = useState(1248);
  const [commentCount, setCommentCount] = useState(386);
  const [shareCount, setShareCount] = useState(94);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [trayOpen, setTrayOpen] = useState(false);
  const [shareFeedback, setShareFeedback] = useState("");
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<{ parentUid: string; name: string } | null>(null);

  // Floating reactions on bottom-right of the video
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const floatingIdRef = useRef(1);

  const spawnFloatingReaction = useCallback((type?: ReactionType) => {
    const pool: ReactionType[] = ["Gosto", "Adoro", "Força"];
    const chosen = type || pool[Math.floor(Math.random() * pool.length)];
    const id = floatingIdRef.current++;
    const rightOffset = randomBetween(10, 46);
    const swayClass = id % 2 === 0 ? "fb-float-sway-left" : "fb-float-sway-right";

    setFloatingReactions((prev) => [...prev.slice(-14), { id, type: chosen, rightOffset, swayClass }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((item) => item.id !== id));
    }, 2200);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      spawnFloatingReaction();
      if (Math.random() > 0.55) {
        setTimeout(() => spawnFloatingReaction(), 350);
      }
      setReactionCount((c) => c + 1);
    }, 2400);
    return () => clearInterval(interval);
  }, [spawnFloatingReaction]);

  // Load comments.json (with immediate fallback to FALLBACK_COMMENTS)
  const [scriptedComments, setScriptedComments] = useState<ScriptedComment[]>(FALLBACK_COMMENTS);
  useEffect(() => {
    fetch("/comments.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setScriptedComments(data);
        }
      })
      .catch(() => {});
  }, []);

  // Live chat state (starts with first comment visible on entry)
  const [chatList, setChatList] = useState<LiveComment[]>(() => [
    {
      uid: `sc-1`,
      name: FALLBACK_COMMENTS[0].name,
      avatar: FALLBACK_COMMENTS[0].avatar,
      text: FALLBACK_COMMENTS[0].text,
      likes: FALLBACK_COMMENTS[0].likes,
      timeLabel: "Agora mesmo",
      replies: [],
      typingAuthor: null,
    },
  ]);
  const releasedIdsRef = useRef<Set<number>>(new Set([1]));
  const activeTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    return () => {
      activeTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  // Helper to append a nested reply inside a specific parent comment (with typing indicator inside that comment!)
  const scheduleNestedReply = useCallback(
    (
      parentUid: string,
      reply: {
        name: string;
        avatar?: string;
        text: string;
        image?: string;
        likes?: number;
        isModerator?: boolean;
        whatsappUrl?: string;
      },
      readDelayMs: number,
      typeDelayMs: number,
      onComplete?: () => void
    ) => {
      const t1 = setTimeout(() => {
        // Show typing indicator INSIDE the parent comment thread
        setChatList((prev) =>
          prev.map((c) =>
            c.uid === parentUid
              ? {
                  ...c,
                  typingAuthor: {
                    name: reply.name,
                    avatar: reply.avatar,
                    isModerator: reply.isModerator,
                  },
                }
              : c
          )
        );

        const t2 = setTimeout(() => {
          setChatList((prev) =>
            prev.map((c) =>
              c.uid === parentUid
                ? {
                    ...c,
                    typingAuthor: null,
                    replies: [
                      ...c.replies,
                      {
                        uid: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                        name: reply.name,
                        avatar: reply.avatar,
                        text: reply.text,
                        image: resolveReceiptUrl(reply.image),
                        likes: reply.likes ?? randomBetween(6, 24),
                        timeLabel: "Agora mesmo",
                        isModerator: reply.isModerator,
                        whatsappUrl: reply.whatsappUrl,
                      },
                    ],
                  }
                : c
            )
          );
          setCommentCount((cnt) => cnt + 1);
          onComplete?.();
        }, typeDelayMs);
        activeTimersRef.current.push(t2);
      }, readDelayMs);
      activeTimersRef.current.push(t1);
    },
    []
  );

  // Run a sequential sub-thread of replies inside a parent comment one after another
  const runCommentThread = useCallback(
    (parentUid: string, thread: ScriptedThreadReply[], stepIndex = 0) => {
      if (stepIndex >= thread.length) return;
      const step = thread[stepIndex];
      const totalWaitMs = Math.max(4500, step.delaySec * 1000);
      const typeMs = step.isModerator ? 3400 : 2400;
      const readMs = Math.max(2000, totalWaitMs - typeMs);

      scheduleNestedReply(
        parentUid,
        {
          name: step.name,
          avatar: step.avatar,
          text: step.text,
          image: step.image,
          likes: step.likes,
          isModerator: step.isModerator,
        },
        readMs,
        typeMs,
        () => {
          runCommentThread(parentUid, thread, stepIndex + 1);
        }
      );
    },
    [scheduleNestedReply]
  );

  // Initial natural greeting from the Moderator after ~9s on the Live page (as a reply to the first comment or pinned moderator welcome)
  const greetedRef = useRef(false);
  const [topTyping, setTopTyping] = useState(false);
  useEffect(() => {
    if (greetedRef.current) return;
    const t1 = setTimeout(() => {
      greetedRef.current = true;
      setTopTyping(true);
      const t2 = setTimeout(() => {
        setTopTyping(false);
        setChatList((prev) => [
          {
            uid: `mod-welcome`,
            name: `Assistente ${PRODUCT_NAME}`,
            avatar: ASSETS.virginia,
            text: `Bem-vindo(a) à transmissão em direto, @${firstName}! 🇦🇴 O teu saldo de ${saldo} Kz já está pré-aprovado no sistema. Assiste ao vídeo até ao fim e comenta aqui assim que fizeres a tua verificação para enviarmos o teu comprovativo!`,
            likes: 19,
            timeLabel: "Agora mesmo",
            isModerator: true,
            replies: [],
            typingAuthor: null,
          },
          ...prev,
        ]);
        setCommentCount((c) => c + 1);
      }, 3400);
      activeTimersRef.current.push(t2);
    }, 6500);
    activeTimersRef.current.push(t1);
  }, [firstName, saldo]);

  // Synchronize comments with VTurb SmartPlayer currentTime (with calm elapsed fallback)
  const fallbackSecondsRef = useRef(2);
  useEffect(() => {
    const syncTimer = setInterval(() => {
      fallbackSecondsRef.current += 1;
      let currentSec = fallbackSecondsRef.current;

      try {
        const vturbTime = window.smartplayer?.instances?.[0]?.video?.currentTime;
        if (typeof vturbTime === "number" && vturbTime > 0) {
          currentSec = Math.max(currentSec, Math.floor(vturbTime));
        } else {
          const domVideo = document.querySelector("video");
          if (domVideo && domVideo.currentTime > 0) {
            currentSec = Math.max(currentSec, Math.floor(domVideo.currentTime));
          }
        }
      } catch {
        /* use fallback timer */
      }

      scriptedComments.forEach((item) => {
        if (item.timestamp <= currentSec && !releasedIdsRef.current.has(item.id)) {
          releasedIdsRef.current.add(item.id);
          const parentUid = `sc-${item.id}`;
          setChatList((prev) => [
            {
              uid: parentUid,
              name: item.name,
              avatar: item.avatar,
              text: item.text,
              likes: item.likes,
              timeLabel: "Agora mesmo",
              replies: [],
              typingAuthor: null,
            },
            ...prev,
          ]);
          setCommentCount((c) => c + 1);

          // Start the nested reply conversation inside this comment
          if (item.thread && item.thread.length > 0) {
            runCommentThread(parentUid, item.thread, 0);
          }
        }
      });
    }, 1000);

    return () => clearInterval(syncTimer);
  }, [scriptedComments, runCommentThread]);

  // === LEAD INTERACTION & CONTEXTUAL REPLY ENGINE (Replies Nested Inside Comment) ===
  const [commentInput, setCommentInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const leadInteractionCountRef = useRef(0);
  const leadReceiptIndexRef = useRef(0);

  const generateContextualReply = (
    rawMessage: string,
    userFirstName: string
  ): { text: string; image?: string } => {
    const norm = normalizeText(rawMessage);

    // 0. If the commenter explicitly says they already completed their verification ("já fiz a minha verificação") -> reply with receipt photo!
    if (
      /(ja fiz|acabei de fazer|fiz a minha|conclui|terminei).*(verificac|ativac|confirmac)/.test(norm) ||
      /(ja verifiquei|verificacao feita|ja ativei)/.test(norm)
    ) {
      const receipt = RECEIPT_POOL[leadReceiptIndexRef.current % RECEIPT_POOL.length];
      leadReceiptIndexRef.current += 1;
      return {
        text: `@${userFirstName} Verificação confirmada no sistema! A tua transferência IBAN foi realizada com sucesso. Aqui está o teu comprovativo oficial, o dinheiro já está disponível na tua conta! ✅👇`,
        image: receipt.img,
      };
    }

    // 1. Preço / Valor / Taxa
    if (/(preco|valor|taxa|quanto|custo|pagar|pagamento|desconto|gratis)/.test(norm)) {
      return {
        text: `@${userFirstName} O teu saldo de ${saldo} Kz foi ganho nas rodadas grátis! No final do vídeo a Virgínia mostra como concluir a tua verificação para transferires tudo agora mesmo. 💰`,
      };
    }
    // 2. Funcionamento / Saque / Botão
    if (/(funciona|saque|sacar|levantar|levantamento|botao|link|onde|como|receber|demora|verificac)/.test(norm)) {
      return {
        text: `@${userFirstName} A liberação do levantamento é 100% automática! Assim que concluíres a verificação explicada no vídeo e comentares aqui "Já fiz a minha verificação", enviamos o teu comprovativo na hora. 👇`,
      };
    }
    // 3. Segurança / Garantia / Confiança
    if (/(seguro|seguranca|garantia|confianca|verdade|real|burla|confiavel|medo|certeza)/.test(norm)) {
      return {
        text: `@${userFirstName} Podes ficar totalmente tranquilo(a)! A nossa plataforma possui verificação oficial e proteção bancária encriptada para todas as transferências em Angola. 🔒✅`,
      };
    }
    // 4. Pagamento / Método Local
    if (/(multicaixa|express|iban|bai|bfa|bic|sol|atlantico|banco|kwanza|kz|conta)/.test(norm)) {
      return {
        text: `@${userFirstName} Confirmamos suporte imediato para Multicaixa Express e IBAN de todos os bancos angolanos (BAI, BFA, BIC, Sol e Atlântico), com envio do comprovativo na hora! 🇦🇴`,
      };
    }
    // 5. Outras mensagens
    const fallbackReplies = [
      `@${userFirstName} Que alegria ter-te connosco em direto! Assim que concluíres a tua verificação no vídeo, avisa aqui no chat para libertarmos o teu comprovativo de ${saldo} Kz. 🙌✨`,
      `@${userFirstName} Isso mesmo! Segue atentamente cada detalhe que a Virgínia está a mostrar no vídeo e faz a tua verificação para receberes na tua conta sem demora. 🔥🇦🇴`,
      `@${userFirstName} Excelente participação! O teu saldo já está reservado, fica até ao fim da explicação e comenta quando fizeres a verificação. 👏❤️`,
    ];
    return {
      text: fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)],
    };
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentInput.trim();
    if (!trimmed) return;

    setCommentInput("");
    leadInteractionCountRef.current += 1;
    const currentInteraction = leadInteractionCountRef.current;
    const displayAuthor = leadName === "Visitante" ? "Você" : leadName;

    let targetParentUid = replyTarget?.parentUid;
    setReplyTarget(null);

    if (targetParentUid) {
      // User is replying inside an existing comment thread!
      setChatList((prev) =>
        prev.map((c) =>
          c.uid === targetParentUid
            ? {
                ...c,
                replies: [
                  ...c.replies,
                  {
                    uid: `lead-rep-${Date.now()}`,
                    name: displayAuthor,
                    text: trimmed,
                    likes: 1,
                    timeLabel: "Agora mesmo",
                    isLead: true,
                  },
                ],
              }
            : c
        )
      );
    } else {
      // User posted a new main comment; Moderator will reply INSIDE the user's comment!
      targetParentUid = `lead-${Date.now()}`;
      const newUid = targetParentUid;
      setChatList((prev) => [
        {
          uid: newUid,
          name: displayAuthor,
          text: trimmed,
          likes: 1,
          timeLabel: "Agora mesmo",
          isLead: true,
          replies: [],
          typingAuthor: null,
        },
        ...prev,
      ]);
    }
    setCommentCount((c) => c + 1);

    // Moderator replies INSIDE the same comment thread (after human reading + typing delay)
    const reply = generateContextualReply(trimmed, firstName);
    const parentForBot = targetParentUid;

    scheduleNestedReply(
      parentForBot,
      {
        name: `Assistente ${PRODUCT_NAME}`,
        avatar: ASSETS.virginia,
        text: reply.text,
        image: reply.image,
        isModerator: true,
      },
      randomBetween(4200, 5400),
      randomBetween(3200, 4200),
      () => {
        // 2nd Interaction Trigger: Human Support WhatsApp CTA nested inside the same thread
        if (currentInteraction === 2) {
          const waText = encodeURIComponent(
            `Olá! O meu nome é ${leadName} e estou na Live do ${PRODUCT_NAME}. Quero ajuda para concluir a verificação e o levantamento do meu saldo de ${saldo} Kz!`
          );
          const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`;
          scheduleNestedReply(
            parentForBot,
            {
              name: `Assistente ${PRODUCT_NAME}`,
              avatar: ASSETS.virginia,
              text: `@${firstName} Vi que tens mais dúvidas sobre o teu levantamento de ${saldo} Kz! Se preferires atendimento individual prioritário, clica no botão abaixo para falar diretamente com o nosso Suporte Oficial no WhatsApp:`,
              isModerator: true,
              whatsappUrl: waUrl,
            },
            4500,
            3400
          );
        }
      }
    );
  };

  // Reaction button handlers
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectReaction = (type: ReactionType) => {
    if (!userReaction) {
      setReactionCount((c) => c + 1);
    }
    setUserReaction(type);
    setTrayOpen(false);
    spawnFloatingReaction(type);
  };

  const handleMainLikeClick = () => {
    if (trayOpen) {
      setTrayOpen(false);
      return;
    }
    if (!userReaction) {
      selectReaction("Gosto");
    } else {
      setTrayOpen(true);
    }
  };

  const handleShare = async () => {
    setShareCount((s) => s + 1);
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: `${PAGE_NAME} - Em Direto`,
          url: shareUrl,
        });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback("Ligação copiada!");
        setTimeout(() => setShareFeedback(""), 2500);
      }
    } catch {
      /* user cancelled share dialog */
    }
  };

  const toggleCommentLike = (uid: string, parentUid?: string) => {
    setChatList((prev) =>
      prev.map((c) => {
        if (!parentUid && c.uid === uid) {
          return {
            ...c,
            likedByMe: !c.likedByMe,
            likes: c.likedByMe ? c.likes - 1 : c.likes + 1,
          };
        }
        if (parentUid && c.uid === parentUid) {
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.uid === uid
                ? {
                    ...r,
                    likedByMe: !r.likedByMe,
                    likes: r.likedByMe ? r.likes - 1 : r.likes + 1,
                  }
                : r
            ),
          };
        }
        return c;
      })
    );
  };

  const startReplyTo = (parentUid: string, authorName: string) => {
    const first = authorName.split(" ")[0];
    setReplyTarget({ parentUid, name: authorName });
    setCommentInput(`@${first} `);
    inputRef.current?.focus();
  };

  const reactionButtonColor: Record<ReactionType, string> = {
    Gosto: "#1877F2",
    Adoro: "#E41E3F",
    Força: "#F7B125",
    Uau: "#F7B125",
  };

  return (
    <div className="min-h-screen w-full bg-[#F0F2F5] pb-24 font-sans text-[#050505] antialiased selection:bg-[#1877F2]/20">
      <style>{`
        @keyframes fbFloatUp {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.6);
          }
          18% {
            opacity: 1;
            transform: translateY(-14px) scale(1.05);
          }
          100% {
            opacity: 0;
            transform: translateY(-150px) scale(0.85);
          }
        }
        .fb-float-sway-left {
          animation: fbFloatUp 2.1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .fb-float-sway-right {
          animation: fbFloatUp 2.1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes fbWaveDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes fbReplyFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fb-reply-enter {
          animation: fbReplyFadeIn 0.28s ease-out forwards;
        }
      `}</style>

      {/* Lightbox Modal when user clicks a receipt photo in the chat */}
      {previewReceipt && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewReceipt(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
        >
          <div className="relative max-h-[90vh] max-w-[380px] overflow-hidden rounded-2xl bg-white p-2 shadow-2xl">
            <button
              type="button"
              onClick={() => setPreviewReceipt(null)}
              aria-label="Fechar comprovativo"
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
            >
              ✕
            </button>
            <img
              src={previewReceipt}
              alt="Comprovativo de Transferência IBAN"
              className="max-h-[84vh] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}

      {/* 1. TOPBAR FACEBOOK (Sticky White) */}
      <header className="sticky top-0 z-40 border-b border-[#DADDE1] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex h-13 max-w-[520px] items-center justify-between px-3.5">
          <div className="flex items-center gap-2.5">
            <a
              href="#top"
              onClick={(e) => e.preventDefault()}
              className="text-[27px] font-extrabold tracking-[-1.4px] text-[#1877F2] select-none"
              style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
            >
              facebook
            </a>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F3FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#1877F2]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#31A24C]" />
              <span className="max-w-[110px] truncate">{firstName}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Pesquisar no Facebook"
              onClick={() => inputRef.current?.focus()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E4E6EB] text-[#050505] transition-colors hover:bg-[#D8DADF] active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="20" y1="20" x2="16.2" y2="16.2" />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Menu"
              onClick={() => inputRef.current?.focus()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E4E6EB] text-[#050505] transition-colors hover:bg-[#D8DADF] active:scale-95"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6h16v2.2H4V6zm0 4.9h16v2.2H4v-2.2zm0 4.9h16V18H4v-2.2z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN FACEBOOK LIVE MOBILE CARD */}
      <main className="mx-auto w-full max-w-[520px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.1)] sm:my-3 sm:rounded-xl sm:border sm:border-[#DADDE1]">
        {/* 2. CABEÇALHO DO POST (Autoridade) */}
        <div className="flex items-start justify-between px-3.5 pt-3 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="relative shrink-0">
              <div
                className="h-11 w-11 rounded-full p-[2px]"
                style={{ border: "2px solid #E41E3F" }}
              >
                <img
                  src={ASSETS.virginia}
                  alt={PAGE_NAME}
                  width={40}
                  height={40}
                  fetchPriority="high"
                  loading="eager"
                  decoding="async"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-[#E41E3F] px-1 py-[1px] text-[8px] font-extrabold uppercase leading-none tracking-wider text-white shadow">
                LIVE
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1 leading-snug">
                <span className="text-[15px] font-bold text-[#050505]">{PAGE_NAME}</span>
                <VerifiedBadgeSvg size={15} />
                <span className="text-[13px] font-normal text-[#65676B]">está em direto</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[12px] text-[#65676B]">
                <span>Agora mesmo</span>
                <span>·</span>
                <GlobeSvg />
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-label="Mais opções da publicação"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#65676B] hover:bg-[#F0F2F5]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>
        </div>

        {/* Post Caption / Copy */}
        <div className="px-3.5 pb-2.5 text-[14px] leading-[1.38] text-[#050505]">
          <p className="font-semibold">
            🔴 COMO RECEBER O SEU DINHEIRO AGORA — Passo a passo em direto!
          </p>
          <p className="mt-1 text-[13px] text-[#050505]">
            Saldo disponível para levantamento imediato:{" "}
            <span className="rounded bg-[#E7F3FF] px-1.5 py-0.5 font-extrabold text-[#1877F2]">
              {saldo} Kz
            </span>
            . Assiste até ao fim para ativar o envio na tua conta Multicaixa Express ou IBAN.
          </p>
        </div>

        {/* 3. PLAYER DE VÍDEO (Vturb SmartPlayer) + BADGES SOBREPOSTOS */}
        <div className="relative w-full bg-black overflow-hidden">
          <div className="relative bg-black text-white [&_.record]:hidden">
            <Player />
          </div>

          <div className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 rounded-[4px] bg-[#E41E3F] px-2 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-80" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              <span>{isReprise ? "REPRISE" : "EM DIRETO"}</span>
            </div>

            <div
              className="flex items-center gap-1.5 rounded-[4px] bg-black/65 px-2 py-1 text-[11px] font-semibold text-white shadow-sm"
              style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{watching.toLocaleString("pt-PT")}</span>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-3 right-2 z-20 h-40 w-20 overflow-visible">
            {floatingReactions.map((item) => (
              <div
                key={item.id}
                className={`absolute bottom-0 ${item.swayClass}`}
                style={{ right: `${item.rightOffset}px` }}
              >
                <ReactionEmblem type={item.type} size={28} />
              </div>
            ))}
          </div>
        </div>

        {/* 4. BARRA DE ESTATÍSTICAS E BARRA DE AÇÕES OFICIAL (3 BOTÕES) */}
        <div className="flex items-center justify-between border-b border-[#CED0D4] mx-3.5 py-2.5 text-[13px] text-[#65676B]">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center -space-x-1">
              <span className="relative z-30 inline-flex rounded-full ring-2 ring-white">
                <FbLikeBadge size={18} />
              </span>
              <span className="relative z-20 inline-flex rounded-full ring-2 ring-white">
                <FbLoveBadge size={18} />
              </span>
              <span className="relative z-10 inline-flex rounded-full ring-2 ring-white">
                <FbCareBadge size={18} />
              </span>
            </div>
            <span className="font-normal text-[#65676B]">
              {reactionCount.toLocaleString("pt-PT")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span>{commentCount.toLocaleString("pt-PT")} comentários</span>
            <span>·</span>
            <span>{shareCount.toLocaleString("pt-PT")} partilhas</span>
          </div>
        </div>

        {/* Barra de Ações Oficial com os 3 botões reais do Facebook (pt-PT) */}
        <div className="relative mx-2 flex items-center justify-between border-b border-[#CED0D4] py-1">
          {trayOpen && (
            <div
              role="toolbar"
              aria-label="Escolher reação"
              onMouseLeave={() => setTrayOpen(false)}
              className="fb-reaction-tray absolute -top-13 left-2 z-30 flex items-center gap-2.5 rounded-full border border-[#DADDE1] bg-white px-3 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.18)]"
            >
              {(["Gosto", "Adoro", "Força", "Uau"] as ReactionType[]).map((rType) => (
                <button
                  key={rType}
                  type="button"
                  aria-label={rType}
                  onClick={() => selectReaction(rType)}
                  className="group relative flex flex-col items-center transition-transform duration-150 hover:-translate-y-1 hover:scale-125 active:scale-95"
                >
                  <ReactionEmblem type={rType} size={34} />
                  <span className="pointer-events-none absolute -top-6 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {rType}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 1. Botão Gosto */}
          <button
            type="button"
            onClick={handleMainLikeClick}
            onPointerDown={() => {
              holdTimerRef.current = setTimeout(() => setTrayOpen(true), 420);
            }}
            onPointerUp={() => {
              if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
            }}
            onPointerLeave={() => {
              if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-[13px] font-semibold transition-colors hover:bg-[#F2F3F5] active:bg-[#E4E6EB]"
            style={{
              color: userReaction ? reactionButtonColor[userReaction] : "#65676B",
            }}
          >
            {userReaction ? (
              <ReactionEmblem type={userReaction} size={19} />
            ) : (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
            )}
            <span>{userReaction || "Gosto"}</span>
          </button>

          {/* 2. Botão Comentar */}
          <button
            type="button"
            onClick={() => {
              inputRef.current?.focus();
              inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-[13px] font-semibold text-[#65676B] transition-colors hover:bg-[#F2F3F5] active:bg-[#E4E6EB]"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span>Comentar</span>
          </button>

          {/* 3. Botão Partilhar */}
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-[13px] font-semibold text-[#65676B] transition-colors hover:bg-[#F2F3F5] active:bg-[#E4E6EB]"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l6 6-6 6" />
              <path d="M21 11H11a8 8 0 0 0-8 8v1" />
            </svg>
            <span>{shareFeedback || "Partilhar"}</span>
          </button>
        </div>

        {/* 5. SEÇÃO DE CHAT EM DIRETO COM RESPOSTAS ANINHADAS DENTRO DO COMENTÁRIO PRINCIPAL */}
        <section className="px-3.5 pt-3 pb-6" aria-label="Comentários em direto">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#65676B]">
              <span>Chat em direto</span>
              <span>·</span>
              <span className="text-[12px] font-normal">Comentários mais relevantes</span>
            </div>
          </div>

          {topTyping && (
            <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-[#F0F2F5] px-3 py-2 text-[12px] text-[#65676B]">
              <CommentAvatar name={`Assistente ${PRODUCT_NAME}`} isModerator size={28} />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-[#050505]">
                  Assistente {PRODUCT_NAME}
                </span>
                <span>está a escrever</span>
                <span className="inline-flex items-center gap-0.5 pl-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#65676B]" style={{ animation: "fbWaveDot 1.2s infinite 0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#65676B]" style={{ animation: "fbWaveDot 1.2s infinite 200ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#65676B]" style={{ animation: "fbWaveDot 1.2s infinite 400ms" }} />
                </span>
              </div>
            </div>
          )}

          {/* Lista de Comentários Principais + Respostas Aninhadas (Threads) */}
          <div className="space-y-4">
            {chatList.map((msg) => (
              <div key={msg.uid} className="fb-reply-enter flex items-start gap-2.5">
                <CommentAvatar
                  name={msg.name}
                  avatar={msg.avatar}
                  isModerator={msg.isModerator}
                  size={36}
                />

                <div className="min-w-0 flex-1">
                  {/* Bolha do Comentário Principal */}
                  <div
                    className={`relative inline-block max-w-full rounded-2xl px-3.5 py-2 ${
                      msg.isModerator
                        ? "border border-[#1877F2]/25 bg-[#E7F3FF]"
                        : "bg-[#F0F2F5]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[13px] font-bold leading-tight text-[#050505]">
                        {msg.name}
                      </span>
                      {msg.isModerator && (
                        <>
                          <VerifiedBadgeSvg size={13} />
                          <span className="rounded bg-[#1877F2] px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wider text-white">
                            MODERADOR
                          </span>
                        </>
                      )}
                      {msg.isLead && (
                        <span className="rounded bg-[#31A24C] px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-wider text-white">
                          VOCÊ
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-[14px] leading-[1.36] text-[#050505] break-words">
                      {renderTextWithMentions(msg.text)}
                    </p>
                  </div>

                  {/* Ações do Comentário Principal */}
                  <div className="mt-1 flex items-center justify-between pl-3 pr-1 text-[12px] text-[#65676B]">
                    <div className="flex items-center gap-3.5">
                      <span>{msg.timeLabel}</span>
                      <button
                        type="button"
                        onClick={() => toggleCommentLike(msg.uid)}
                        className={`font-bold hover:underline ${
                          msg.likedByMe ? "text-[#1877F2]" : "text-[#65676B]"
                        }`}
                      >
                        Gosto
                      </button>
                      <button
                        type="button"
                        onClick={() => startReplyTo(msg.uid, msg.name)}
                        className="font-bold text-[#65676B] hover:underline"
                      >
                        Responder
                      </button>
                    </div>

                    {msg.likes > 0 && (
                      <div className="flex items-center gap-1 rounded-full bg-white px-1.5 py-0.5 shadow-[0_1px_3px_rgba(0,0,0,0.16)]">
                        <FbLikeBadge size={14} />
                        <span className="text-[11px] font-medium text-[#65676B]">
                          {msg.likes}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* === RESPOSTAS ANINHADAS DENTRO DO COMENTÁRIO PRINCIPAL === */}
                  {(msg.replies.length > 0 || msg.typingAuthor) && (
                    <div className="relative mt-2.5 ml-1.5 space-y-2.5 border-l-2 border-[#CED0D4] pl-3">
                      {msg.replies.map((rep) => (
                        <div key={rep.uid} className="fb-reply-enter relative flex items-start gap-2">
                          {/* Curva estilo Facebook conectando a linha vertical à resposta */}
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute -left-[14px] top-3.5 h-2.5 w-3 rounded-bl-lg border-b-2 border-l-2 border-[#CED0D4]"
                          />

                          <CommentAvatar
                            name={rep.name}
                            avatar={rep.avatar}
                            isModerator={rep.isModerator}
                            size={28}
                          />

                          <div className="min-w-0 flex-1">
                            <div
                              className={`relative inline-block max-w-full rounded-2xl px-3 py-2 ${
                                rep.isModerator
                                  ? "border border-[#1877F2]/30 bg-[#E7F3FF]"
                                  : "bg-[#F0F2F5]"
                              }`}
                            >
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="text-[12.5px] font-bold leading-tight text-[#050505]">
                                  {rep.name}
                                </span>
                                {rep.isModerator && (
                                  <>
                                    <VerifiedBadgeSvg size={12} />
                                    <span className="rounded bg-[#1877F2] px-1.5 py-[1px] text-[8.5px] font-bold uppercase tracking-wider text-white">
                                      MODERADOR
                                    </span>
                                  </>
                                )}
                                {rep.isLead && (
                                  <span className="rounded bg-[#31A24C] px-1.5 py-[1px] text-[8.5px] font-bold uppercase tracking-wider text-white">
                                    VOCÊ
                                  </span>
                                )}
                              </div>

                              <p className="mt-0.5 text-[13.5px] leading-[1.35] text-[#050505] break-words">
                                {renderTextWithMentions(rep.text)}
                              </p>

                              {/* Foto do Comprovativo dentro da resposta do Moderador */}
                              {rep.image && (
                                <div className="mt-2">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewReceipt(rep.image!)}
                                    className="group relative block overflow-hidden rounded-xl border border-[#CED0D4] bg-white shadow-xs transition-transform active:scale-[0.99]"
                                  >
                                    <img
                                      src={rep.image}
                                      alt="Comprovativo de Transferência IBAN"
                                      width={220}
                                      height={390}
                                      loading="eager"
                                      decoding="async"
                                      className="max-h-[280px] w-auto max-w-[215px] object-contain"
                                    />
                                    <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
                                      🔍 Tocar para ampliar
                                    </span>
                                  </button>
                                </div>
                              )}

                              {/* Botão WhatsApp dentro da resposta do Moderador */}
                              {rep.whatsappUrl && (
                                <a
                                  href={rep.whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-1.5 text-[12.5px] font-bold text-white shadow-sm transition-transform hover:brightness-95 active:scale-95"
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.01c-.24.68-1.41 1.3-1.95 1.38-.5.08-1.13.11-1.83-.11-.42-.13-.97-.31-1.67-.61-2.94-1.27-4.86-4.25-5.01-4.45-.15-.2-1.2-1.59-1.2-3.04 0-1.45.76-2.16 1.03-2.45.27-.29.59-.36.79-.36.2 0 .4.01.57.01.18 0 .43-.07.67.51.24.59.83 2.03.9 2.18.07.15.12.32.02.52-.1.2-.15.32-.29.49-.15.17-.31.38-.44.51-.15.15-.3.31-.13.61.17.29.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.35 1.46.29.15.46.12.63-.07.17-.2.73-.85.93-1.15.2-.29.39-.24.66-.15.27.1 1.71.81 2 .95.29.15.49.22.56.34.07.12.07.71-.17 1.39z" />
                                  </svg>
                                  <span>Falar com Suporte no WhatsApp</span>
                                </a>
                              )}
                            </div>

                            {/* Ações da Resposta Aninhada */}
                            <div className="mt-0.5 flex items-center justify-between pl-2.5 pr-1 text-[11.5px] text-[#65676B]">
                              <div className="flex items-center gap-3">
                                <span>{rep.timeLabel}</span>
                                <button
                                  type="button"
                                  onClick={() => toggleCommentLike(rep.uid, msg.uid)}
                                  className={`font-bold hover:underline ${
                                    rep.likedByMe ? "text-[#1877F2]" : "text-[#65676B]"
                                  }`}
                                >
                                  Gosto
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startReplyTo(msg.uid, rep.name)}
                                  className="font-bold text-[#65676B] hover:underline"
                                >
                                  Responder
                                </button>
                              </div>

                              {rep.likes > 0 && (
                                <div className="flex items-center gap-1 rounded-full bg-white px-1.5 py-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.14)]">
                                  <FbLikeBadge size={12} />
                                  <span className="text-[10.5px] font-medium text-[#65676B]">
                                    {rep.likes}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Indicador "está a responder..." DENTRO do comentário principal */}
                      {msg.typingAuthor && (
                        <div className="fb-reply-enter relative flex items-center gap-2 pt-0.5">
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute -left-[14px] top-3 h-2.5 w-3 rounded-bl-lg border-b-2 border-l-2 border-[#CED0D4]"
                          />
                          <CommentAvatar
                            name={msg.typingAuthor.name}
                            avatar={msg.typingAuthor.avatar}
                            isModerator={msg.typingAuthor.isModerator}
                            size={24}
                          />
                          <div className="inline-flex items-center gap-1.5 rounded-2xl bg-[#F0F2F5] px-3 py-1.5 text-[11.5px] text-[#65676B]">
                            <span className="font-semibold text-[#050505]">
                              {msg.typingAuthor.name}
                            </span>
                            <span>está a responder</span>
                            <span className="inline-flex items-center gap-0.5 pl-0.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#65676B]" style={{ animation: "fbWaveDot 1.2s infinite 0ms" }} />
                              <span className="h-1.5 w-1.5 rounded-full bg-[#65676B]" style={{ animation: "fbWaveDot 1.2s infinite 200ms" }} />
                              <span className="h-1.5 w-1.5 rounded-full bg-[#65676B]" style={{ animation: "fbWaveDot 1.2s infinite 400ms" }} />
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 6. BARRA INFERIOR FIXA (fb-composer) */}
      <div className="fb-composer fixed inset-x-0 bottom-0 z-40 border-t border-[#DADDE1] bg-white px-3 py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <div className="mx-auto max-w-[520px]">
          {replyTarget && (
            <div className="mb-1.5 flex items-center justify-between rounded-lg bg-[#E7F3FF] px-3 py-1 text-[11.5px] text-[#1877F2]">
              <span>
                A responder a <strong>{replyTarget.name}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setReplyTarget(null);
                  setCommentInput("");
                }}
                className="font-bold hover:underline"
              >
                Cancelar ✕
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <CommentAvatar name={leadName} size={34} />

            <form
              onSubmit={handleSendComment}
              className="flex flex-1 items-center rounded-full bg-[#F0F2F5] pl-3.5 pr-1.5 py-1 border border-transparent focus-within:border-[#1877F2]/40 focus-within:bg-white"
            >
              <input
                id="fb-comment-input"
                ref={inputRef}
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={
                  replyTarget
                    ? `Responder a ${replyTarget.name.split(" ")[0]}…`
                    : `Comentar como ${firstName}…`
                }
                maxLength={400}
                className="w-full min-w-0 bg-transparent py-1 text-[14px] text-[#050505] placeholder:text-[#65676B] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!commentInput.trim()}
                aria-label="Enviar comentário"
                className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-white transition-all hover:bg-[#166FE5] disabled:bg-transparent disabled:text-[#BCC0C4]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </form>

            <button
              type="button"
              aria-label="Enviar Gosto"
              onClick={() => selectReaction("Gosto")}
              className="shrink-0 rounded-full transition-transform hover:scale-110 active:scale-90"
            >
              <FbLikeBadge size={32} />
            </button>
            <button
              type="button"
              aria-label="Enviar Adoro"
              onClick={() => selectReaction("Adoro")}
              className="shrink-0 rounded-full transition-transform hover:scale-110 active:scale-90"
            >
              <FbLoveBadge size={32} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
