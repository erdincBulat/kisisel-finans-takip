"use client";

import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/** PDF drag & drop / dosya seçim alanı (spec §13). */
export function StatementDropzone({
  onFileAccepted,
  disabled,
}: {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function acceptFile(file: File | null | undefined) {
    if (!file || disabled) return;
    if (!isPdfFile(file)) {
      toast.error("Sadece PDF dosyaları kabul edilir.");
      return;
    }
    onFileAccepted(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border px-6 py-14 text-center transition-colors",
        isDragging && "border-primary bg-primary/5",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <UploadCloud className="size-8 text-muted-foreground" />
      <div className="text-sm font-medium">Ekstre PDF&apos;sini buraya bırak</div>
      <div className="text-xs text-muted-foreground">veya</div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
      >
        Dosya Seç
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          acceptFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
