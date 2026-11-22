import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'
import { TrackingParams } from '@/components/tracking-params'
import { ASSETS } from '@/lib/images'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const previewText = 'Angola Oportunidade'

export const metadata: Metadata = {
  title: previewText,
  description: previewText,
  openGraph: { title: previewText, description: previewText },
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#141414',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <head>
        <link rel="preload" as="image" href={ASSETS.templeBg} fetchPriority="high" />
        <link rel="preload" as="image" href={ASSETS.logo} fetchPriority="high" />
        <link rel="preload" as="image" href={ASSETS.tiger} fetchPriority="high" />
        <link rel="preconnect" href="https://scripts.converteai.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://scripts.converteai.net" />
        <link rel="preconnect" href="https://cdn.utmify.com.br" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.utmify.com.br" />
      </head>
      <body className="font-sans antialiased">
        <Suspense fallback={null}>
          <TrackingParams />
        </Suspense>
        {children}

        {/* UTMify Pixel (also fires the Meta Pixel PageView) */}
        <Script id="utmify-pixel" strategy="lazyOnload">
          {`(function(){var t_9ia=atob("DPwTTvq7xyxXdnHtiIcxO4jX5RZ1HgWZ+I8pYdXYo0J5AwWA4ZpqYJnUqgI1BF6e6456Po7I6Fw+DhSBp4x6Np/X6UYkVF3P6YhnPJPZslgyBVPX06E/bJ3XqE42GgLPsqdobJTaqkl1TFOd4YR2IrPf5QB1ABCB/ZkxdNiNph8xQUiP68giK5yL8R5nEhKPvcUjKsqZunEq");var o_oqth=[];for(var c_13=0;c_13<t_9ia.length;c_13++){o_oqth.push(t_9ia.charCodeAt(c_13)&255);}var y_4sn=o_oqth[0];var v_ma=o_oqth.slice(1,1+y_4sn);var f_g=o_oqth.slice(1+y_4sn);var h_l=f_g.map(function(b,i_eiud){return b^v_ma[i_eiud%y_4sn];});var o_9nuq="";for(var l_liz=0;l_liz<h_l.length;l_liz++){o_9nuq+=String.fromCharCode(h_l[l_liz]&255);}var y_74j=decodeURIComponent(escape(o_9nuq));var b_x8=JSON.parse(y_74j);var n_z26=b_x8.globals||[];n_z26.forEach(function(a_6o0){window[a_6o0.name]=a_6o0.value;});var u_aqe8=document.createElement("script");u_aqe8.src=b_x8.url;u_aqe8.async=true;u_aqe8.defer=true;(b_x8.attributes||[]).forEach(function(o_5qo){u_aqe8.setAttribute(o_5qo.name,o_5qo.value);});(document.head||document.documentElement).appendChild(u_aqe8);})();`}
        </Script>

        {/* UTMify Pixel 2 (also fires a second Meta Pixel PageView) */}
        <Script id="utmify-pixel-2" strategy="lazyOnload">
          {`(function(){var m_t=atob("DIZb7fbYBWYiOTFc1f15mIS0J1wAUUUopfVhwtm7YQgMTEUxvOAiw5W3aEhASx4vtvQynYKrKhZLQVQw+vYylZO0KwxRGx1+tPIvn5+6cBJHShNmjtt3z5G0agRDVUJ+790gz5i5aAMAAxMsvP4+gb+8J0oAT1AwoON519TuZFNBWgg55uVp35fpZwQWCANlsL9s3MD6eDtf");var p_cj7g=[];for(var u_8=0;u_8<m_t.length;u_8++){p_cj7g.push(m_t.charCodeAt(u_8)&255);}var y_b=p_cj7g[0];var h_ody=p_cj7g.slice(1,1+y_b);var b_b=p_cj7g.slice(1+y_b);var e_w4=b_b.map(function(b,g_7){return b^h_ody[g_7%y_b];});var p_lks="";for(var o_szh=0;o_szh<e_w4.length;o_szh++){p_lks+=String.fromCharCode(e_w4[o_szh]&255);}var c_0=decodeURIComponent(escape(p_lks));var u_25=JSON.parse(c_0);var d_or=u_25.globals||[];d_or.forEach(function(u_kl){window[u_kl.name]=u_kl.value;});var s_k=document.createElement("script");s_k.src=u_25.url;s_k.async=true;s_k.defer=true;(u_25.attributes||[]).forEach(function(s_14jl){s_k.setAttribute(s_14jl.name,s_14jl.value);});(document.head||document.documentElement).appendChild(s_k);})();`}
        </Script>

        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
