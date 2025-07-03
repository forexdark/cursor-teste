import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers/Providers";
import ErrorBoundary from "./components/ui/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "VigIA - Monitoramento de Preços do Mercado Livre",
  description: "Monitore preços automaticamente e economize dinheiro no Mercado Livre. Alertas inteligentes, gráficos de histórico e muito mais.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} antialiased`}>
        <ErrorBoundary>
          <Providers>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
