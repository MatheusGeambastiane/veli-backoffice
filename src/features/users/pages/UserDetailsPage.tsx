"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { Check, Pencil, X } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import {
  useDashboardUserById,
  usePatchStudentProfile,
  usePatchTeacherProfile,
  useUpdateDashboardUser,
} from "@/features/users/queries/usersQueries";
import type { DashboardUserDetails } from "@/features/users/types/dashboardUserDetails";

type UserDetailsPageProps = {
  userId: string;
};

type PersonalFormState = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  cpf: string;
  date_of_birth: string;
  gender: string;
  role: string;
};

type TeacherFormState = {
  profileId: number | null;
  hourly_rate: string;
  bio: string;
  cnpj: string;
  langLevelIds: number[];
};

type StudentFormState = {
  profileId: number | null;
  bio: string;
  languageIds: number[];
  languageIdsText: string;
};

const DEFAULT_PERSONAL_FORM: PersonalFormState = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  cpf: "",
  date_of_birth: "",
  gender: "",
  role: "",
};

const DEFAULT_TEACHER_FORM: TeacherFormState = {
  profileId: null,
  hourly_rate: "",
  bio: "",
  cnpj: "",
  langLevelIds: [],
};

const DEFAULT_STUDENT_FORM: StudentFormState = {
  profileId: null,
  bio: "",
  languageIds: [],
  languageIdsText: "",
};

