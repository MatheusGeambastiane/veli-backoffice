"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguageLevels, useLanguagesSimple } from "@/features/courses/queries/coursesQueries";
import { usersApi } from "@/features/users/api/usersApi";
import { usersKeys } from "@/features/users/queries/usersQueries";
import type {
  DashboardTeacherProfile,
  DashboardUserDetails,
} from "@/features/users/types/dashboardUserDetails";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { HttpError } from "@/shared/lib/http/http";

function errorMessage(error: unknown): string {
  if (error instanceof HttpError && error.details) {
    const messages = (value: unknown): string[] => {
      if (typeof value === "string") return [value];
      if (Array.isArray(value)) return value.flatMap(messages);
      if (value && typeof value === "object") return Object.values(value).flatMap(messages);
      return [];
    };
    return messages(error.details).join(" ") || "Não foi possível salvar o perfil.";
  }
  return "Não foi possível salvar o perfil. Tente novamente.";
}

export function TeacherProfileTab({
  userId,
  profile,
}: {
  userId: string;
  profile: DashboardTeacherProfile | null;
}) {
  const queryClient = useQueryClient();
  const levels = useLanguageLevels();
  const languages = useLanguagesSimple();
  const [isEditing, setIsEditing] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(profile?.hourly_rate ?? "");
  const [cnpj, setCnpj] = useState(profile?.cnpj ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [selectedLevels, setSelectedLevels] = useState(
    profile?.lang_levels.map((level) => level.id) ?? [],
  );
  const save = useMutation({
    mutationFn: () =>
      usersApi.saveTeacherProfile(userId, {
        hourly_rate: hourlyRate,
        cnpj: cnpj.replace(/\D/g, ""),
        bio,
        lang_levels: selectedLevels,
      }),
    onSuccess: async (updated) => {
      queryClient.setQueryData(
        usersKeys.dashboardDetail(userId),
        (previous: DashboardUserDetails | undefined) =>
          previous ? { ...previous, teacher_profile: updated } : previous,
      );
      setIsEditing(false);
      await queryClient.invalidateQueries({ queryKey: usersKeys.dashboard() });
    },
  });

  function startEditing() {
    setHourlyRate(profile?.hourly_rate ?? "");
    setCnpj(profile?.cnpj ?? "");
    setBio(profile?.bio ?? "");
    setSelectedLevels(profile?.lang_levels.map((level) => level.id) ?? []);
    save.reset();
    setIsEditing(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!save.isPending) save.mutate();
  }

  if (!isEditing) {
    return (
      <div className="space-y-5">
        {profile ? (
          <>
            <dl className="grid gap-5 md:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Valor hora</dt>
                <dd>
                  {Number(profile.hourly_rate).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">CNPJ</dt>
                <dd>{profile.cnpj || "Não informado"}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-sm text-muted-foreground">Biografia</dt>
                <dd className="whitespace-pre-wrap">{profile.bio || "Não informada"}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-sm text-muted-foreground">Idiomas e níveis</dt>
                <dd>
                  {profile.lang_levels
                    .map((level) => `${level.language.name} ${level.level}`)
                    .join(", ") || "Nenhum nível cadastrado"}
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Este usuário ainda não possui perfil de professor.
          </p>
        )}
        {save.isSuccess && (
          <p role="status" className="text-sm text-primary">
            Perfil de professor salvo com sucesso.
          </p>
        )}
        <Button type="button" onClick={startEditing}>
          {profile ? "Editar perfil de professor" : "Criar perfil de professor"}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <fieldset disabled={save.isPending} className="space-y-5">
        <legend className="sr-only">Perfil de professor</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="teacher-hourly-rate">Valor hora (R$)</Label>
            <Input
              id="teacher-hourly-rate"
              type="number"
              min="0"
              max="999999.99"
              step="0.01"
              required
              value={hourlyRate}
              onChange={(event) => setHourlyRate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teacher-cnpj">CNPJ</Label>
            <Input
              id="teacher-cnpj"
              required
              inputMode="numeric"
              maxLength={14}
              pattern="[0-9]{14}"
              title="Informe os 14 dígitos do CNPJ"
              value={cnpj}
              onChange={(event) => setCnpj(event.target.value.replace(/\D/g, ""))}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="teacher-bio">Biografia</Label>
            <textarea
              id="teacher-bio"
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
            />
          </div>
        </div>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Idiomas e níveis</legend>
          {levels.isLoading || languages.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando idiomas e níveis...</p>
          ) : levels.isError || languages.isError ? (
            <div role="alert" className="space-y-2 text-sm">
              <p>Não foi possível carregar os idiomas e níveis.</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void levels.refetch();
                  void languages.refetch();
                }}
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {levels.data?.results.map((level) => (
                <label
                  key={level.id}
                  className="flex items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedLevels.includes(level.id)}
                    onChange={(event) =>
                      setSelectedLevels((current) =>
                        event.target.checked
                          ? [...current, level.id]
                          : current.filter((id) => id !== level.id),
                      )
                    }
                  />
                  {languages.data?.find((language) => language.id === level.language)?.name ??
                    "Idioma"}{" "}
                  - {level.level}
                </label>
              ))}
              {levels.data?.results.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum nível de idioma disponível.</p>
              )}
            </div>
          )}
        </fieldset>
      </fieldset>
      {save.isError && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage(save.error)}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={save.isPending}
          onClick={() => {
            setIsEditing(false);
            save.reset();
          }}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={
            save.isPending ||
            levels.isLoading ||
            languages.isLoading ||
            levels.isError ||
            languages.isError
          }
        >
          {save.isPending
            ? "Salvando..."
            : profile
              ? "Salvar perfil de professor"
              : "Criar perfil de professor"}
        </Button>
      </div>
    </form>
  );
}
