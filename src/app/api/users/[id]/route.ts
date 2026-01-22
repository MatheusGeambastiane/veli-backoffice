import { NextResponse } from "next/server";
import { deleteUser, getUserById, updateUser } from "@/features/users/api/usersStore";
import { userSchema } from "@/features/users/schemas/userSchema";

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: RouteContext) {
  const user = getUserById(params.id);
  if (!user) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const payload = await request.json();
  const parsed = userSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload", errors: parsed.error.flatten() }, { status: 400 });
  }

  const user = updateUser(params.id, parsed.data);
  if (!user) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = deleteUser(params.id);
  if (!user) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
