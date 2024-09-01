import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.DEEPGRAM_API_KEY;
  console.log({key});
  return NextResponse.json({ key });
}