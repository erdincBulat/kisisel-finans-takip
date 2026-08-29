import { Wallet2 } from "lucide-react";
import { NavLinks } from "./nav-links";

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <Wallet2 className="size-5 text-primary" />
        <span className="text-sm font-semibold">Finans Takip</span>
      </div>
      <NavLinks />
    </aside>
  );
}
