import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.DEEPGRAM_API_KEY?.trim();

  if (!key) {
    console.error("[Deepgram] API key is missing");
    return NextResponse.json(
      { error: "DEEPGRAM_API_KEY is missing in .env" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      "https://api.deepgram.com/v1/auth/grant",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ttl_seconds: 60 }),
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Do not log the API key or temporary token.
      console.error("[Deepgram] Token request failed:", {
        status: res.status,
        error: data.err_msg || data.message || data.description || "Unknown error",
        code: data.err_code,
      });

      return NextResponse.json(
        { error: "Deepgram token request failed", status: res.status },
        { status: 502 }
      );
    }

    if (!data.access_token) {
      console.error("[Deepgram] Response did not contain an access token");

      return NextResponse.json(
        { error: "Invalid token response from Deepgram" },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { token: data.access_token },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(
      "[Deepgram] Request error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "Could not connect to Deepgram" },
      { status: 502 }
    );
  }
}