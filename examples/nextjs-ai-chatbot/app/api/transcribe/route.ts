import { NextRequest } from 'next/server';
import { experimental_transcribe as transcribe } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('audio') as File | null;
    if (file && file.size < 20000) {
      return Response.json({ text: '' });
    }
    if (!file)
      return new Response(JSON.stringify({ error: 'No audio' }), {
        status: 400,
      });

    const result = await transcribe({
      model: openai.transcription('gpt-4o-transcribe'),
      audio: new Uint8Array(await file.arrayBuffer()),
    });

    return Response.json({ text: result.text ?? '' });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Transcription failed' }), {
      status: 500,
    });
  }
}
