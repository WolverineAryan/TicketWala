import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TicketWala | High-Contention Flash-Reservation & Seat Inventory Engine",
  description: "Next-gen distributed flash reservation engine powered by Redis Lua scripts, TTL locks, and zero double-allocation guarantee.",
  icons: {
    icon: "/logo-icon-transparent.png",
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
