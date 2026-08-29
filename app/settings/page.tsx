import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Tags, Wallet, ListChecks, RefreshCw, Sparkles, Database, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SettingsLink = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  comingSoon?: boolean;
};

const LINKS: SettingsLink[] = [
  {
    href: "/categories",
    icon: Tags,
    title: "Kategori Yönetimi",
    description: "Ana ve alt kategorileri oluşturun, düzenleyin, silin.",
  },
  {
    href: "/budgets",
    icon: Wallet,
    title: "Bütçe Yönetimi",
    description: "Kategori bazlı aylık harcama limitleri belirleyin.",
  },
  {
    href: "/settings/merchant-rules",
    icon: ListChecks,
    title: "Merchant Kuralları",
    description: "Otomatik kategorilendirme kurallarını görüntüleyin, düzenleyin, silin.",
  },
  {
    href: "/subscriptions",
    icon: RefreshCw,
    title: "Abonelikler",
    description: "Tespit edilen düzenli ödemeleri onaylayın veya pasifleştirin.",
  },
  {
    href: "/settings/ai",
    icon: Sparkles,
    title: "AI Ayarları",
    description: "Otomatik kategorilendirme için yapay zeka desteği.",
    comingSoon: true,
  },
  {
    href: "/settings/data",
    icon: Database,
    title: "Veri Yönetimi",
    description: "Veritabanı dosyasının konumu ve yedeği.",
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Ayarlar</h1>
        <p className="text-sm text-muted-foreground">
          Uygulamanın kategori, bütçe, kural ve abonelik yönetimi kısayolları.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((link) => {
          const Icon = link.icon;
          const content = (
            <Card
              className={cn(
                "h-full transition-colors",
                link.comingSoon ? "opacity-60" : "hover:bg-accent/50",
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <CardTitle className="text-base font-medium">{link.title}</CardTitle>
                  </div>
                  {link.comingSoon ? (
                    <Badge variant="secondary">Yakında</Badge>
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{link.description}</CardContent>
            </Card>
          );

          if (link.comingSoon) {
            return <div key={link.href}>{content}</div>;
          }

          return (
            <Link key={link.href} href={link.href}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
