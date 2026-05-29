"use client";

import {
  type ChangeEvent,
  type InputHTMLAttributes,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { Camera, Check, LoaderCircle, Pencil, Shield, UserRound, X } from "lucide-react";
import { HttpError } from "@/shared/lib/http/http";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import {
  useLanguageLevels,
  useLanguagesSimple,
} from "@/features/courses/queries/coursesQueries";
import type { LanguageLevel } from "@/features/courses/types/course";
import {
  useMyProfile,
  useUpdateMyProfile,
  useUpdateMyProfilePhoto,
} from "@/features/users/queries/usersQueries";
import type {
  DashboardMyProfileUpdatePayload,
  DashboardUserDetails,
} from "@/features/users/types/dashboardUserDetails";

type PersonalFormState = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  cpf: string;
  date_of_birth: string;
  gender: string;
  role: string;
};

type AddressFormState = {
  zip_code: string;
  street: string;
  address_number: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
};

type ProfessionalFormState = {
  hourly_rate: string;
  bio: string;
  cnpj: string;
  langLevelIds: number[];
};

const DEFAULT_PERSONAL_FORM: PersonalFormState = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  cpf: "",
  date_of_birth: "",
  gender: "",
  role: "",
};

const DEFAULT_ADDRESS_FORM: AddressFormState = {
  zip_code: "",
  street: "",
  address_number: "",
  neighborhood: "",
  city: "",
  state: "",
  country: "",
};

const DEFAULT_PROFESSIONAL_FORM: ProfessionalFormState = {
  hourly_rate: "",
  bio: "",
  cnpj: "",
  langLevelIds: [],
};

