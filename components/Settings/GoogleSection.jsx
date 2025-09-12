import { useState } from 'react';

export default function GoogleSection({ initialConnected = false, initialTokens = null, onTokens }) {
  const [connected, setConnected] = useState(initialConnected);
  const [tokens, setTokens] = useState(initialTokens);
  const [status, setStatus] = useState('');

  async function connect() {
    setStatus('Opening Google consent...');
    window.location.href = '/api/google/oauth/start';
  }

  async function disconnect() {
    try {
      setStatus('Disconnecting...');
      await fetch('/api/google/oauth/logout');
    } catch {}
    setTokens(null);
    setConnected(false);
    onTokens?.(null);
    setStatus('Disconnected.');
  }

  async function createSample() {
    try {
      setStatus('Creating sample event...');
      const now = new Date();
      const startISO = new Date(now.getTime() + 10*60*1000).toISOString();
      const endISO = new Date(now.getTime() + 70*60*1000).toISOString();
      const r = await fetch('/api/google/calendar/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: 'AmplyAI Sample Event',
          description: 'Created from Settings',
          startISO, endISO, timeZone: 'Asia/Singapore', tokens
        })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || data.error || 'Failed');
      setStatus('Sample event created ✅');
      if (data.tokens) { setTokens(data.tokens); onTokens?.(data.tokens); }
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  }

  async function testParseCreate(text) {
    setStatus('Parsing + creating…');
    const r = await fetch('/api/google/calendar/parse-create', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, tokens, timezone: 'Asia/Singapore' })
    });
    const data = await r.json();
    if (!r.ok) setStatus('Error: ' + (data.message || data.error));
    else setStatus('Created: ' + data.parsed.title);
    if (data.tokens) { setTokens(data.tokens); onTokens?.(data.tokens); }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="font-medium">Google Calendar</span>
        <span className={`text-xs px-2 py-0.5 rounded ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      <div className="flex gap-2">
        <button onClick={connect} className="px-3 py-1.5 rounded bg-black text-white">Connect</button>
        <button onClick={disconnect} className="px-3 py-1.5 rounded bg-gray-200">Disconnect</button>
        <button onClick={createSample} disabled={!tokens} className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-50">Create sample event</button>
        <button onClick={() => testParseCreate('next wed 14:30 call with supplier')} disabled={!tokens} className="px-3 py-1.5 rounded bg-indigo-600 text-white disabled:opacity-50">Test parse-create</button>
      </div>
      <div className="text-sm text-gray-600">{status}</div>
    </div>
  );
}
