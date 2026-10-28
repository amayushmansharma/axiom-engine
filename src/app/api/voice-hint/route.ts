import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const groqKey = process.env.GROQ_API_KEY;
  const elevenKey = process.env.ELEVENLABS_API_KEY;

  if (!groqKey && !elevenKey) {
    return NextResponse.json(
      {
        status: 501,
        message: "No cloud voice credentials configured. Native browser Web Speech API is used locally.",
        fallback: "web_speech_api",
      },
      { status: 501 }
    );
  }

  return NextResponse.json({
    status: 200,
    message: "Voice hint service ready.",
  });
}
