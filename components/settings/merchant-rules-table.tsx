"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { Category, MerchantRule } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { MerchantRuleEditDialog } from "./merchant-rule-edit-dialog";
import { deleteMerchantRuleAction } from "@/app/settings/merchant-rules/actions";

type CategoryWithChildren = Category & { children: Category[] };
type MerchantRuleRow = MerchantRule & { category: Category; subCategory: Category | null };

export function MerchantRulesTable({
  rules,
  categories,
}: {
  rules: MerchantRuleRow[];
  categories: CategoryWithChildren[];
}) {
  if (rules.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Henüz hiç merchant kuralı yok. İşlemler sayfasında bir işlemin kategorisini değiştirip
        &quot;Gelecekte de uygula?&quot; sorusuna evet dediğinizde burada görünecek.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Merchant</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell className="font-medium">{rule.normalizedMerchant}</TableCell>
              <TableCell>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: `${rule.category.color}1a`, color: rule.category.color }}
                  >
                    {rule.category.name}
                  </Badge>
                  {rule.subCategory && (
                    <Badge
                      variant="secondary"
                      style={{ backgroundColor: `${rule.subCategory.color}1a`, color: rule.subCategory.color }}
                    >
                      {rule.subCategory.name}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <MerchantRuleEditDialog
                    rule={rule}
                    categories={categories}
                    trigger={
                      <Button variant="ghost" size="icon-sm">
                        <Pencil className="size-3.5" />
                        <span className="sr-only">Düzenle</span>
                      </Button>
                    }
                  />
                  <ConfirmDeleteButton
                    title="Kuralı sil"
                    description={`"${rule.normalizedMerchant}" için otomatik kategorilendirme kuralını silmek istediğinize emin misiniz? Bu, sadece gelecekteki önerileri etkiler; mevcut işlemler değişmez.`}
                    action={() => deleteMerchantRuleAction(rule.id)}
                    trigger={
                      <Button variant="ghost" size="icon-sm">
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Sil</span>
                      </Button>
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
