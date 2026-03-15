import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AudioPlayerBar } from "@/components/layout/audio-player-bar";
import { TourOverlay } from "@/components/tour/tour-overlay";
import { TourLauncher } from "@/components/tour/tour-launcher";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950">
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-4">
        {children}
      </main>

      {/* Persistent audio player (above bottom nav on mobile) */}
      <AudioPlayerBar />

      {/* Mobile bottom navigation */}
      <MobileNav />

      {/* Welcome tour */}
      <TourLauncher />
      <TourOverlay />
    </div>
  );
}
