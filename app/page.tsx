import { WallGrid } from "@/components/WallGrid";

export default function Home() {
  return (
    <main className="min-h-screen wall-page py-6">
      <div className="wall-container mx-auto px-4">
        <WallGrid />
      </div>
    </main>
  );
}
