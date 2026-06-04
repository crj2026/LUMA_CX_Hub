import { ClerkProvider } from "@clerk/nextjs";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata = {
  // [BRAND_NAME] — shown in the browser tab and link previews.
  title: "[BRAND_NAME] CX Hub",
  description: "[BRAND_NAME] — Customer Experience Hub",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${dmSans.variable} ${cormorant.variable}`}>
        <body style={{ margin: 0 }}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
