import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

type Props = {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  isLoading?: boolean;
  isError?: boolean;
};

export function ClassFilterDropdown({ label, options, selected, onChange, isLoading, isError }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', escape); };
  }, [open]);
  return (
    <div ref={root} className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <Button ref={trigger} type="button" variant="outline" className="h-11 gap-2" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        {label}{selected.length > 0 ? ` (${selected.length})` : ''}<ChevronDown className="h-4 w-4" aria-hidden="true" />
      </Button>
      {open && (
        <div id={id} className="absolute left-0 top-12 z-20 w-64 max-w-[85vw] rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-lg">
          <fieldset className="max-h-64 space-y-2 overflow-y-auto">
            <legend className="sr-only">{label}</legend>
            {isLoading ? <p role="status" className="text-sm">Carregando...</p> : isError ? <p role="alert" className="text-sm text-destructive">Não foi possível carregar as opções.</p> : options.length === 0 ? <p className="text-sm">Nenhuma opção disponível.</p> : options.map((option) => (
              <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 text-sm hover:bg-accent">
                <input type="checkbox" checked={selected.includes(option.value)} onChange={() => onChange(selected.includes(option.value) ? selected.filter((value) => value !== option.value) : [...selected, option.value])} />
                {option.label}
              </label>
            ))}
          </fieldset>
          <Button type="button" variant="outline" className="mt-3 w-full" disabled={selected.length === 0} onClick={() => onChange([])}>Limpar seleção</Button>
        </div>
      )}
    </div>
  );
}
