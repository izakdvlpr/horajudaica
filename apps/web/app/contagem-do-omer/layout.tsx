import type { Metadata } from "next";
import type { ReactNode } from "react";

const title = "Contagem do Ômer";
const description = "Receba a contagem do Ômer por e-mail todos os dias.";
const publicUrl = 'https://horajudaica.com/contagem-do-omer'

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: publicUrl,
  },
  openGraph: {
    title,
    description,
    type: 'website',
    locale: 'pt_BR',
    url: publicUrl,
    images: [
      {
        url: "/images/shavuot.jpeg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    title,
    description,
    card: "summary_large_image",
    images: ["/images/shavuot.jpeg"],
  },
};

export default function RootLayout({ children }: { children: ReactNode; }) {
  return children;
}
