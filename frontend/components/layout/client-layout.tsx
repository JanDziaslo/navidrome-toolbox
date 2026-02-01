"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { PageTransition } from "@/components/layout/page-transition";

export function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:ml-72">
        <PageTransition>{children}</PageTransition>
      </main>
      <Toaster />
    </div>
  );
}
