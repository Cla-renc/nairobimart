"use client";
import React from "react";

export default function GlobalError({ error }: { error: Error }) {
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    import("@sentry/react")
      .then((Sentry) => {
        Sentry.captureException(error);
      })
      .catch(() => {
        // ignore
      });
  }, [error]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Something went wrong</h1>
      <p>We&apos;re tracking this error and will investigate.</p>
    </div>
  );
}
