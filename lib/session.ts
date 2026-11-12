export const SESSION_COOKIE = "jt_session";
export const SESSION_SECONDS = 60 * 60 * 24 * 7;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error("AUTH_SECRET belum diisi di .env (minimal 16 karakter).");
  }
  return value;
}

async function sign(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function createSessionToken(): Promise<string> {
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return `${expires}.${await sign(`session:${expires}`)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expires, signature] = token.split(".");
  if (!expires || !signature) return false;
  if (!safeEqual(signature, await sign(`session:${expires}`))) return false;
  return Number(expires) > Math.floor(Date.now() / 1000);
}

export async function passwordMatches(input: string): Promise<boolean> {
  const expected = process.env.AUTH_PASSWORD;
  if (!expected) return false;
  return safeEqual(await sign(`password:${input}`), await sign(`password:${expected}`));
}