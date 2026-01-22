import { NextResponse } from "next/server";
import { createUser, listUsers } from "@/features/users/api/usersStore";
import { userSchema } from "@/features/users/schemas/userSchema";

export async function GET() {
  return NextResponse.json(listUsers());
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = userSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload", errors: parsed.error.flatten() }, { status: 400 });
  }

  const user = createUser(parsed.data);
  return NextResponse.json(user, { status: 201 });
}
