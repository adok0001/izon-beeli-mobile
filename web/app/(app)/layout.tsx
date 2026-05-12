import { AudioPlayerBar } from "@/components/layout/audio-player-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { OnboardingModal } from "@/components/onboarding-modal";
import { TourFloatingButton } from "@/components/tour/tour-floating-button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-[#07070f]">
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-4">
        {children}
      </main>

      {/* Persistent audio player */}
      <AudioPlayerBar />

      {/* Mobile bottom navigation */}
      <MobileNav />

      {/* Welcome checklist floating button */}
      <TourFloatingButton />

      {/* First-visit language picker */}
      <OnboardingModal />
    </div>
  );
}
