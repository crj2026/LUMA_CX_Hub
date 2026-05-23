import { ClerkProvider } from "@clerk/nextjs";
import { Raleway, Spectral } from "next/font/google";

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-raleway",
  display: "swap",
});

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

export const metadata = {
  title: "IM8 CS Hub",
  description: "IM8 Customer Experience Hub",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${raleway.variable} ${spectral.variable}`}>
        <body style={{ margin: 0 }}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
