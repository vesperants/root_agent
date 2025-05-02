// src/app/api/agent/route.ts

import { NextRequest, NextResponse } from 'next/server';

// POST handler for /api/agent
export async function POST(req: NextRequest) {
  // Parse the incoming message from the frontend
  const { message } = await req.json();

  // Send the message to the backend FastAPI endpoint
  try {
    const backendRes = await fetch('http://localhost:8000/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const data = await backendRes.json();
    // Return the backend's reply to the frontend
    return NextResponse.json({ reply: data.reply });
  } catch {
    // Handle errors gracefully
    return NextResponse.json({ reply: 'Agent error: Could not reach backend.' }, { status: 500 });
  }
}