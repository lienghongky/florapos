import { useState, useEffect } from 'react';
import { Printer, Bluetooth, Usb, Wifi, FileDown } from 'lucide-react';
import { AnimatedModal } from '@/app/components/motion/AnimatedPage';
import { LabelSettings, SHEET_PRESETS } from './label-templates';
import { validateLabelLayout } from './label-pdf';
import { chooseLabelPrinter, getLabelConnection, directLabelSupport, disconnectLabelPrinter, DirectLabelMode } from './label-printer-connection';

export interface LabelPrinterPreferences {
  output: 'system' | 'pdf' | 'bluetooth' | 'usb' | 'network';
  configured: boolean; deviceId?: string; deviceName?: string;
}
export function loadLabelPrinterPreferences(storeId?: string): LabelPrinterPreferences {
  try {
    const value = JSON.parse(localStorage.getItem(`label-printer:${storeId || 'default'}`) || 'null');
    if (value?.configured === true && ['system', 'pdf', 'bluetooth', 'usb', 'network'].includes(value.output)) return {
      output: value.output, configured: true,
      ...(typeof value.deviceId === 'string' && typeof value.deviceName === 'string' ? { deviceId: value.deviceId, deviceName: value.deviceName } : {}),
    };
  } catch {}
  return { output: 'system', configured: false };
}
export function saveLabelPrinterPreferences(storeId: string | undefined, value: LabelPrinterPreferences) {
  try { localStorage.setItem(`label-printer:${storeId || 'default'}`, JSON.stringify(value)); } catch {}
}

