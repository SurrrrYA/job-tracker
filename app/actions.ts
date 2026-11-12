"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Status } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function date(formData: FormData, key: string): Date | null {
  const value = text(formData, key);
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function status(formData: FormData): Status {
  const value = text(formData, "status");
  return value && value in Status ? (value as Status) : Status.APPLIED;
}

export async function createApplication(formData: FormData) {
  await requireSession();

  const company = text(formData, "company");
  const position = text(formData, "position");
  if (!company || !position) return;

  await prisma.application.create({
    data: {
      company,
      position,
      status: status(formData),
      source: text(formData, "source"),
      appliedAt: date(formData, "appliedAt") ?? new Date(),
      nextStep: text(formData, "nextStep"),
      nextDate: date(formData, "nextDate"),
      notes: text(formData, "notes"),
    },
  });

  revalidatePath("/");
}

export async function updateApplication(formData: FormData) {
  await requireSession();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  const company = text(formData, "company");
  const position = text(formData, "position");
  if (!company || !position) return;

  await prisma.application.update({
    where: { id },
    data: {
      company,
      position,
      status: status(formData),
      source: text(formData, "source"),
      appliedAt: date(formData, "appliedAt") ?? new Date(),
      nextStep: text(formData, "nextStep"),
      nextDate: date(formData, "nextDate"),
      notes: text(formData, "notes"),
    },
  });

  revalidatePath("/");
  redirect("/");
}

export async function updateStatus(formData: FormData) {
  await requireSession();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  await prisma.application.update({
    where: { id },
    data: { status: status(formData) },
  });

  revalidatePath("/");
}

export async function deleteApplication(formData: FormData) {
  await requireSession();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  await prisma.application.delete({ where: { id } });

  revalidatePath("/");
}