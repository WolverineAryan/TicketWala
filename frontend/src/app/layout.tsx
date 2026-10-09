import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TicketWala | Flash-Reservation Engine",
  description: "High-Contention Flash-Reservation & Adaptive Seat Inventory Engine",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, -apple-system, sans-serif", margin: 0, padding: "20px", background: "#f8fafc", color: "#0f172a" }}>
        {children}
      </body>
    </html>
  );
}
