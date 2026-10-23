import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { Product } from "@/generated/prisma";
import { verifyDownloadPass } from "@/lib/downloadPass";
import { getPlanStatus } from "@/lib/planAccess";

export const runtime = "nodejs";

// Private folder at the project root. It is NOT inside /public, so these
// files can only be reached through this route.
const DIR = path.join(process.cwd(), "private", "worksheets");

const FILES: Record<string, { file: string; name: string }> = {
  questions: { file: "questions.pdf", name: "2212-MCE-Questions.pdf" },
  answers: { file: "answers.pdf", name: "2212-MCE-Answers.pdf" },
};

const fail = (message: string, status: number) =>
  NextResponse.json({ success: false, message }, { status });

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ file: string }> },
) {
  try {
    const { file } = await params;

    if (!Object.prototype.hasOwnProperty.call(FILES, file)) {
      return fail("File not found", 404);
    }
    const entry = FILES[file];

    const pass = req.nextUrl.searchParams.get("pass") || "";
    const email = verifyDownloadPass(pass);

    if (!email) {
      return fail(
        "This download link has expired. Please open the window again and enter your email.",
        401,
      );
    }

    // The pass is short-lived, but check the plan again so an expired plan never downloads
    const plan = await getPlanStatus(email, Product.WORKSHEET);
    if (plan.status !== "PAID") return fail("No active plan found", 403);

    const bytes = await readFile(path.join(DIR, entry.file));

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${entry.name}"`,
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.error("Worksheet PDF is missing from private/worksheets");
      return fail("This file is not available yet", 404);
    }
    console.error("Download Error:", error);
    return fail("Something went wrong", 500);
  }
}