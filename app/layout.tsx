import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Inter } from "next/font/google";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import { MyRuntimeProvider } from "@/app/MyRuntimeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Documix",
  description: "Document processing and chat interface powered by AI.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <MyRuntimeProvider>
      <html lang="en">
        <body
          className={cn("flex min-h-svh flex-col antialiased", inter.className)}
        >
          <TooltipProvider delayDuration={0}>
            {children}
            <Toaster />
          </TooltipProvider>
        </body>
      </html>
    </MyRuntimeProvider>
  );
}

import "./globals.css";
