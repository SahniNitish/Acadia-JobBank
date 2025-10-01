import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { NavigationHeader } from "@/components/ui/navigation-header";
import { ErrorBoundary, PageErrorBoundary } from "@/components/ui/error-boundary";
import { PerformanceMonitorComponent } from "@/components/ui/performance-monitor";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "University Job Bank",
  description: "Job posting and application platform for Acadia University",
  keywords: "university, jobs, students, faculty, Acadia University",
  authors: [{ name: "Acadia University" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PageErrorBoundary>
          <AuthProvider>
            <ErrorBoundary>
              <NavigationHeader />
            </ErrorBoundary>
            <main className="min-h-screen px-4 sm:px-6 lg:px-8">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
            <PerformanceMonitorComponent />
          </AuthProvider>
        </PageErrorBoundary>
      </body>
    </html>
  );
}