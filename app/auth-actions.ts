"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_SECONDS,
  createSessionToken,
  passwordMatches,
} from "@/lib/session";

export async function login(formData: FormData) {
  const password = formData.get("password");

  if (typeof password !== "string" || !(await passwordMatches(password))) {
    // Jeda singkat untuk memperlambat tebak-tebakan kata sandi
    await new Promise((resolve) => setTimeout(resolve, 600));
    redirect("/login?error=1");
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });

  redirect("/");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}