import type { StudentClass } from "@/features/classes/types/class";

const weekdays: Record<string, string> = {
  mon: 'Segunda-feira', monday: 'Segunda-feira', tue: 'Terça-feira', tuesday: 'Terça-feira',
  wed: 'Quarta-feira', wednesday: 'Quarta-feira', thu: 'Quinta-feira', thursday: 'Quinta-feira',
  fri: 'Sexta-feira', friday: 'Sexta-feira', sat: 'Sábado', saturday: 'Sábado', sun: 'Domingo', sunday: 'Domingo',
};

export function getClassName(studentClass: Pick<StudentClass, 'name' | 'course_name' | 'days_of_week' | 'time' | 'is_generic'>) {
  if (studentClass.name) return studentClass.name;
  const days = studentClass.days_of_week.map((day) => weekdays[day.toLowerCase()] ?? day).join(', ');
  return `${studentClass.course_name} · ${days} · ${studentClass.time.slice(0, 5)}${studentClass.is_generic ? ' · Genérica' : ''}`;
}
