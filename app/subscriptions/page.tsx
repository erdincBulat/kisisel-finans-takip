import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  syncSubscriptions,
  listPendingSubscriptions,
  listConfirmedSubscriptions,
  listInactiveSubscriptions,
  getMonthlyRecurringTotal,
} from "@/lib/subscriptions/subscription.service";
import { formatKurus } from "@/lib/money";
import { SubscriptionsTable } from "@/components/subscriptions/subscriptions-table";
import { SubscriptionActionButton } from "@/components/subscriptions/subscription-action-button";
import { confirmSubscriptionAction, setSubscriptionActiveAction } from "./actions";

export default async function SubscriptionsPage() {
  await syncSubscriptions();

  const [pending, confirmed, inactive] = await Promise.all([
    listPendingSubscriptions(),
    listConfirmedSubscriptions(),
    listInactiveSubscriptions(),
  ]);

  const monthlyTotal = getMonthlyRecurringTotal(confirmed);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Abonelikler</h1>
        <p className="text-sm text-muted-foreground">
          Tekrar eden işlemlerden otomatik tespit edilen muhtemel abonelikler — onaylamadan aylık sabit gidere
          dahil edilmez.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <RefreshCw className="size-4" /> Tahmini Aylık Sabit Gider
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{formatKurus(monthlyTotal)}</p>
          <p className="text-sm text-muted-foreground">{confirmed.length} onaylı abonelik (yıllık abonelikler dahil değil).</p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Muhtemel Abonelikler</h2>
        <SubscriptionsTable
          subscriptions={pending}
          emptyMessage="Onay bekleyen muhtemel abonelik bulunmuyor."
          renderActions={(s) => (
            <>
              <SubscriptionActionButton
                label="Onayla"
                pendingLabel="Onaylanıyor..."
                variant="default"
                action={confirmSubscriptionAction.bind(null, s.id)}
              />
              <SubscriptionActionButton
                label="Yoksay"
                pendingLabel="İşleniyor..."
                variant="ghost"
                action={setSubscriptionActiveAction.bind(null, s.id, false)}
              />
            </>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Onaylı Abonelikler</h2>
        <SubscriptionsTable
          subscriptions={confirmed}
          emptyMessage="Henüz onaylanmış abonelik yok."
          renderActions={(s) => (
            <SubscriptionActionButton
              label="Pasif Yap"
              pendingLabel="İşleniyor..."
              variant="ghost"
              action={setSubscriptionActiveAction.bind(null, s.id, false)}
            />
          )}
        />
      </div>

      {inactive.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">Pasif Abonelikler</h2>
          <SubscriptionsTable
            subscriptions={inactive}
            emptyMessage="Pasif abonelik bulunmuyor."
            renderActions={(s) => (
              <SubscriptionActionButton
                label="Aktif Yap"
                pendingLabel="İşleniyor..."
                variant="outline"
                action={setSubscriptionActiveAction.bind(null, s.id, true)}
              />
            )}
          />
        </div>
      )}
    </div>
  );
}
