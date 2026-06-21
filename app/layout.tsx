import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "たまたま書店",
  description: "高知県津野町の、小さなWeb本屋",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700;800&family=Zen+Old+Mincho:wght@400;500;600;700;900&family=Hina+Mincho&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Zen+Kaku+Gothic+New:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
