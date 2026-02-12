import { WallGrid } from "@/components/WallGrid";

const WALL_BG =
  "/images/" + encodeURIComponent("ChatGPT Image 13 февр. 2026 г., 00_21_14.png");

export default function Home() {
  return (
    <main className="min-h-screen wall-page py-6">
      <div className="wall-container mx-auto px-4">
        <h1 className="text-center text-2xl font-semibold text-stone-800 mb-2">
          Wall of Photos
        </h1>
        <p className="text-center text-stone-600 text-sm mb-6 max-w-md mx-auto">
          Загрузите фото — оно появится в случайной свободной нише на стене.
        </p>
        <WallGrid backgroundImageUrl={WALL_BG} />
      </div>
    </main>
  );
}
