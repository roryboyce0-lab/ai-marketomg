import type { Metadata } from "next";
import type { ReactNode } from "react";
import { loadPilotConfig } from "@ai-marketomg/core";
import "./globals.css";

export const metadata: Metadata = {
  title: "ai-marketomg",
  description: "Pilot agent dashboard — runs, drafts, approvals",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const pilot = loadPilotConfig();

  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">ai-marketomg</span>
            <span className="brand-sub">{pilot.clientName} pilot</span>
          </div>
          <nav className="nav">
            <a href="/">Overview</a>
            <a href="/runs">Runs</a>
            <a href="/approvals">Approvals</a>
            <a href="/send-log">Send log</a>
          </nav>
        </header>
        <main className="page">{children}</main>
      </body>
    </html>
  );
}
