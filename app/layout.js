import { Geist, Geist_Mono } from "next/font/google";
import { dark } from '@clerk/themes'
import {
  ClerkProvider
} from '@clerk/nextjs';

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Collaborative Code Studio",
  description: "Create your own collaborative workspace and code together in real-time.",
  icons: {
    icon: "/code.ico",
  },
};

export default function RootLayout({ children }) {
  return (

    <html lang="en">

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider appearance={{ baseTheme: dark, layout: { unsafe_disableDevelopmentModeWarnings: true, }, }}>
          {children}
          <script src="https://cdn.lordicon.com/lordicon.js"></script>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=exit_to_app" />
        </ClerkProvider>
      </body>

    </html>


  );
}
