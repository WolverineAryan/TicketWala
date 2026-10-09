import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TicketWala | High-Contention Flash-Reservation & Seat Inventory Engine",
  description: "Next-gen distributed flash reservation engine powered by Redis Lua scripts, TTL locks, and zero double-allocation guarantee.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎟️</text></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0 }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
