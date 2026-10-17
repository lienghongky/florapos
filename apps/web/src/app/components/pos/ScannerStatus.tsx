import { useState } from 'react';
import { isScanSoundEnabled, setScanSoundEnabled } from '@/app/lib/scan-feedback';

export function ScannerStatus({ enabled, paused, lastCode, multiplier, onEnabled, onClearMultiplier }: {
  enabled: boolean; paused: boolean; lastCode: string; multiplier: number;
  onEnabled: (enabled: boolean) => void; onClearMultiplier: () => void;
}) {
  const [sound, setSound] = useState(isScanSoundEnabled);
  return <div className="flex items-center gap-2 text-xs">
    <details className="relative">
      <summary className={`cursor-pointer rounded-full px-3 py-2 ${!enabled || paused ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
        <span className={enabled && !paused ? 'animate-pulse' : ''}>●</span> {enabled ? paused ? 'Scanner paused' : 'Scanner ready' : 'Scanner off'}
      </summary>
      <div className="absolute left-0 top-full z-40 w-56 space-y-3 rounded-xl border bg-white p-4 shadow-xl">
        <label className="flex gap-2"><input type="checkbox" checked={enabled} onChange={e => onEnabled(e.target.checked)} /> Enable scanner</label>
        <label className="flex gap-2"><input type="checkbox" checked={sound} onChange={e => { setSound(e.target.checked); setScanSoundEnabled(e.target.checked); }} /> Scan sounds</label>
        <p>Type a quantity and * before scanning. Switch camera direction in the camera window.</p>
      </div>
    </details>
    {multiplier > 1 && <button className="rounded-full bg-blue-100 px-3 py-2" onClick={onClearMultiplier} title="Clear quantity multiplier">× {multiplier} ✕</button>}
    {lastCode && <span className="truncate text-slate-500" aria-live="polite">{lastCode}</span>}
  </div>;
}
