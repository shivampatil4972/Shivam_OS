"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#04060c", color: "#eef2f9", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 24 }}>
        <div>
          <h1 style={{ fontSize: 24 }}>SHIVAM.OS could not start.</h1>
          <p style={{ color: "#b3bdcc" }}>A critical error occurred.</p>
          <button type="button" onClick={reset} style={{ marginTop: 12, height: 40, padding: "0 16px", borderRadius: 12, border: 0, background: "#1f5fe0", color: "#fff", cursor: "pointer" }}>
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
