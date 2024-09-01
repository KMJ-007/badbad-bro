import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  const { message } = await req.json();
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "assistant",
          content: "You are communicating with the user on a phone, so your answers should not be too long and go directly to the essence of the sentences.",
        },
        {
          role: "user",
          content: message,
        }
      ],
      model: "mixtral-8x7b-32768",
    });

    return NextResponse.json({ message: chatCompletion.choices[0]?.message?.content || "" });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}