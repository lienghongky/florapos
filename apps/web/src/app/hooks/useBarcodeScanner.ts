import { useEffect, useRef } from 'react';

export interface BarcodeScannerOptions {
  onScan: (code: string, input: HTMLInputElement | null, originalValue?: string) => void;
  onMultiplier?: (quantity: number, input: HTMLInputElement | null, originalValue?: string) => void;
  enabled?: boolean;
  minLength?: number;
  maxAvgGapMs?: number;
}

/** Exported listener makes the same detection logic testable without mounting React. */
export function attachBarcodeScanner({ onScan, onMultiplier, minLength = 4, maxAvgGapMs = 55 }: BarcodeScannerOptions) {
  let buffer = '';
  let firstAt = 0;
  let lastAt = 0;
  let input: HTMLInputElement | null = null;
  let originalValue = '';
  let timer: ReturnType<typeof setTimeout> | undefined;
  let digits = '';
  let digitsAt = 0;
  let digitsOriginal = '';
  const reset = () => { buffer = ''; clearTimeout(timer); };
  const fast = () => buffer.length >= minLength && (lastAt - firstAt) / (buffer.length - 1) < maxAvgGapMs;
  const paused = () => !!document.querySelector('[data-scanner-pause]');
  const emit = () => {
    const code = buffer.trim();
    reset(); digits = '';
    if (code) onScan(code, input, originalValue);
  };
  const listener = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    const nextInput = target?.tagName === 'INPUT' ? target as HTMLInputElement : null;
    if (paused() || e.ctrlKey || e.altKey || e.metaKey || e.isComposing ||
      (nextInput && !nextInput.hasAttribute('data-scan-target')) ||
      target?.isContentEditable || ['TEXTAREA', 'SELECT'].includes(target?.tagName || '')) {
      reset(); digits = ''; return;
    }
    if (nextInput !== input) { reset(); digits = ''; }
    input = nextInput;
    if (e.key === 'Enter' || e.key === 'Tab') {
      if (fast()) { e.preventDefault(); e.stopPropagation(); emit(); }
      else { reset(); digits = ''; }
      return;
    }
    if (e.key.length !== 1) {
      if (e.key !== 'Shift') { reset(); digits = ''; }
      return;
    }
    const now = performance.now();
    if (e.key === '*' && digits && now - digitsAt < 3000) {
      const quantity = Number(digits);
      if (quantity > 0 && quantity <= 999) {
        e.preventDefault(); onMultiplier?.(quantity, input, digitsOriginal);
      }
      reset(); digits = ''; return;
    }
    if (/^\d$/.test(e.key)) {
      if (!digits || now - digitsAt >= 3000) { digits = ''; digitsOriginal = input?.value || ''; }
      digits += e.key; digitsAt = now;
    } else digits = '';
    if (buffer && now - lastAt >= 120) reset();
    if (!buffer) { firstAt = now; originalValue = input?.value || ''; }
    buffer += e.key; lastAt = now;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!paused() && fast()) emit(); else reset();
    }, 120);
  };
  window.addEventListener('keydown', listener, true);
  return () => { reset(); window.removeEventListener('keydown', listener, true); };
}

export function useBarcodeScanner(options: BarcodeScannerOptions) {
  const callbacks = useRef(options);
  callbacks.current = options;
  const { enabled = true, minLength, maxAvgGapMs } = options;
  useEffect(() => {
    if (!enabled) return;
    return attachBarcodeScanner({ minLength, maxAvgGapMs,
      onScan: (...args) => callbacks.current.onScan(...args),
      onMultiplier: (...args) => callbacks.current.onMultiplier?.(...args),
    });
  }, [enabled, minLength, maxAvgGapMs]);
}
