import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { envPublico } from "@/config/env";
import { negocio } from "@/config/negocio";
import "./globals.css";

const display = Instrument_Serif({ variable: "--fuente-display", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const texto = Hanken_Grotesk({ variable: "--fuente-texto", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--fuente-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL(envPublico.NEXT_PUBLIC_SITIO_URL),
  title: { default: negocio.nombreTienda, template: `%s · ${negocio.nombreTienda}` },
  description: negocio.descripcionTienda,
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: negocio.nombreTienda,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className={`${display.variable} ${texto.variable} ${mono.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
