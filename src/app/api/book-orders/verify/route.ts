// Book payments use the same signature check and PAID update as every other
// payment, so this reuses the shared handler. validUntil stays null for BOOK.
export const runtime = "nodejs";

export { POST } from "@/app/api/payments/verify/route";