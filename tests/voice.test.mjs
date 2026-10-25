import assert from 'node:assert/strict';
import test from 'node:test';
import { sourceLoader } from './load-source.mjs';

async function configured(values, fetcher, run) {
  const previous = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  for (const [key, value] of Object.entries(values)) process.env[key] = value;
  globalThis.fetch = fetcher;
  try { await run(); }
  finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}

const speechRequest = text => new Request('http://localhost/api/speech', { method: 'POST', body: JSON.stringify({ text }) });
const recording = () => {
  const data = new FormData();
  data.set('audio', new File(['sample'], 'sample.webm', { type: 'audio/webm' }));
  return new Request('http://localhost/api/transcribe', { method: 'POST', body: data });
};

test('speech availability exposes no credentials; missing key never contacts ElevenLabs', async () => {
  const { GET, POST } = sourceLoader()('src/app/api/speech/route.ts');
  await configured({ ELEVENLABS_API_KEY: '' }, () => { throw Error('must not fetch'); }, async () => {
    assert.deepEqual(await GET().json(), { enabled: false });
    assert.equal((await POST(speechRequest('Hello'))).status, 503);
  });
  await configured({ ELEVENLABS_API_KEY: 'test-secret' }, () => { throw Error('must not fetch'); }, async () => {
    assert.deepEqual(await GET().json(), { enabled: true });
    assert.equal(GET().headers.get('cache-control'), 'no-store');
  });
});

test('speech rejects malformed, empty and oversized input before generating audio', async () => {
  const { POST } = sourceLoader()('src/app/api/speech/route.ts');
  for (const body of ['null', '{}', '{bad', JSON.stringify({ text: '' }), JSON.stringify({ text: 1 }), JSON.stringify({ text: 'x'.repeat(1001) })]) {
    assert.equal((await POST(new Request('http://localhost/api/speech', { method: 'POST', body }))).status, 400);
  }
});

test('ElevenLabs route uses server configuration and returns uncached audio only', async () => {
  const { POST } = sourceLoader()('src/app/api/speech/route.ts');
  await configured({ ELEVENLABS_API_KEY: 'test-secret', ELEVENLABS_VOICE_ID: 'configured-voice', ELEVENLABS_MODEL_ID: 'configured-model' }, async (url, init) => {
    assert.equal(url, 'https://api.elevenlabs.io/v1/text-to-speech/configured-voice?output_format=mp3_44100_128');
    assert.equal(init.headers['xi-api-key'], 'test-secret');
    assert.deepEqual(JSON.parse(init.body), { text: 'Read this', model_id: 'configured-model' });
    assert.ok(init.signal instanceof AbortSignal);
    return new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'audio/mpeg' } });
  }, async () => {
    const response = await POST(speechRequest(' Read this '));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('content-type'), 'audio/mpeg');
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [1, 2, 3]);
  });
});

test('speech failures return safe errors rather than provider responses or credentials', async () => {
  const { POST } = sourceLoader()('src/app/api/speech/route.ts');
  for (const fetcher of [async () => { throw Error('test-secret'); }, async () => new Response('test-secret', { status: 401 }), async () => Response.json({ detail: 'test-secret' }), async () => new Response('', { headers: { 'content-type': 'audio/mpeg' } })]) {
    await configured({ ELEVENLABS_API_KEY: 'test-secret' }, fetcher, async () => {
      const response = await POST(speechRequest('Hello'));
      assert.equal(response.status, 502);
      assert.ok(!(await response.text()).includes('test-secret'));
    });
  }
});

test('Groq transcription uses configured model, validates uploads and handles failures', async () => {
  const { POST } = sourceLoader()('src/app/api/transcribe/route.ts');
  await configured({ GROQ_API_KEY: '', GROQ_TRANSCRIPTION_MODEL: '' }, () => { throw Error('must not fetch'); }, async () => {
    assert.equal((await POST(recording())).status, 503);
  });
  await configured({ GROQ_API_KEY: 'test-groq', GROQ_TRANSCRIPTION_MODEL: 'configured-whisper' }, async (url, init) => {
    assert.equal(url, 'https://api.groq.com/openai/v1/audio/transcriptions');
    assert.equal(init.headers.Authorization, 'Bearer test-groq');
    assert.equal(init.body.get('model'), 'configured-whisper');
    assert.ok(init.body.get('file') instanceof File);
    assert.ok(init.signal instanceof AbortSignal);
    return Response.json({ text: ' Pay Mum ten dollars ' });
  }, async () => {
    const response = await POST(recording());
    assert.deepEqual(await response.json(), { text: 'Pay Mum ten dollars' });
    assert.equal((await POST(new Request('http://localhost/api/transcribe', { method: 'POST', body: 'bad' }))).status, 400);
    assert.equal((await POST(new Request('http://localhost/api/transcribe', { method: 'POST', body: new FormData() }))).status, 400);
    const large = new FormData();
    large.set('audio', new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.webm'));
    assert.equal((await POST(new Request('http://localhost/api/transcribe', { method: 'POST', body: large }))).status, 413);
  });
  for (const fetcher of [async () => { throw Error('private-provider-error'); }, async () => Response.json({ text: 42 }), async () => new Response('private-provider-error', { status: 429 })]) {
    await configured({ GROQ_API_KEY: 'test-groq' }, fetcher, async () => {
      const response = await POST(recording());
      assert.equal(response.status, 502);
      assert.ok(!(await response.text()).includes('private-provider-error'));
    });
  }
});

test('speech cancellation suppresses a late response and browser fallback works without a key', async () => {
  const savedWindow = globalThis.window;
  const savedUtterance = globalThis.SpeechSynthesisUtterance;
  const spoken = [];
  globalThis.window = { speechSynthesis: { cancel() {}, speak(value) { spoken.push(value.text); } } };
  globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  const settle = () => new Promise(resolve => setImmediate(resolve));
  try {
    await configured({}, async () => Response.json({ enabled: false }), async () => {
      const { speak } = sourceLoader()('src/lib/speech-client.ts');
      speak('Fallback');
      await settle();
      assert.deepEqual(spoken, ['Fallback']);
    });
    let finish;
    let generationSignal;
    await configured({}, async (url, init) => {
      if (!init?.method) return Response.json({ enabled: true });
      generationSignal = init.signal;
      return new Promise(resolve => { finish = resolve; });
    }, async () => {
      const { speak, stopSpeaking } = sourceLoader()('src/lib/speech-client.ts');
      speak('Stale reply');
      await settle();
      assert.ok(finish);
      stopSpeaking();
      assert.ok(generationSignal.aborted);
      finish(new Response(new Uint8Array([1]), { headers: { 'content-type': 'audio/mpeg' } }));
      await settle();
      assert.deepEqual(spoken, ['Fallback']);
    });
  } finally {
    globalThis.window = savedWindow;
    globalThis.SpeechSynthesisUtterance = savedUtterance;
  }
});
