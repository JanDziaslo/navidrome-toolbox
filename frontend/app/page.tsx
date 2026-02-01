import Image from "next/image";
import { ToolsGrid } from "@/components/dashboard/tools-grid";


export default function Home() {
  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center shrink-0">
          <Image src="/navidrome.svg" alt="Logo" width={48} height={48} className="w-full h-full" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text-primary">Witamy w Navidrome Toolbox</h1>
          <p className="text-sm text-text-secondary">
            Narzędzia do zarządzania biblioteką muzyczną Navidrome.
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <section>
        <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-4">Dostępne narzędzia</h2>
        <ToolsGrid />
      </section>
    </div>
  );
}