export function LabelPrinterSettingsModal({ preferences, settings, pendingPrint, onClose, onSave }: {
  preferences: LabelPrinterPreferences; settings: LabelSettings; pendingPrint: boolean;
  onClose: () => void; onSave: (preferences: LabelPrinterPreferences, settings: LabelSettings) => void;
}) {
  const [output, setOutput] = useState(preferences.output);
  const [layout, setLayout] = useState(settings);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [chosenId, setChosenId] = useState(preferences.deviceId);
  const [, refreshConnection] = useState(0);
  const direct = output === 'bluetooth' || output === 'usb';
  const connected = direct ? getLabelConnection(output, chosenId) : null;
  const unsupported = direct ? directLabelSupport(output) : null;
  useEffect(() => { if (!direct) return; const timer = setInterval(() => refreshConnection(n => n + 1), 1000); return () => clearInterval(timer); }, [direct]);
  const connect = async () => {
    setConnecting(true); setError('');
    try {
      const printer = await chooseLabelPrinter(output as DirectLabelMode);
      setChosenId(printer.id); refreshConnection(n => n + 1);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not connect printer'); }
    finally { setConnecting(false); }
  };
  const patch = (next: Partial<LabelSettings>) => { setLayout(previous => ({ ...previous, ...next })); setError(''); };
  return <AnimatedModal isOpen onClose={connecting ? undefined : onClose} position="center">
    <div role="dialog" aria-label="Label printer settings" className="w-[min(480px,92vw)] max-h-[85dvh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
      <h2 className="text-lg font-bold">Choose label printer</h2>
      <p className="mt-1 text-sm text-muted-foreground">For barcode labels only. Receipt printer settings stay separate.</p>
      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-semibold">Choose printer connection</legend>
        <div className="grid grid-cols-2 gap-2">
          {([
            ['system', 'System dialog', 'Choose a device printer', Printer],
            ['network', 'Wi-Fi / network', 'R80A through a print service', Wifi],
            ['bluetooth', 'Bluetooth', 'Choose a Bluetooth LE printer', Bluetooth],
            ['usb', 'USB / OTG', 'Choose a plugged-in printer', Usb],
            ['pdf', 'PDF / printer app', 'Save or share labels', FileDown],
          ] as const).map(([mode, title, subtitle, Icon]) => <button key={mode} type="button" aria-pressed={output === mode} disabled={connecting}
            onClick={() => { setOutput(mode); setError(''); setChosenId(preferences.output === mode ? preferences.deviceId : undefined); }}
            className={`rounded-xl border-2 p-3 text-left ${output === mode ? 'border-brand-primary bg-brand-primary/5' : 'border-border'}`}>
            <Icon className="mb-2 size-5" /><span className="block text-sm font-bold">{title}</span><span className="mt-1 block text-xs text-muted-foreground">{subtitle}</span>
          </button>)}
        </div>
      </fieldset>
      {output === 'system' && <p className="mt-3 text-xs text-muted-foreground">Select your printer in the system dialog. Use Actual size / 100%, no margins, and no headers or footers.</p>}
      {output === 'network' && <div className="mt-3 space-y-2 rounded-xl bg-blue-50 p-3 text-sm">
        <p className="font-semibold">R80A Wi-Fi setup</p>
        <p>Connect the printer and tablet to the same network.</p>
        <p>Android: add the R80A in a compatible ESC/POS print service, then select that printer in the system dialog.</p>
        <p>iPad: the printer must appear through AirPrint or a compatible bridge. Wi-Fi alone does not make it AirPrint-compatible. Otherwise choose PDF / printer app.</p>
        <p className="text-xs">This option opens the system network-printer chooser. It does not send directly to a printer IP address.</p>
      </div>}
      {output === 'pdf' && <p className="mt-3 text-xs text-muted-foreground">Download or share the PDF with your printer’s mobile app.</p>}
      {direct && <div className="mt-3 space-y-3 rounded-xl border p-3">
        <p className="text-sm font-semibold">{connected ? 'Connected: ' + connected.name : preferences.output === output && preferences.deviceName ? 'Last chosen: ' + preferences.deviceName + ' — reconnect required' : 'No label printer connected'}</p>
        {unsupported ? <p className="text-sm text-amber-700">{unsupported}</p> : <>
          <button type="button" disabled={connecting} className="rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-50" onClick={connect}>{connecting ? 'Connecting…' : connected ? 'Choose another printer' : 'Choose ' + (output === 'usb' ? 'USB' : 'Bluetooth') + ' printer'}</button>
          {connected && <button type="button" className="ml-2 text-sm underline" onClick={async () => { try { await disconnectLabelPrinter(); } catch (e) { setError(String(e)); } refreshConnection(n => n + 1); }}>Disconnect</button>}
        </>}
        <p className="text-xs text-muted-foreground">R80A / ESC/POS profile · 203 dpi · maximum 72 mm print width · continuous roll. Direct printing does not cut paper or control a label-gap sensor.</p>
        {output === 'bluetooth' && <p className="text-xs text-muted-foreground">Requires a Bluetooth LE print service. Classic Bluetooth and Wi-Fi-only R80A models will not connect here.</p>}
      </div>}
      <label className="mt-4 block text-sm font-semibold">Paper
        <select aria-label="Label paper" className="mt-2 w-full rounded-lg border p-3" value={layout.paper} onChange={e => patch({ paper: e.target.value as LabelSettings['paper'] })}>
          <option value="roll">Thermal label roll</option><option value="sheet">A4 label sheet</option>
        </select>
      </label>
      {layout.paper === 'sheet' && <select aria-label="Sheet preset" className="mt-3 w-full rounded-lg border p-3" defaultValue="" onChange={e => {
        const preset = SHEET_PRESETS[Number(e.target.value)];
        if (preset) patch({ width: preset.width, height: preset.height, sheetCols: preset.cols, sheetRows: preset.rows, sheetMargin: preset.margin, sheetGap: preset.gap, templateId: 'custom' });
      }}><option value="" disabled>Choose sheet preset</option>{SHEET_PRESETS.map((p, i) => <option value={i} key={i}>{p.label}</option>)}</select>}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {([{ key: 'width', label: 'Label width (mm)' }, { key: 'height', label: 'Label height (mm)' }, ...(layout.paper === 'sheet' ? [{ key: 'sheetCols', label: 'Columns' }, { key: 'sheetRows', label: 'Rows' }, { key: 'sheetMargin', label: 'Margin (mm)' }, { key: 'sheetGap', label: 'Gap (mm)' }] : [])] as { key: 'width' | 'height' | 'sheetCols' | 'sheetRows' | 'sheetMargin' | 'sheetGap'; label: string }[]).map(({ key, label }) => <label key={key} className="text-xs font-semibold">{label}
          <input type="number" min={key === 'sheetMargin' || key === 'sheetGap' ? 0 : 1} step={key === 'sheetRows' || key === 'sheetCols' ? 1 : .5} value={layout[key]} onChange={e => patch({ [key]: Number(e.target.value), templateId: 'custom' })} className="mt-1 w-full rounded-lg border p-3 text-base" />
        </label>)}
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button disabled={connecting} className="rounded-lg border px-4 py-3" onClick={onClose}>Cancel</button>
        <button disabled={connecting || (direct && !connected)} className="rounded-lg bg-brand-primary px-4 py-3 font-semibold text-white disabled:opacity-40" onClick={() => {
          try {
            validateLabelLayout(layout);
            if (direct && (layout.paper !== 'roll' || layout.width > 72)) throw new Error('R80A direct printing requires roll labels no wider than 72 mm.');
            if (direct && !connected) throw new Error('Choose and connect a printer first.');
            onSave({ output, configured: true, ...(connected ? { deviceId: connected.id, deviceName: connected.name } : {}) }, layout);
          } catch (e) { setError(e instanceof Error ? e.message : 'Check paper settings.'); }
        }}>{pendingPrint ? 'Save and continue' : 'Save label settings'}</button>
      </div>
    </div>
  </AnimatedModal>;
}
