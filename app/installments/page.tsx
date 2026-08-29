import { CalendarClock, Layers, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInstallmentPlans } from "@/lib/installments/schedule";
import { getInstallmentBurdenByMonth, getActivePlans, getCompletedPlans, getTotalRemainingDebt } from "@/lib/installments/calculations";
import { getLatestDataMonth } from "@/lib/analytics/monthly-summary";
import { formatKurus } from "@/lib/money";
import { UpcomingBurdenChart } from "@/components/installments/upcoming-burden-chart";
import { InstallmentsTable } from "@/components/installments/installments-table";

export default async function InstallmentsPage() {
  const now = new Date();
  const anchor = (await getLatestDataMonth()) ?? { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  const next = anchor.month === 12 ? { year: anchor.year + 1, month: 1 } : { year: anchor.year, month: anchor.month + 1 };

  const [plans, burden] = await Promise.all([getInstallmentPlans(), getInstallmentBurdenByMonth(next.year, next.month, 6)]);

  const activePlans = getActivePlans(plans);
  const completedPlans = getCompletedPlans(plans);
  const totalRemainingDebt = getTotalRemainingDebt(activePlans);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Taksitler</h1>
        <p className="text-sm text-muted-foreground">
          Aktif taksitli işlemler, gelecek ay bazlı taksit yükü ve her taksitin ödeme takvimi.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Layers className="size-4" /> Aktif Taksit Sayısı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{activePlans.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wallet className="size-4" /> Toplam Kalan Borç
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatKurus(totalRemainingDebt)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarClock className="size-4" /> Gelecek Ay Taksit Tutarı
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatKurus(burden[0]?.total ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      <UpcomingBurdenChart data={burden} />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Aktif Taksitler</h2>
        <InstallmentsTable plans={activePlans} emptyMessage="Aktif taksitli işlem bulunmuyor." />
      </div>

      {completedPlans.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Tamamlanmış Taksitler</h2>
          <InstallmentsTable plans={completedPlans} emptyMessage="Tamamlanmış taksitli işlem bulunmuyor." />
        </div>
      )}
    </div>
  );
}
