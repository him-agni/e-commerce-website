"use client";

// Last-resort error page. It replaces the whole document, so it carries its own minimal styles.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily: "Georgia, serif",
          background: "#fbf8f3",
          color: "#1f1a17",
        }}
      >
        <h1 style={{ fontSize: "2rem", margin: 0 }}>Something went wrong</h1>
        <p style={{ margin: 0, maxWidth: "28rem" }}>
          My Farmhouse hit an unexpected problem. Please try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            padding: "0.6rem 1.4rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "#1f1a17",
            color: "#fbf8f3",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
