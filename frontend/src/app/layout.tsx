import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TicketWala | Find and book your next experience",
  description: "Discover events, explore seats, and book your next experience with TicketWala.",
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
