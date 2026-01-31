import Image from "next/image";
import { ToolsGrid } from "@/components/dashboard/tools-grid";


export default function Home() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center">
          <Image src="/navidrome.svg" alt="Logo" width={48} height={48} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Witamy w Navidrome Toolbox</h1>
          <p className="text-text-secondary">
            Narzędzia do zarządzania biblioteką muzyczną Navidrome.
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-4">Dostępne narzędzia</h2>
        <ToolsGrid />
      </section>
    </div>
  );
}
