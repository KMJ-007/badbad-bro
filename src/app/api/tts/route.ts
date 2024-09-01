import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
  const { text } = await req.json();

  try {
    if (!process.env.NEETS_API_KEY) {
      return NextResponse.json({ error: "NEETS_API_KEY is not set" }, { status: 500 });
    }

    const response = await axios.post("https://api.neets.ai/v1/tts", 
      {
        text,
        voice_id: 'us-female-2',
        params: { model: 'style-diff-500' }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEETS_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );

    return new NextResponse(response.data, {
      headers: { 'Content-Type': 'audio/mp3' }
    });
  } catch (error) {
    console.error("Error in TTS API:", error);
    return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 });
  }
}