import type { Metadata } from "next";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: "TicketWala | Event reservations with FlashLock",
    template: "%s | TicketWala",
  },
  description: "Reserve event inventory with server-controlled holds, atomic Redis Lua transitions, and verified booking state.",
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
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
