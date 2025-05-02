// src/app/api/agent/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// POST handler for /api/agent
export async function POST(req: NextRequest) {
  const { message } = await req.json();

  const pythonScriptPath = path.resolve(process.cwd(), 'agent-backend', 'gemini_agent.py');

  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [pythonScriptPath, message]);

    let output = '';
    let error = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      error += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(NextResponse.json({ reply: output.trim() }));
      } else {
        resolve(NextResponse.json({ reply: 'Agent error: ' + error.trim() }, { status: 500 }));
      }
    });

    proc.on('error', (err) => {
      resolve(NextResponse.json({ reply: 'Script failed to start.' }, { status: 500 }));
    });
  });
}