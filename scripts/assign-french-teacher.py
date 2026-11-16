"""Associate the requested French classes with teacher profile 1 (user 3).

Run with the backend virtualenv's Python. Defaults to a preview; --apply writes.
Uses the backend settings/database selected by --settings. No credentials are
embedded in this script. It does not create users, profiles, or classes.
"""

import argparse
import os
from pathlib import Path
import sys
import unicodedata


CLASS_IDS = (10, 11, 12, 13, 22, 23, 24, 25, 26, 14, 15)
USER_ID = 3
PROFILE_ID = 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--backend", type=Path,
        default=Path(__file__).resolve().parents[2] / "veli-backend",
    )
    parser.add_argument("--settings", default="config.settings")
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    backend = args.backend.resolve()
    if not (backend / "manage.py").is_file():
        parser.error("--backend deve apontar para o diretório do backend Django.")
    sys.path.insert(0, str(backend))
    os.environ["DJANGO_SETTINGS_MODULE"] = args.settings

    import django

    django.setup()
    from django.db import transaction
    from django.utils import timezone
    from account.models import TeacherProfile
    from studentclasses.models import StudentClass

    with transaction.atomic():
        profile = TeacherProfile.objects.select_for_update().filter(pk=PROFILE_ID).first()
        if profile is None or profile.user_id != USER_ID:
            raise ValueError("O perfil de professor 1 não existe ou não pertence ao usuário 3.")

        classes = list(
            StudentClass.objects.select_for_update()
            .filter(pk__in=CLASS_IDS).order_by("pk")
        )
        missing = sorted(set(CLASS_IDS) - {item.pk for item in classes})
        if missing:
            raise ValueError(f"Turmas inexistentes: {missing}. Nenhuma alteração aplicada.")
        for item in classes:
            language = unicodedata.normalize("NFKD", item.course.language.name)
            language = "".join(c for c in language if not unicodedata.combining(c)).casefold().strip()
            if language not in {"frances", "francais", "french", "fr"}:
                raise ValueError(f"A turma {item.pk} não é de francês. Nenhuma alteração aplicada.")

        pending = [item.pk for item in classes if item.teacher_profile_id != PROFILE_ID]
        for item in classes:
            print(f"Turma {item.pk}: professor {item.teacher_profile_id} -> {PROFILE_ID}")
        if not args.apply:
            print(f"Prévia: {len(pending)} de {len(classes)} turmas precisam de alteração. Use --apply para gravar.")
            return

        updated = StudentClass.objects.filter(pk__in=pending).update(
            teacher_profile_id=PROFILE_ID, updated_at=timezone.now(),
        )
        if StudentClass.objects.filter(pk__in=CLASS_IDS, teacher_profile_id=PROFILE_ID).count() != len(CLASS_IDS):
            raise RuntimeError("Falha na verificação. A transação será revertida.")
    print(f"Concluído: {updated} turmas alteradas; as 11 turmas estão associadas ao perfil 1 do usuário 3.")


if __name__ == "__main__":
    main()