export function ProfilePage() {
  const { data, isLoading, isError } = useMyProfile();
  const updateProfile = useUpdateMyProfile();
  const updatePhoto = useUpdateMyProfilePhoto();
  const { data: languageLevels } = useLanguageLevels();
  const { data: languages } = useLanguagesSimple();
  const [activeTab, setActiveTab] = useState<"personal" | "professional">("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [personalForm, setPersonalForm] = useState<PersonalFormState>(DEFAULT_PERSONAL_FORM);
  const [addressForm, setAddressForm] = useState<AddressFormState>(DEFAULT_ADDRESS_FORM);
  const [professionalForm, setProfessionalForm] =
    useState<ProfessionalFormState>(DEFAULT_PROFESSIONAL_FORM);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const profilePicInputRef = useRef<HTMLInputElement | null>(null);

  const fullName = useMemo(() => {
    if (!data) return "";
    const name = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
    return name || data.username || data.email;
  }, [data]);
  const supportsProfessionalTab = data?.role === "teacher" || data?.role === "manager";
  const professionalLevelOptions = languageLevels?.results ?? [];
  const languageNameMap = useMemo(() => {
    return new Map((languages ?? []).map((language) => [language.id, language.name]));
  }, [languages]);

  useEffect(() => {
    if (!data) return;
    syncFormWithData(data, setPersonalForm, setAddressForm, setProfessionalForm);
    setProfilePicPreview(data.profile_pic ?? null);
    setProfilePicFile(null);
    setSaveError(null);
  }, [data]);

  useEffect(() => {
    return () => {
      if (profilePicPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(profilePicPreview);
      }
    };
  }, [profilePicPreview]);

  function handleCancel() {
    if (!data) return;
    if (profilePicPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profilePicPreview);
    }
    syncFormWithData(data, setPersonalForm, setAddressForm, setProfessionalForm);
    setProfilePicPreview(data.profile_pic ?? null);
    setProfilePicFile(null);
    setSaveError(null);
    setIsEditing(false);
  }

  async function handleSave() {
    if (!data) return;
    setSaveError(null);

    const payload: DashboardMyProfileUpdatePayload = {
      user: {
        username: personalForm.username.trim(),
        email: personalForm.email.trim(),
        first_name: personalForm.first_name.trim(),
        last_name: personalForm.last_name.trim(),
        phone: personalForm.phone.trim(),
        cpf: onlyDigits(personalForm.cpf),
        date_of_birth: normalizeDateForApi(personalForm.date_of_birth),
        gender: normalizeGenderCode(personalForm.gender),
        role: normalizeRoleCode(personalForm.role),
      },
      address: {
        zip_code: onlyDigits(addressForm.zip_code) || null,
        street: normalizeOptionalText(addressForm.street),
        address_number: normalizeOptionalText(addressForm.address_number),
        neighborhood: normalizeOptionalText(addressForm.neighborhood),
        city: normalizeOptionalText(addressForm.city),
        state: normalizeOptionalText(addressForm.state),
        country: normalizeOptionalText(addressForm.country),
      },
      ...(supportsProfessionalTab
        ? {
            teacher_profile: {
              hourly_rate: professionalForm.hourly_rate.trim() || null,
              lang_levels: professionalForm.langLevelIds,
              bio: professionalForm.bio.trim() || null,
              cnpj: onlyDigits(professionalForm.cnpj) || null,
            },
          }
        : {}),
    };

    try {
      await updateProfile.mutateAsync(payload);

      if (profilePicFile) {
        const formData = new FormData();
        formData.append("profile_pic", profilePicFile);
        await updatePhoto.mutateAsync(formData);
      }

      setIsEditing(false);
      setProfilePicFile(null);
    } catch (error) {
      setSaveError(normalizeErrorMessage(error));
    }
  }

  function handleProfilePicChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (profilePicPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profilePicPreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setProfilePicFile(file);
    setProfilePicPreview(previewUrl);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 animate-pulse rounded-3xl bg-muted" />
        <div className="h-96 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-3xl border border-destructive/40 bg-destructive/10 px-6 py-6 text-sm text-destructive">
        Nao foi possivel carregar o perfil.
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-border bg-card/90 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex flex-col items-center gap-2">
              <ProfileAvatar
                src={profilePicPreview ?? data.profile_pic}
                name={fullName}
                isEditable={isEditing}
                onClick={() => profilePicInputRef.current?.click()}
              />
              <input
                ref={profilePicInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePicChange}
              />
              {isEditing && (
                <button
                  type="button"
                  onClick={() => profilePicInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Alterar foto
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Meu perfil</p>
                <h1 className="text-3xl font-semibold text-foreground">{fullName}</h1>
                <p className="text-sm text-muted-foreground">@{data.username}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  {roleLabel(data.role)}
                </span>
                {data.languages?.map((language) => (
                  <LanguageTag
                    key={language.id}
                    label={language.name}
                    icon={language.lang_icon}
                  />
                ))}
                {data.languages?.length === 0 && (
                  <span className="text-xs text-muted-foreground">Sem idiomas em destaque</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}
              disabled={updateProfile.isPending || updatePhoto.isPending}
              className="rounded-2xl"
            >
              {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {isEditing ? "Cancelar" : "Editar perfil"}
            </Button>
            {isEditing && (
              <Button
                type="button"
                onClick={handleSave}
                disabled={updateProfile.isPending || updatePhoto.isPending}
                className="rounded-2xl"
              >
                <Check className="h-4 w-4" />
                {updateProfile.isPending || updatePhoto.isPending ? "Salvando..." : "Salvar"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <TabButton isActive={activeTab === "personal"} onClick={() => setActiveTab("personal")}>
              Dados pessoais
            </TabButton>
            {supportsProfessionalTab && (
              <TabButton
                isActive={activeTab === "professional"}
                onClick={() => setActiveTab("professional")}
              >
                Perfil profissional
              </TabButton>
            )}
          </div>
        </div>

        <div className="px-6 py-6">
          {activeTab === "personal" ? (
            <PersonalAndAddressTab
              personalForm={personalForm}
              setPersonalForm={setPersonalForm}
              addressForm={addressForm}
              setAddressForm={setAddressForm}
              isEditing={isEditing}
            />
          ) : (
            <ProfessionalTab
              data={data}
              formState={professionalForm}
              setFormState={setProfessionalForm}
              isEditing={isEditing}
              languageLevels={professionalLevelOptions}
              languageNameMap={languageNameMap}
            />
          )}
        </div>
      </div>

      {saveError && (
        <div className="rounded-3xl border border-destructive/40 bg-destructive/10 px-6 py-4 text-sm text-destructive">
          {saveError}
        </div>
      )}
    </section>
  );
}

function PersonalAndAddressTab({
  personalForm,
  setPersonalForm,
  addressForm,
  setAddressForm,
  isEditing,
}: {
  personalForm: PersonalFormState;
  setPersonalForm: Dispatch<SetStateAction<PersonalFormState>>;
  addressForm: AddressFormState;
  setAddressForm: Dispatch<SetStateAction<AddressFormState>>;
  isEditing: boolean;
}) {
  const [cepLookupState, setCepLookupState] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [cepLookupMessage, setCepLookupMessage] = useState<string | null>(null);
  const lastLoadedCepRef = useRef<string | null>(null);
  const cepAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => cepAbortControllerRef.current?.abort();
  }, []);

  async function loadAddressByCep(cepDigits: string) {
    if (lastLoadedCepRef.current === cepDigits) return;

    cepAbortControllerRef.current?.abort();
    const abortController = new AbortController();
    cepAbortControllerRef.current = abortController;
    setCepLookupState("loading");
    setCepLookupMessage(null);

    try {
      const address = await fetchViaCepAddress(cepDigits, abortController.signal);
      if (abortController.signal.aborted) return;
      lastLoadedCepRef.current = cepDigits;
      setAddressForm((current) => ({
        ...current,
        street: address.street || current.street,
        neighborhood: address.neighborhood || current.neighborhood,
        city: address.city || current.city,
        state: address.state || current.state,
        country: address.country,
      }));
      setCepLookupState("success");
      setCepLookupMessage("Endereco carregado pelo CEP.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setCepLookupState("error");
      setCepLookupMessage(error instanceof Error ? error.message : "Nao foi possivel buscar o CEP.");
    }
  }

  function handleCepChange(value: string) {
    const nextCep = formatCep(value);
    const nextCepDigits = onlyDigits(nextCep);
    setAddressForm((current) => ({ ...current, zip_code: nextCep }));

    if (!nextCepDigits) {
      cepAbortControllerRef.current?.abort();
      lastLoadedCepRef.current = null;
      setCepLookupState("idle");
      setCepLookupMessage(null);
      return;
    }

    if (nextCepDigits.length < 8) {
      cepAbortControllerRef.current?.abort();
      setCepLookupState("idle");
      setCepLookupMessage(null);
      return;
    }

    void loadAddressByCep(nextCepDigits);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Dados pessoais</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Username"
            value={personalForm.username}
            isEditing={isEditing}
            onChange={(value) => setPersonalForm((current) => ({ ...current, username: value }))}
          />
          <Field
            label="Email"
            value={personalForm.email}
            isEditing={isEditing}
            type="email"
            onChange={(value) => setPersonalForm((current) => ({ ...current, email: value }))}
          />
          <Field
            label="Nome"
            value={personalForm.first_name}
            isEditing={isEditing}
            onChange={(value) => setPersonalForm((current) => ({ ...current, first_name: value }))}
          />
          <Field
            label="Sobrenome"
            value={personalForm.last_name}
            isEditing={isEditing}
            onChange={(value) => setPersonalForm((current) => ({ ...current, last_name: value }))}
          />
          <Field
            label="Telefone"
            value={personalForm.phone}
            isEditing={isEditing}
            onChange={(value) => setPersonalForm((current) => ({ ...current, phone: value }))}
          />
          <Field
            label="CPF"
            value={personalForm.cpf}
            isEditing={isEditing}
            onChange={(value) =>
              setPersonalForm((current) => ({ ...current, cpf: formatCpf(value) }))
            }
            inputMode="numeric"
          />
          <Field
            label="Data de nascimento"
            value={personalForm.date_of_birth}
            isEditing={isEditing}
            type="date"
            onChange={(value) =>
              setPersonalForm((current) => ({ ...current, date_of_birth: value }))
            }
          />
          <GenderField
            value={personalForm.gender}
            isEditing={isEditing}
            onChange={(value) => setPersonalForm((current) => ({ ...current, gender: value }))}
          />
          <Field label="Perfil" value={roleLabel(personalForm.role)} isEditing={false} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Endereco</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>CEP</Label>
            {isEditing ? (
              <>
                <div className="relative">
                  <Input
                    value={addressForm.zip_code}
                    placeholder="00000-000"
                    inputMode="numeric"
                    onChange={(event) => handleCepChange(event.target.value)}
                    className="rounded-2xl pr-10"
                  />
                  {cepLookupState === "loading" && (
                    <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                {cepLookupMessage && (
                  <p
                    className={cn(
                      "text-xs",
                      cepLookupState === "error" ? "text-destructive" : "text-muted-foreground"
                    )}
                  >
                    {cepLookupMessage}
                  </p>
                )}
              </>
            ) : (
              <div className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
                {addressForm.zip_code || "-"}
              </div>
            )}
          </div>
          <Field
            label="Rua"
            value={addressForm.street}
            isEditing={isEditing}
            onChange={(value) => setAddressForm((current) => ({ ...current, street: value }))}
          />
          <Field
            label="Numero"
            value={addressForm.address_number}
            isEditing={isEditing}
            onChange={(value) =>
              setAddressForm((current) => ({ ...current, address_number: value }))
            }
          />
          <Field
            label="Bairro"
            value={addressForm.neighborhood}
            isEditing={isEditing}
            onChange={(value) =>
              setAddressForm((current) => ({ ...current, neighborhood: value }))
            }
          />
          <Field
            label="Cidade"
            value={addressForm.city}
            isEditing={isEditing}
            onChange={(value) => setAddressForm((current) => ({ ...current, city: value }))}
          />
          <Field
            label="Estado"
            value={addressForm.state}
            isEditing={isEditing}
            onChange={(value) => setAddressForm((current) => ({ ...current, state: value }))}
          />
          <Field
            label="Pais"
            value={addressForm.country}
            isEditing={isEditing}
            onChange={(value) => setAddressForm((current) => ({ ...current, country: value }))}
          />
        </div>
      </div>
    </div>
  );
}

function ProfessionalTab({
  data,
  formState,
  setFormState,
  isEditing,
  languageLevels,
  languageNameMap,
}: {
  data: DashboardUserDetails;
  formState: ProfessionalFormState;
  setFormState: Dispatch<SetStateAction<ProfessionalFormState>>;
  isEditing: boolean;
  languageLevels: LanguageLevel[];
  languageNameMap: Map<number, string>;
}) {
  const hasProfessionalProfile = Boolean(data.teacher_profile);

  return (
    <div className="space-y-6">
      {!hasProfessionalProfile && (
        <div className="rounded-2xl border border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
          Nenhum perfil profissional cadastrado. Ative a edicao para criar essas informacoes.
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          label="Valor hora"
          value={formState.hourly_rate}
          isEditing={false}
        />
        <Field
          label="CNPJ"
          value={formState.cnpj}
          isEditing={isEditing}
          onChange={(value) =>
            setFormState((current) => ({ ...current, cnpj: formatCnpj(value) }))
          }
          inputMode="numeric"
        />
        <TextAreaField
          label="Bio"
          value={formState.bio}
          isEditing={isEditing}
          onChange={(value) => setFormState((current) => ({ ...current, bio: value }))}
        />
      </div>

      <div className="space-y-3">
        <Label>Niveis profissionais</Label>
        {languageLevels.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem niveis disponiveis.</p>
        ) : isEditing ? (
          <div className="grid gap-2 md:grid-cols-2">
            {languageLevels.map((level) => {
              const checked = formState.langLevelIds.includes(level.id);
              return (
                <label
                  key={level.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      const isChecked = event.target.checked;
                      setFormState((current) => ({
                        ...current,
                        langLevelIds: isChecked
                          ? [...current.langLevelIds, level.id]
                          : current.langLevelIds.filter((id) => id !== level.id),
                      }));
                    }}
                  />
                  <span className="text-muted-foreground">
                    {languageNameMap.get(level.language) ?? `Idioma ${level.language}`} - {level.level}
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {formState.langLevelIds.length === 0 && (
              <span className="text-sm text-muted-foreground">Sem niveis selecionados.</span>
            )}
            {languageLevels
              .filter((level) => formState.langLevelIds.includes(level.id))
              .map((level) => (
                <span
                  key={level.id}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground"
                >
                  {languageNameMap.get(level.language) ?? `Idioma ${level.language}`} - {level.level}
                </span>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  isEditing,
  onChange,
  type = "text",
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  onChange?: (value: string) => void;
  type?: string;
  placeholder?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {isEditing && onChange ? (
        <Input
          type={type}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)}
          className="rounded-2xl"
        />
      ) : (
        <div className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
          {value || "-"}
        </div>
      )}
    </div>
  );
}

function TextAreaField({
  label,
  value,
  isEditing,
  onChange,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div className="space-y-2 md:col-span-2">
      <Label>{label}</Label>
      {isEditing && onChange ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-28 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      ) : (
        <div className="min-h-28 rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
          {value || "-"}
        </div>
      )}
    </div>
  );
}

function genderLabel(gender?: string | null) {
  const normalized = normalizeGenderCode(gender);
  if (normalized === "M") return "Masculino";
  if (normalized === "F") return "Feminino";
  return gender || "-";
}

function normalizeGenderCode(gender?: string | null) {
  if (!gender) return "";
  if (gender === "M" || gender === "F") return gender;
  const normalized = gender.toLowerCase();
  if (normalized === "masculino") return "M";
  if (normalized === "feminino") return "F";
  return gender;
}

function normalizeRoleCode(role?: string | null) {
  if (!role) return "";
  const normalized = role.toLowerCase();
  if (normalized === "professor") return "teacher";
  if (normalized === "gerente") return "manager";
  if (normalized === "estudante") return "student";
  return normalized;
}

function roleLabel(role?: string | null) {
  const normalized = normalizeRoleCode(role);
  if (normalized === "teacher") return "Professor";
  if (normalized === "manager") return "Gerente";
  if (normalized === "student") return "Estudante";
  return role ?? "-";
}

function normalizeDateForInput(value?: string | null) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parts = value.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return value;
}

function normalizeDateForApi(value: string) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parts = value.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return value;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function normalizeOptionalText(value: string) {
  const normalized = value.trim();
  return normalized || null;
}

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

async function fetchViaCepAddress(cep: string, signal: AbortSignal) {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal });

  if (!response.ok) {
    throw new Error("Nao foi possivel buscar o CEP.");
  }

  const data = (await response.json()) as ViaCepResponse;

  if (data.erro) {
    throw new Error("CEP nao encontrado.");
  }

  return {
    street: data.logradouro ?? "",
    neighborhood: data.bairro ?? "",
    city: data.localidade ?? "",
    state: data.uf ?? "",
    country: "Brasil",
  };
}

function syncFormWithData(
  data: DashboardUserDetails,
  setPersonalForm: Dispatch<SetStateAction<PersonalFormState>>,
  setAddressForm: Dispatch<SetStateAction<AddressFormState>>,
  setProfessionalForm: Dispatch<SetStateAction<ProfessionalFormState>>
) {
  setPersonalForm({
    username: data.username ?? "",
    email: data.email ?? "",
    first_name: data.first_name ?? "",
    last_name: data.last_name ?? "",
    phone: data.phone ?? "",
    cpf: formatCpf(data.cpf ?? ""),
    date_of_birth: normalizeDateForInput(data.date_of_birth),
    gender: normalizeGenderCode(data.gender),
    role: normalizeRoleCode(data.role),
  });

  setAddressForm({
    zip_code: formatCep(data.address?.zip_code ?? ""),
    street: data.address?.street ?? "",
    address_number: data.address?.address_number ?? "",
    neighborhood: data.address?.neighborhood ?? "",
    city: data.address?.city ?? "",
    state: data.address?.state ?? "",
    country: data.address?.country ?? "",
  });

  setProfessionalForm({
    hourly_rate: data.teacher_profile?.hourly_rate ?? "",
    bio: data.teacher_profile?.bio ?? "",
    cnpj: formatCnpj(data.teacher_profile?.cnpj ?? ""),
    langLevelIds: data.teacher_profile?.lang_levels.map((level) => level.id) ?? [],
  });
}

function TabButton({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted/40 text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function ProfileAvatar({
  src,
  name,
  isEditable,
  onClick,
}: {
  src: string | null;
  name: string;
  isEditable?: boolean;
  onClick?: () => void;
}) {
  const frameClass = cn(
    "relative h-24 w-24 overflow-hidden rounded-full border-4 border-primary/20 bg-background shadow-sm",
    isEditable && "cursor-pointer transition-transform hover:scale-[1.02]"
  );

  if (src) {
    return (
      <button
        type="button"
        onClick={isEditable ? onClick : undefined}
        disabled={!isEditable}
        className={frameClass}
        aria-label={isEditable ? "Alterar foto de perfil" : "Foto de perfil"}
      >
        <img src={src} alt={name} className="h-full w-full object-cover" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={isEditable ? onClick : undefined}
      disabled={!isEditable}
      className={cn(frameClass, "flex items-center justify-center text-3xl font-semibold text-primary")}
      aria-label={isEditable ? "Alterar foto de perfil" : "Foto de perfil"}
    >
      {name.charAt(0).toUpperCase() || "U"}
    </button>
  );
}

function LanguageTag({ label, icon }: { label: string; icon: string | null }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground">
      {icon ? <img src={icon} alt={label} className="h-4 w-4 rounded-full object-cover" /> : null}
      {label}
    </span>
  );
}

function GenderField({
  value,
  isEditing,
  onChange,
}: {
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Genero</Label>
      {isEditing ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="F">Feminino</option>
          <option value="M">Masculino</option>
        </select>
      ) : (
        <div className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
          {genderLabel(value)}
        </div>
      )}
    </div>
  );
}

function normalizeErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    const details = error.details;
    if (typeof details === "string") return details;
    if (details && typeof details === "object") {
      if ("detail" in details && typeof details.detail === "string") {
        return details.detail;
      }
      const values = Object.values(details)
        .flatMap((value) => (Array.isArray(value) ? value.map(String) : [String(value)]))
        .filter(Boolean);
      if (values.length) return values.join(" ");
    }
  }
  return "Nao foi possivel salvar o perfil.";
}
