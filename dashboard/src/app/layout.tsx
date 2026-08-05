import type { Metadata } from "next";
import { Archivo, Inter, Roboto_Mono } from "next/font/google";
import AppHeader from "@/components/AppHeader";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DPDP AI Scanner Dashboard",
  description: "Scan history and DPDP Act obligation findings for AI/LLM call sites.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${inter.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-canvas font-body text-ink">
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
