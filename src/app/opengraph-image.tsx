import { ImageResponse } from "next/og";

export const alt = "StoxRoute — scan tokenized-stock issuer routes on Solana";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#080d0c", color: "#f3f7f5", fontFamily: "Arial, sans-serif", border: "1px solid #24312f" }}>
      <div style={{ position: "absolute", top: 58, left: 72, right: 72, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, fontWeight: 700 }}><span style={{ display: "flex", width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", background: "#65e6bf", color: "#07100d", fontSize: 17 }}>SR</span>StoxRoute</div>
        <div style={{ display: "flex", color: "#8e9a97", fontSize: 20 }}>LIVE OPPORTUNITY SCANNER · SOLANA</div>
      </div>
      <div style={{ position: "absolute", top: 218, left: 72, display: "flex", flexDirection: "column", width: 1050 }}>
        <div style={{ display: "flex", color: "#65e6bf", fontSize: 20, letterSpacing: 4, marginBottom: 24 }}>NVDA · TSLA · SPY</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 72, lineHeight: 1.02, letterSpacing: -4, fontWeight: 600 }}><span>One budget.</span><span>Every verified pair.</span></div>
      </div>
      <div style={{ position: "absolute", left: 72, right: 72, bottom: 54, display: "flex", justifyContent: "space-between", borderTop: "1px solid #24312f", paddingTop: 28, color: "#8e9a97", fontSize: 21 }}>
        <span>Equal USDC · live Jupiter quotes · onchain multipliers</span><span style={{ color: "#65e6bf" }}>Walletless scan</span>
      </div>
    </div>,
    size,
  );
}
