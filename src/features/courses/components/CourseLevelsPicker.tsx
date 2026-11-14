import type { LanguageLevel } from "@/features/courses/types/course";

type CourseLevelsPickerProps = {
  levels: LanguageLevel[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  hasLanguage: boolean;
  isLoading: boolean;
  isError: boolean;
  disabled?: boolean;
};

export function CourseLevelsPicker({ levels, selectedIds, onChange, hasLanguage, isLoading, isError, disabled }: CourseLevelsPickerProps) {
  return (
    <fieldset className="space-y-3" disabled={disabled || !hasLanguage || isLoading || isError}>
      <legend className="text-sm font-medium text-foreground">Níveis do curso</legend>
      {!hasLanguage ? (
        <p className="text-sm text-muted-foreground">Selecione um idioma para escolher os níveis.</p>
      ) : isLoading ? (
        <p role="status" className="text-sm text-muted-foreground">Carregando níveis...</p>
      ) : isError ? (
        <p role="alert" className="text-sm text-destructive">Não foi possível carregar os níveis. Tente novamente ao reabrir a página.</p>
      ) : levels.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum nível cadastrado para este idioma.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {levels.map((level) => (
              <label key={level.id} className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${selectedIds.includes(level.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-foreground hover:bg-accent'}`}>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={selectedIds.includes(level.id)}
                  onChange={() => onChange(selectedIds.includes(level.id) ? selectedIds.filter((id) => id !== level.id) : [...selectedIds, level.id])}
                />
                {level.level}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Selecione um ou mais níveis do idioma escolhido.</p>
        </>
      )}
    </fieldset>
  );
}
