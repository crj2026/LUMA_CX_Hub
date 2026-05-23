import { SignUp } from "@clerk/nextjs";

// Mirrors the sign-in page so the experience is consistent end-to-end.
// If brand colours / typography change, update both files together.
const CREAM = "#FAF6F1";
const BURG = "#50000B";
const INK = "#3A2F2C";
const SOFT_BORDER = "#EDE3D8";
const W = "#FFFFFF";

const clerkAppearance = {
  variables: {
    colorPrimary: BURG,
    colorText: INK,
    colorTextSecondary: "rgba(58,47,44,0.65)",
    colorBackground: W,
    colorInputBackground: CREAM,
    colorInputText: INK,
    colorDanger: "#A40011",
    fontFamily: "var(--font-raleway), system-ui, sans-serif",
    borderRadius: "10px",
  },
  elements: {
    rootBox: { width: "100%" },
    card: {
      background: W,
      border: "1px solid " + SOFT_BORDER,
      borderRadius: 14,
      boxShadow: "0 14px 50px rgba(80,0,11,0.12)",
      padding: "30px 28px",
    },
    headerTitle: {
      fontFamily: "var(--font-spectral), Georgia, serif",
      fontWeight: 600,
      fontSize: 22,
      color: BURG,
    },
    headerSubtitle: {
      fontFamily: "var(--font-raleway), system-ui, sans-serif",
      fontSize: 13,
      color: "rgba(58,47,44,0.65)",
    },
    formButtonPrimary: {
      background: BURG,
      color: "#FFF",
      borderRadius: 10,
      fontWeight: 700,
      letterSpacing: 1,
      textTransform: "none",
      padding: "11px 18px",
      "&:hover": { background: "#A40011" },
      "&:focus": { background: BURG, boxShadow: "0 0 0 3px rgba(200,151,58,0.4)" },
    },
    formFieldInput: {
      borderRadius: 10,
      border: "1px solid " + SOFT_BORDER,
      background: CREAM,
      padding: "10px 12px",
      "&:focus": { borderColor: BURG, boxShadow: "0 0 0 3px rgba(200,151,58,0.2)" },
    },
    formFieldLabel: { color: INK, fontWeight: 600, fontSize: 12 },
    footerActionLink: { color: BURG, fontWeight: 700 },
    socialButtonsBlockButton: { borderRadius: 10, border: "1px solid " + SOFT_BORDER },
    dividerLine: { background: SOFT_BORDER },
    dividerText: { color: "rgba(58,47,44,0.45)" },
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
          background: "radial-gradient(circle, rgba(80,0,11,0.10) 0%, rgba(80,0,11,0) 70%)",
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
          background: "radial-gradient(circle, rgba(200,151,58,0.10) 0%, rgba(200,151,58,0) 70%)",
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
            height={40}
            style={{ display: "inline-block", marginBottom: 18 }}
          />
          <div
            style={{
              fontFamily: "var(--font-raleway)",
              fontWeight: 700,
              fontSize: 36,
              color: BURG,
              letterSpacing: 10,
              marginBottom: 8,
            }}
          >
            I M 8
          </div>
          <div
            style={{
              fontFamily: "var(--font-raleway)",
              fontSize: 10,
              color: BURG,
              opacity: 0.55,
              letterSpacing: 4,
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            CX Hub
          </div>
          <div
            style={{
              fontFamily: "var(--font-spectral), Georgia, serif",
              fontStyle: "italic",
              fontSize: 17,
              color: INK,
              opacity: 0.65,
              marginTop: 18,
              lineHeight: 1.4,
            }}
          >
            Create your account. Your home base for everything CX.
          </div>
        </div>

        <SignUp appearance={clerkAppearance} />

        <div
          style={{
            textAlign: "center",
            marginTop: 28,
            fontFamily: "var(--font-raleway)",
            fontSize: 10,
            color: INK,
            opacity: 0.4,
            letterSpacing: 2,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Built for the IM8 CX team
        </div>
      </div>
    </div>
  );
}
