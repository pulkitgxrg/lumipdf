import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  markClassName,
  showWordmark = true,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "grid size-8 place-items-center rounded-lg bg-ink text-white",
          markClassName,
        )}
      >
        <FileText className="size-3.5" strokeWidth={2.5} />
      </div>
      {showWordmark ? (
        <span className="text-[17px] font-bold tracking-tight text-ink">LumiPDF</span>
      ) : null}
    </div>
  );
}
