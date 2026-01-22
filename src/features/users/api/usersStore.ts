import { randomUUID } from "crypto";
import type { User, UserRole, UserStatus } from "@/features/users/types/user";
import type { UserFormValues } from "@/features/users/schemas/userSchema";

let users: User[] = [
  {
    id: "1",
    name: "Ana Souza",
    email: "ana.souza@veli.com",
    role: "admin",
    status: "active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Bruno Costa",
    email: "bruno.costa@veli.com",
    role: "staff",
    status: "active",
    createdAt: new Date().toISOString(),
  },
];

function normalizeRole(role: UserRole) {
  return role;
}

function normalizeStatus(status: UserStatus) {
  return status;
}

export function listUsers() {
  return users;
}

export function getUserById(id: string) {
  return users.find((user) => user.id === id) ?? null;
}

export function createUser(payload: UserFormValues) {
  const newUser: User = {
    id: randomUUID(),
    name: payload.name,
    email: payload.email.toLowerCase(),
    role: normalizeRole(payload.role),
    status: normalizeStatus(payload.status),
    createdAt: new Date().toISOString(),
  };

  users = [newUser, ...users];
  return newUser;
}

export function updateUser(id: string, payload: UserFormValues) {
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) {
    return null;
  }

  const updated: User = {
    ...users[index],
    name: payload.name,
    email: payload.email.toLowerCase(),
    role: normalizeRole(payload.role),
    status: normalizeStatus(payload.status),
  };

  users[index] = updated;
  return updated;
}

export function deleteUser(id: string) {
  const existing = getUserById(id);
  if (!existing) {
    return null;
  }
  users = users.filter((user) => user.id !== id);
  return existing;
}
