"use client";
import * as Sentry from "@sentry/nextjs";
import React from "react";

export default function GlobalError({ error }: { error: Error }) {
  React.useEffect(() => {
    try {
      Sentry.captureException(error);
    } catch (e) {
      // ignore
    }
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: 24 }}>
          <h1>Something went wrong</h1>
          <p>We're tracking this error and will investigate.</p>
        </div>
      </body>
    </html>
  );
}
