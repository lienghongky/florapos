import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, SwitchCamera, Zap, ZapOff, Repeat } from 'lucide-react';
import { AnimatedModal } from '@/app/components/motion/AnimatedPage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Return true if the code was handled successfully (used for the flash colour). */
  onDetected: (code: string) => boolean | void | Promise<boolean | void>;
  title?: string;
  subtitle?: string;
  initialContinuous?: boolean;
}

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code', 'itf'];
const FACING_KEY = 'pos-camera-facing';

/**
 * Camera barcode scanner. Uses the native BarcodeDetector API when available (Chrome/Android/Edge),
 * otherwise falls back to ZXing (Safari/iOS/Firefox).
 */
export function CameraScannerModal({
  isOpen,
  onClose,
  onDetected,
  title,
  subtitle,
  initialContinuous = true,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [continuous, setContinuous] = useState(initialContinuous);

  useEffect(() => {
    if (isOpen) {
      setContinuous(initialContinuous);
    }
  }, [isOpen, initialContinuous]);
  const [facing, setFacing] = useState<'environment' | 'user'>(() => { try { return localStorage.getItem(FACING_KEY) === 'user' ? 'user' : 'environment'; } catch { return 'environment'; } });
  const [torch, setTorch] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [flash, setFlash] = useState<'ok' | 'err' | null>(null);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cooldown = useRef(new Map<string, number>());
  const continuousRef = useRef(continuous);
  continuousRef.current = continuous;
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    let stopped = false;
    let raf = 0;
    let zxingControls: { stop: () => void } | null = null;
    setError(null);

    let processing = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    cooldown.current.clear();
    const handle = async (raw: string) => {
      const code = raw.trim();
      const now = Date.now();
      if (stopped || processing || !code || now - (cooldown.current.get(code) || 0) < 1500) return;
      cooldown.current.set(code, now);
      processing = true;
      setLastCode(code);
      let ok = false;
      try { ok = (await onDetectedRef.current(code)) !== false; } finally { processing = false; }
      if (stopped) return;
      setFlash(ok ? 'ok' : 'err');
      timers.push(setTimeout(() => setFlash(null), 350));
      if (!continuousRef.current && ok) { processing = true; timers.push(setTimeout(() => onCloseRef.current(), 250)); }
    };

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        if (stopped) return;

        const track = stream.getVideoTracks()[0];
        const caps: any = track.getCapabilities?.() || {};
        setTorchSupported(!!caps.torch);

        const BD = (window as any).BarcodeDetector;
        let useNative = false;
        if (BD) {
          try {
            const supported: string[] = await BD.getSupportedFormats();
            useNative = FORMATS.some(f => supported.includes(f));
          } catch { useNative = false; }
        }

        if (stopped) return;
        if (useNative) {
          const supported: string[] = await BD.getSupportedFormats();
          const detector = new BD({ formats: FORMATS.filter(f => supported.includes(f)) });
          let last = 0;
          const loop = async (t: number) => {
            if (stopped) return;
            if (t - last > 120 && video.readyState >= 2) {
              last = t;
              try {
                const codes = await detector.detect(video);
                if (codes?.[0]?.rawValue) handle(codes[0].rawValue);
              } catch { /* frame not ready */ }
            }
            raf = requestAnimationFrame(loop);
          };
          raf = requestAnimationFrame(loop);
        } else {
          const { BrowserMultiFormatReader } = await import('@zxing/browser');
          if (stopped) return;
          const reader = new BrowserMultiFormatReader();
          zxingControls = await reader.decodeFromVideoElement(video, (result) => {
            if (result && !stopped) handle(result.getText());
          });
          if (stopped) zxingControls.stop();
        }
      } catch (e: any) {
        if (stopped) return;
        streamRef.current?.getTracks().forEach(t => t.stop());
        setError(
          e?.name === 'NotAllowedError'
            ? 'Camera permission denied. Allow camera access in your browser settings.'
            : e?.name === 'NotFoundError'
              ? 'No camera found on this device.'
              : 'Could not start the camera. Camera access requires HTTPS (or localhost).',
        );
      }
    })();

    return () => {
      stopped = true;
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
      zxingControls?.stop();
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setTorch(false);
    };
  }, [isOpen, facing]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch } as any] });
      setTorch(!torch);
    } catch { /* unsupported */ }
  };

  const switchCamera = () => {
    const next = facing === 'environment' ? 'user' : 'environment';
    try { localStorage.setItem(FACING_KEY, next); } catch {}
    setFacing(next);
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} position="center">
      <div data-scanner-pause className="w-[min(520px,94vw)] overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/10"><Camera className="size-4.5" /></div>
            <div>
              <h2 className="text-base font-semibold leading-tight">{title || 'Scan with camera'}</h2>
              <p className="text-[11px] text-white/50">{subtitle || 'Point at a barcode — it adds automatically'}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"><X className="size-5" /></button>
        </div>

        <div className="relative aspect-[4/3] bg-black">
          <video ref={videoRef} playsInline muted className={`size-full object-cover ${facing === 'user' ? '-scale-x-100' : ''}`} />

          {/* Viewfinder */}
          {!error && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/35 [mask-image:linear-gradient(#000,#000),linear-gradient(#000,#000)] [mask-composite:exclude] [mask-size:100%_100%,78%_42%] [mask-position:center] [mask-repeat:no-repeat] [-webkit-mask-composite:xor]" />
              <div className={`relative h-[42%] w-[78%] rounded-2xl transition-colors duration-150 ${flash === 'ok' ? 'bg-emerald-400/25' : flash === 'err' ? 'bg-red-500/25' : ''}`}>
                {['left-0 top-0 border-l-4 border-t-4 rounded-tl-2xl', 'right-0 top-0 border-r-4 border-t-4 rounded-tr-2xl', 'left-0 bottom-0 border-l-4 border-b-4 rounded-bl-2xl', 'right-0 bottom-0 border-r-4 border-b-4 rounded-br-2xl'].map(c => (
                  <span key={c} className={`absolute size-7 ${c} ${flash === 'err' ? 'border-red-400' : 'border-emerald-400'}`} />
                ))}
                <motion.div
                  className="absolute inset-x-3 h-0.5 rounded-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_2px_rgba(52,211,153,0.6)]"
                  animate={{ top: ['8%', '92%', '8%'] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <Camera className="size-10 text-white/30" />
              <p className="text-sm text-white/80">{error}</p>
            </div>
          )}

          <AnimatePresence>
            {lastCode && (
              <motion.div
                key={lastCode + (flash || '')}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 font-mono text-xs backdrop-blur"
              >
                {lastCode}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-4">
          <button
            onClick={() => setContinuous(c => !c)}
            className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${continuous ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30' : 'bg-white/10 text-white/70'}`}
          >
            <Repeat className="size-3.5" /> {continuous ? 'Continuous' : 'Single scan'}
          </button>
          <div className="flex gap-2">
            {torchSupported && (
              <button onClick={toggleTorch} className="rounded-full bg-white/10 p-2.5 hover:bg-white/20" title="Flashlight">
                {torch ? <ZapOff className="size-4" /> : <Zap className="size-4" />}
              </button>
            )}
            <button onClick={switchCamera} className="rounded-full bg-white/10 p-2.5 hover:bg-white/20" title="Switch camera">
              <SwitchCamera className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </AnimatedModal>
  );
}
