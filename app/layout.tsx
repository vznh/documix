import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import { MyRuntimeProvider } from "@/app/MyRuntimeProvider";
import "./globals.css";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { Zap } from "lucide-react";
import { InfoDialog } from "@/components/info-dialog";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Documix",
  description: "Document processing and chat interface powered by AI.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <MyRuntimeProvider>
            <header className="flex justify-between items-center p-4 h-16 border-b">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" />
                <Link href="/">
                  <h1 className="text-xl font-bold underline">Documix</h1>
                </Link>
                <InfoDialog />
              </div>
              <div className="flex items-center gap-4">
                <div id="api-config-status"></div>
                <SignedOut>
                  <SignInButton />
                  <SignUpButton />
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </div>
            </header>
            <TooltipProvider delayDuration={0}>
              {children}
              <Toaster />
            </TooltipProvider>
          </MyRuntimeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
