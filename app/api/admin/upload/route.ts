import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { isAdminRequest, unauthorized } from "@/lib/admin-guard";

const ALLOWED = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/svg+xml", ".svg"],
]);
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isAdminRequest())) return unauthorized();
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ningún archivo." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Solo se permiten imágenes JPG, PNG, WEBP, GIF o SVG." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen supera los 8 MB." }, { status: 400 });
  }
  const rawFolder = (form?.get("folder") as string) || "services";
  const validFolder = ["team", "services", "general", "avatars"].includes(rawFolder) ? rawFolder : "services";
  const dir = path.join(process.cwd(), "public", "uploads", validFolder);
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${randomBytes(4).toString("hex")}${ALLOWED.get(file.type)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buffer);
  return NextResponse.json({ ok: true, url: `/uploads/${validFolder}/${name}` });
}