function parseIds(value: string) {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function createFormData(payload: PersonalFormState) {
  const formData = new FormData();
  (Object.keys(payload) as Array<keyof PersonalFormState>).forEach((key) => {
    const value = payload[key] ?? "";
    if (key === "gender") {
      formData.append(key, normalizeGenderCode(value));
      return;
    }
    if (key === "role") {
      formData.append(key, normalizeRoleCode(value));
      return;
    }
    formData.append(key, value);
  });
  return formData;
}

function roleLabel(role?: string | null) {
  if (role === "student") return "Estudante";
  if (role === "teacher") return "Professor";
  if (role === "manager") return "Gerente";
  return role ?? "-";
}

function normalizeRoleCode(role?: string | null) {
  if (!role) return "";
  const normalized = role.toLowerCase();
  if (normalized === "estudante") return "student";
  if (normalized === "professor") return "teacher";
  if (normalized === "gerente") return "manager";
  return role;
}

export function UserDetailsPage({ userId }: UserDetailsPageProps) {
  const { data, isLoading, isError } = useDashboardUserById(userId);
  const updateUser = useUpdateDashboardUser(userId);
  const patchTeacherProfile = usePatchTeacherProfile(userId);
  const patchStudentProfile = usePatchStudentProfile(userId);
  const [activeTab, setActiveTab] = useState<"personal" | "profile">("personal");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [personalForm, setPersonalForm] = useState<PersonalFormState>(DEFAULT_PERSONAL_FORM);
  const [teacherForm, setTeacherForm] = useState<TeacherFormState>(DEFAULT_TEACHER_FORM);
  const [studentForm, setStudentForm] = useState<StudentFormState>(DEFAULT_STUDENT_FORM);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const profilePicInputRef = useRef<HTMLInputElement | null>(null);

  const fullName = useMemo(() => {
    if (!data) return "";
    const name = `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();
    return name || data.username || data.email;
  }, [data]);

  useEffect(() => {
    if (!data) return;
    setPersonalForm({
      username: data.username ?? "",
      email: data.email ?? "",
      first_name: data.first_name ?? "",
      last_name: data.last_name ?? "",
      cpf: data.cpf ?? "",
      date_of_birth: data.date_of_birth ?? "",
      gender: normalizeGenderCode(data.gender),
      role: normalizeRoleCode(data.role),
    });
    if (profilePicPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profilePicPreview);
    }
    setProfilePicPreview(data.profile_pic ?? null);
    setProfilePicFile(null);

    if (data.teacher_profile) {
      setTeacherForm({
        profileId: data.teacher_profile.id,
        hourly_rate: data.teacher_profile.hourly_rate ?? "",
        bio: data.teacher_profile.bio ?? "",
        cnpj: data.teacher_profile.cnpj ?? "",
        langLevelIds: data.teacher_profile.lang_levels.map((level) => level.id),
      });
    } else {
      setTeacherForm(DEFAULT_TEACHER_FORM);
    }

    if (data.student_profile) {
      const ids = data.student_profile.languages.map((language) => language.id);
      setStudentForm({
        profileId: data.student_profile.id,
        bio: data.student_profile.bio ?? "",
        languageIds: ids,
        languageIdsText: ids.join(", "),
      });
    } else {
      setStudentForm(DEFAULT_STUDENT_FORM);
    }
  }, [data]);

  const profileTabLabel =
    data?.role === "teacher"
      ? "Perfil do professor"
      : data?.role === "student"
        ? "Perfil do aluno"
        : "Perfil do usuario";

  const handleCancel = () => {
    if (!data) return;
    setIsEditing(false);
    setPersonalForm({
      username: data.username ?? "",
      email: data.email ?? "",
      first_name: data.first_name ?? "",
      last_name: data.last_name ?? "",
      cpf: data.cpf ?? "",
      date_of_birth: data.date_of_birth ?? "",
      gender: normalizeGenderCode(data.gender),
      role: normalizeRoleCode(data.role),
    });
    if (profilePicPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profilePicPreview);
    }
    setProfilePicPreview(data.profile_pic ?? null);
    setProfilePicFile(null);

    if (data.teacher_profile) {
      setTeacherForm({
        profileId: data.teacher_profile.id,
        hourly_rate: data.teacher_profile.hourly_rate ?? "",
        bio: data.teacher_profile.bio ?? "",
        cnpj: data.teacher_profile.cnpj ?? "",
        langLevelIds: data.teacher_profile.lang_levels.map((level) => level.id),
      });
    } else {
      setTeacherForm(DEFAULT_TEACHER_FORM);
    }

    if (data.student_profile) {
      const ids = data.student_profile.languages.map((language) => language.id);
      setStudentForm({
        profileId: data.student_profile.id,
        bio: data.student_profile.bio ?? "",
        languageIds: ids,
        languageIdsText: ids.join(", "),
      });
    } else {
      setStudentForm(DEFAULT_STUDENT_FORM);
    }
  };

  const handleSave = async () => {
    if (!data) return;
    setIsSaving(true);
    try {
      const formData = createFormData(personalForm);
      if (profilePicFile) {
        formData.append("profile_pic", profilePicFile);
      }
      await updateUser.mutateAsync(formData);

      if (data.role === "teacher" && teacherForm.profileId) {
        await patchTeacherProfile.mutateAsync({
          profileId: teacherForm.profileId,
          data: {
            user_id: data.id,
            hourly_rate: teacherForm.hourly_rate || null,
            lang_levels: teacherForm.langLevelIds,
            bio: teacherForm.bio || null,
            cnpj: teacherForm.cnpj || null,
          },
        });
      }

      if (data.role === "student" && studentForm.profileId) {
        await patchStudentProfile.mutateAsync({
          profileId: studentForm.profileId,
          data: {
            user_id: data.id,
            bio: studentForm.bio || null,
            languages: studentForm.languageIds,
          },
        });
      }

      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (profilePicPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(profilePicPreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setProfilePicFile(file);
    setProfilePicPreview(previewUrl);
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando usuario...</p>;
  }

  if (isError || !data) {
    return <p className="text-sm text-destructive">Usuario nao encontrado.</p>;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-6 rounded-3xl border border-border bg-card/90 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-2">
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
              <span className="text-xs text-muted-foreground">
                Clique na foto para alterar
              </span>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Perfil</p>
            <h1 className="text-2xl font-semibold text-foreground">{fullName}</h1>
            <p className="text-sm text-muted-foreground">@{data.username}</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {roleLabel(data.role)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.languages?.length ? (
            data.languages.map((language) => (
              <LanguageIcon
                key={language.id}
                src={language.lang_icon}
                label={language.name}
              />
            ))
          ) : (
            <span className="text-xs text-muted-foreground">Sem idiomas em destaque</span>
          )}
        </div>
      </div>

      <fieldset className="rounded-3xl border border-border bg-card shadow-sm">
        <legend className="sr-only">Dados do usuario</legend>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <TabButton
              isActive={activeTab === "personal"}
              onClick={() => setActiveTab("personal")}
            >
              Dados pessoais
            </TabButton>
            <TabButton
              isActive={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
            >
              {profileTabLabel}
            </TabButton>
          </div>
          <button
            type="button"
            onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={isEditing ? "Cancelar edicao" : "Editar dados do usuario"}
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-6">
          {activeTab === "personal" ? (
            <PersonalTab
              data={data}
              formState={personalForm}
              setFormState={setPersonalForm}
              isEditing={isEditing}
            />
          ) : (
            <ProfileTab
              data={data}
              teacherForm={teacherForm}
              setTeacherForm={setTeacherForm}
              studentForm={studentForm}
              setStudentForm={setStudentForm}
              isEditing={isEditing}
            />
          )}
        </div>

        {isEditing && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              <Check className="h-4 w-4" />
              {isSaving ? "Salvando..." : "Salvar alteracoes"}
            </Button>
          </div>
        )}
      </fieldset>
    </section>
  );
}

function PersonalTab({
  data,
  formState,
  setFormState,
  isEditing,
}: {
  data: DashboardUserDetails;
  formState: PersonalFormState;
  setFormState: Dispatch<SetStateAction<PersonalFormState>>;
  isEditing: boolean;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Field
        label="Username"
        value={formState.username}
        isEditing={isEditing}
        onChange={(value) => setFormState((current) => ({ ...current, username: value }))}
      />
      <Field
        label="Email"
        value={formState.email}
        isEditing={isEditing}
        type="email"
        onChange={(value) => setFormState((current) => ({ ...current, email: value }))}
      />
      <Field
        label="Nome"
        value={formState.first_name}
        isEditing={isEditing}
        onChange={(value) => setFormState((current) => ({ ...current, first_name: value }))}
      />
      <Field
        label="Sobrenome"
        value={formState.last_name}
        isEditing={isEditing}
        onChange={(value) => setFormState((current) => ({ ...current, last_name: value }))}
      />
      <Field
        label="CPF"
        value={formState.cpf}
        isEditing={isEditing}
        onChange={(value) => setFormState((current) => ({ ...current, cpf: value }))}
      />
      <Field
        label="Data de nascimento"
        value={formState.date_of_birth}
        isEditing={isEditing}
        placeholder="01/01/2000"
        onChange={(value) => setFormState((current) => ({ ...current, date_of_birth: value }))}
      />
      <GenderField
        value={formState.gender}
        isEditing={isEditing}
        onChange={(value) => setFormState((current) => ({ ...current, gender: value }))}
      />
      <RoleField
        value={formState.role}
        isEditing={isEditing}
        onChange={(value) => setFormState((current) => ({ ...current, role: value }))}
      />
    </div>
  );
}

function ProfileTab({
  data,
  teacherForm,
  setTeacherForm,
  studentForm,
  setStudentForm,
  isEditing,
}: {
  data: DashboardUserDetails;
  teacherForm: TeacherFormState;
  setTeacherForm: Dispatch<SetStateAction<TeacherFormState>>;
  studentForm: StudentFormState;
  setStudentForm: Dispatch<SetStateAction<StudentFormState>>;
  isEditing: boolean;
}) {
  if (data.role === "teacher") {
    if (!data.teacher_profile) {
      return <p className="text-sm text-muted-foreground">Nenhum perfil de professor cadastrado.</p>;
    }

    const langLevels = data.teacher_profile.lang_levels;

    return (
      <div className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Valor hora"
            value={teacherForm.hourly_rate}
            isEditing={isEditing}
            onChange={(value) => setTeacherForm((current) => ({ ...current, hourly_rate: value }))}
          />
          <Field
            label="CNPJ"
            value={teacherForm.cnpj}
            isEditing={isEditing}
            onChange={(value) => setTeacherForm((current) => ({ ...current, cnpj: value }))}
          />
          <Field
            label="Bio"
            value={teacherForm.bio}
            isEditing={isEditing}
            onChange={(value) => setTeacherForm((current) => ({ ...current, bio: value }))}
          />
        </div>

        <div className="space-y-3">
          <Label>Niveis de idioma</Label>
          {langLevels.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem niveis cadastrados.</p>
          ) : isEditing ? (
            <div className="grid gap-2 md:grid-cols-2">
              {langLevels.map((level) => (
                <label
                  key={level.id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={teacherForm.langLevelIds.includes(level.id)}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setTeacherForm((current) => ({
                        ...current,
                        langLevelIds: checked
                          ? [...current.langLevelIds, level.id]
                          : current.langLevelIds.filter((id) => id !== level.id),
                      }));
                    }}
                  />
                  <span className="text-muted-foreground">
                    {level.language.name} - {level.level}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {langLevels.map((level) => (
                <span
                  key={level.id}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground"
                >
                  {level.language.name} - {level.level}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (data.role === "student") {
    if (!data.student_profile) {
      return <p className="text-sm text-muted-foreground">Nenhum perfil de aluno cadastrado.</p>;
    }

    return (
      <div className="space-y-6">
        <Field
          label="Bio"
          value={studentForm.bio}
          isEditing={isEditing}
          onChange={(value) => setStudentForm((current) => ({ ...current, bio: value }))}
        />

        <div className="space-y-3">
          <Label>Idiomas</Label>
          {isEditing ? (
            <Input
              value={studentForm.languageIdsText}
              onChange={(event) => {
                const value = event.target.value;
                setStudentForm((current) => ({
                  ...current,
                  languageIdsText: value,
                  languageIds: parseIds(value),
                }));
              }}
              placeholder="IDs separados por virgula"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.student_profile.languages.map((language) => (
                <span
                  key={language.id}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground"
                >
                  {language.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">Perfil nao disponivel.</p>;
}

function Field({
  label,
  value,
  isEditing,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  onChange?: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {isEditing && onChange ? (
        <Input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <div className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
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
  if (normalized === "N") return "Nao-binario";
  if (normalized === "O") return "Outro";
  if (normalized === "U") return "Prefiro nao dizer";
  return gender ?? "-";
}

function normalizeGenderCode(gender?: string | null) {
  if (!gender) return "";
  if (gender === "M" || gender === "F" || gender === "N" || gender === "O" || gender === "U") {
    return gender;
  }
  const normalized = gender.toLowerCase();
  if (normalized === "masculino") return "M";
  if (normalized === "feminino") return "F";
  if (normalized === "não-binário" || normalized === "nao-binario" || normalized === "nao binario") {
    return "N";
  }
  if (normalized === "outro") return "O";
  if (normalized === "prefiro não dizer" || normalized === "prefiro nao dizer") return "U";
  return gender;
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
          <option value="M">Masculino</option>
          <option value="F">Feminino</option>
          <option value="N">Nao-binario</option>
          <option value="O">Outro</option>
          <option value="U">Prefiro nao dizer</option>
        </select>
      ) : (
        <div className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
          {genderLabel(value)}
        </div>
      )}
    </div>
  );
}

function RoleField({
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
      <Label>Perfil</Label>
      {isEditing ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-2xl border border-border bg-background px-3 text-sm text-foreground"
        >
          <option value="student">Estudante</option>
          <option value="teacher">Professor</option>
          <option value="manager">Gerente</option>
        </select>
      ) : (
        <div className="rounded-2xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
          {roleLabel(value)}
        </div>
      )}
    </div>
  );
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
      className={[
        "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted/40 text-muted-foreground hover:text-foreground",
      ].join(" ")}
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
  if (src) {
    return (
      <button
        type="button"
        onClick={isEditable ? onClick : undefined}
        disabled={!isEditable}
        className={[
          "relative h-16 w-16 overflow-hidden rounded-3xl",
          isEditable ? "cursor-pointer ring-2 ring-transparent hover:ring-primary/40" : "cursor-default",
        ].join(" ")}
        aria-label={isEditable ? "Alterar foto de perfil" : "Foto de perfil"}
      >
        <img src={src} alt={name} className="h-full w-full object-cover" />
      </button>
    );
  }

  const initial = name.charAt(0).toUpperCase();
  return (
    <button
      type="button"
      onClick={isEditable ? onClick : undefined}
      disabled={!isEditable}
      className={[
        "flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-lg font-semibold text-primary",
        isEditable ? "cursor-pointer ring-2 ring-transparent hover:ring-primary/40" : "cursor-default",
      ].join(" ")}
      aria-label={isEditable ? "Alterar foto de perfil" : "Foto de perfil"}
    >
      {initial || "U"}
    </button>
  );
}

function LanguageIcon({ src, label }: { src: string | null; label: string }) {
  if (!src) {
    return (
      <span className="rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground">
        {label}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={label}
      title={label}
      className="h-10 w-10 rounded-full border border-border object-cover"
    />
  );
}
