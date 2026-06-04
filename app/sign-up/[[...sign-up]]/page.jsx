import { SignUp } from "@clerk/nextjs";

// Brand palette — keep in sync with app/AppClient.jsx and the sign-in page.
const CREAM   = "#F4F0E8"; // [BACKGROUND_COLOR]
const GOLD    = "#C4A96B"; // [ACCENT_COLOR]
const INK     = "#0A0A09"; // [PRIMARY_COLOR]
const BORDER  = "#DDD8CE"; // [BORDER_COLOR]
const W       = "#FAF8F3"; // [SURFACE_COLOR]
const STONE   = "#6B6760"; // [MUTED_TEXT_COLOR]

const clerkAppearance = {
  variables: {
    colorPrimary: INK,
    colorText: INK,
    colorTextSecondary: "rgba(10,10,9,0.55)",
    colorBackground: W,
    colorInputBackground: CREAM,
    colorInputText: INK,
    colorDanger: "#B44",
    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
    borderRadius: "10px",
  },
  elements: {
    rootBox: { width: "100%" },
    card: {
      background: W,
      border: "1px solid " + BORDER,
      borderRadius: 14,
      boxShadow: "0 14px 50px rgba(196,169,107,0.12)",
      padding: "30px 28px",
    },
    headerTitle: {
      fontFamily: "var(--font-cormorant), Georgia, serif",
      fontWeight: 600,
      fontSize: 22,
      color: INK,
    },
    headerSubtitle: {
      fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
      fontSize: 13,
      color: "rgba(10,10,9,0.55)",
    },
    formButtonPrimary: {
      background: INK,
      color: "#FAF8F3",
      borderRadius: 10,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "none",
      padding: "11px 18px",
    },
    formFieldInput: {
      borderRadius: 10,
      border: "1px solid " + BORDER,
      background: CREAM,
      padding: "10px 12px",
    },
    formFieldLabel: { color: INK, fontWeight: 600, fontSize: 12 },
    footerActionLink: { color: GOLD, fontWeight: 700 },
    socialButtonsBlockButton: { borderRadius: 10, border: "1px solid " + BORDER },
    dividerLine: { background: BORDER },
    dividerText: { color: "rgba(10,10,9,0.4)" },
    footer: { background: "transparent" },
  },
};

export default function SignUpPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: CREAM,
        padding: "48px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -260, right: -260,
          width: 640, height: 640,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(196,169,107,0.14) 0%, rgba(196,169,107,0) 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: -260, left: -260,
          width: 540, height: 540,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(196,169,107,0.08) 0%, rgba(196,169,107,0) 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favicon.svg"
            alt=""
            width={42}
            height={42}
            style={{ display: "inline-block", marginBottom: 18 }}
          />
          <div
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontWeight: 700,
              fontSize: 32,
              color: INK,
              letterSpacing: 6,
              marginBottom: 6,
            }}
          >
            [BRAND_NAME]
          </div>
          <div
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: 9,
              color: GOLD,
              letterSpacing: 4,
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: 18,
            }}
          >
            CX Hub
          </div>
          <div
            style={{
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontStyle: "italic",
              fontSize: 18,
              color: INK,
              opacity: 0.65,
              lineHeight: 1.4,
            }}
          >
            [BRAND_TAGLINE]
          </div>
        </div>

        <SignUp appearance={clerkAppearance} />

        <div
          style={{
            textAlign: "center",
            marginTop: 28,
            fontFamily: "var(--font-dm-sans)",
            fontSize: 9,
            color: STONE,
            letterSpacing: 2,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Built for modern CX teams
        </div>
      </div>
    </div>
  );
}
