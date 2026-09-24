import { NextResponse } from "next/server";
import { getSessionToken, isValidToken } from "@/lib/auth";

export async function isAdminRequest(): Promise<boolean> {
  const token = await getSessionToken();
  return token ? await isValidToken(token) : false;
}

export async function unauthorized(): Promise<NextResponse> {
  return NextResponse.json({ error: "No autorizado." }, { status: 401 });
}