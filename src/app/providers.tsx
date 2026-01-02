"use client";

import React from "react";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import AuthGuard from "@/components/AuthGuard";
import { ModalProvider } from "@/context/ModalContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ModalProvider>
            <AuthGuard>
                {children}
            </AuthGuard>
        </ModalProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
