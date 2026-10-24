import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, Bluetooth, Settings, Check, RefreshCw, Scissors, DollarSign, Smartphone, Zap, Wifi, Usb, Copy, Clock } from 'lucide-react';
import { usePrinterStore, PrintMode, PaperSize } from '@/app/store/printer-store';
import { AnimatedModal } from '@/app/components/motion/AnimatedPage';
import { useTranslation } from '@/app/i18n';

interface PrinterSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PrinterSettingsModal({ isOpen, onClose }: PrinterSettingsModalProps) {
    const { t } = useTranslation();
    const {
        printMode,
        paperSize,
        autoPrintOnCheckout,
        printTwoReceipts,
        receiptDelaySeconds,
        autoCut,
        openCashDrawer,
        bluetoothDeviceName,
        isBluetoothConnected,
        isScanning,
        lastError,
        pocketDeviceName,
        isPocketConnected,
        pocketBattery,
        networkPrinterIp,
        networkPrinterPort,
        driverApp,
        driverScheme,
        setPrintMode,
        setPaperSize,
        setDriverApp,
        setDriverScheme,
        setAutoPrintOnCheckout,
        setPrintTwoReceipts,
        setReceiptDelaySeconds,
        setAutoCut,
        setOpenCashDrawer,
        setNetworkPrinterIp,
        setNetworkPrinterPort,
        connectBluetoothPrinter,
        disconnectBluetoothPrinter,
        connectPocketPrinter,
        disconnectPocketPrinter,
        testPrint
    } = usePrinterStore();

    return (
        <AnimatedModal isOpen={isOpen} position="center" onClose={onClose}>
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-border">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border p-6 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                            <Printer className="size-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">{t('settings.printerSettingsTitle')}</h3>
                            <p className="text-xs text-muted-foreground">{t('settings.printerSettingsDesc')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    {/* Print Mode Selector */}
                    <div>
                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-3">
                            {t('settings.printModeLabel')}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                {
                                    id: 'system',
                                    title: t('settings.systemPrint'),
                                    subtitle: t('settings.systemPrintSub'),
                                    icon: Smartphone,
                                },
                                {
                                    id: 'pocket',
                                    title: t('settings.pocketBle'),
                                    subtitle: t('settings.pocketBleSub'),
                                    icon: Zap,
                                },
                                {
                                    id: 'bluetooth',
                                    title: t('settings.bluetoothPos'),
                                    subtitle: t('settings.bluetoothPosSub'),
                                    icon: Bluetooth,
                                },
                                {
                                    id: 'usb',
                                    title: t('settings.usbThermal'),
                                    subtitle: t('settings.usbThermalSub'),
                                    icon: Usb,
                                },
                                {
                                    id: 'network',
                                    title: t('settings.networkIp'),
                                    subtitle: t('settings.networkIpSub'),
                                    icon: Wifi,
                                },
                                {
                                    id: 'escpos_driver',
                                    title: t('settings.escposDriver'),
                                    subtitle: t('settings.escposDriverSub'),
                                    icon: Smartphone,
                                },
                            ].map((mode) => {
                                const Icon = mode.icon;
                                const isActive = printMode === mode.id;
                                return (
                                    <button
                                        key={mode.id}
                                        onClick={() => setPrintMode(mode.id as PrintMode)}
                                        className={`flex flex-col text-left p-4 rounded-2xl border-2 transition-all ${
                                            isActive
                                                ? 'border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm'
                                                : 'border-border bg-white text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <Icon className={`size-5 ${isActive ? 'text-brand-primary' : 'text-slate-400'}`} />
                                            {isActive && (
                                                <div className="size-5 rounded-full bg-brand-primary text-white flex items-center justify-center">
                                                    <Check className="size-3" />
                                                </div>
                                            )}
                                        </div>
                                        <span className="font-bold text-sm text-slate-900">{mode.title}</span>
                                        <span className="text-[11px] text-muted-foreground mt-0.5">{mode.subtitle}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Pocket BLE Device Pairing Section */}
                    {printMode === 'pocket' && (
                        <div className="rounded-3xl border border-violet-100 bg-violet-50/40 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <Zap className="size-5 text-violet-600" />
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900">Pocket Printer (Lucky Jingle / DP-L1S)</h4>
                                        <p className="text-xs text-slate-500">
                                            {isPocketConnected
                                                ? `Connected: ${pocketDeviceName || 'Pocket Printer'}`
                                                : 'No pocket printer connected'}
                                            {isPocketConnected && pocketBattery !== null && (
                                                <span className="ml-2 font-semibold text-emerald-600">🔋 {pocketBattery}%</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                        isPocketConnected
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-amber-100 text-amber-700'
                                    }`}
                                >
                                    {isPocketConnected ? 'Ready' : 'Not Paired'}
                                </span>
                            </div>

                            <p className="text-xs text-slate-500 leading-relaxed">
                                Portable thermal pocket printer (DP-L1S, C&amp;Co 3128, Action, LuckPrinter).
                                Uses Web Bluetooth 384-dot raster graphics with Khmer font support.
                            </p>

                            {lastError && (
                                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 font-medium">
                                    {lastError}
                                </p>
                            )}

                            <div className="flex gap-2">
                                {isPocketConnected ? (
                                    <>
                                        <button
                                            onClick={testPrint}
                                            className="flex-1 py-3 px-4 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <Zap className="size-4" />
                                            Test Print
                                        </button>
                                        <button
                                            onClick={disconnectPocketPrinter}
                                            className="py-3 px-4 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-all"
                                        >
                                            Disconnect
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={connectPocketPrinter}
                                        disabled={isScanning}
                                        className="w-full py-3.5 px-4 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 disabled:opacity-50"
                                    >
                                        <RefreshCw className={`size-4 ${isScanning ? 'animate-spin' : ''}`} />
                                        {isScanning ? 'Connecting Pocket Printer...' : 'Scan & Pair Pocket Printer'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Bluetooth Device Pairing Section */}
                    {printMode === 'bluetooth' && (
                        <div className="rounded-3xl border border-blue-100 bg-blue-50/40 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <Bluetooth className="size-5 text-blue-600" />
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900">Bluetooth Receipt Printer</h4>
                                        <p className="text-xs text-slate-500">
                                            {isBluetoothConnected
                                                ? `Connected to: ${bluetoothDeviceName || 'Printer'}`
                                                : 'No Bluetooth printer connected'}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                        isBluetoothConnected
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-amber-100 text-amber-700'
                                    }`}
                                >
                                    {isBluetoothConnected ? 'Ready' : 'Not Paired'}
                                </span>
                            </div>

                            {lastError && (
                                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 font-medium">
                                    {lastError}
                                </p>
                            )}

                            <div className="flex gap-2">
                                {isBluetoothConnected ? (
                                    <>
                                        <button
                                            onClick={testPrint}
                                            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                                        >
                                            <Zap className="size-4" />
                                            Test Print
                                        </button>
                                        <button
                                            onClick={disconnectBluetoothPrinter}
                                            className="py-3 px-4 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-all"
                                        >
                                            Disconnect
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={connectBluetoothPrinter}
                                        disabled={isScanning}
                                        className="w-full py-3.5 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                                    >
                                        <RefreshCw className={`size-4 ${isScanning ? 'animate-spin' : ''}`} />
                                        {isScanning ? 'Scanning Bluetooth Devices...' : 'Scan & Pair Bluetooth Printer'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ESC-POS Driver Section (Ottor Print / Fidelier) */}
                    {printMode === 'escpos_driver' && (
                        <div className="rounded-3xl border border-sky-100 bg-sky-50/40 p-5 space-y-4">
                            <div className="flex items-center gap-2.5">
                                <Smartphone className="size-5 text-sky-600" />
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900">ESC-POS Driver (Android App)</h4>
                                    <p className="text-xs text-slate-500">Choose your target Android printing application</p>
                                </div>
                            </div>

                            {/* Driver Selection Pills */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setDriverApp('ottor')}
                                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                                        driverApp === 'ottor'
                                            ? 'border-sky-600 bg-white shadow-sm ring-2 ring-sky-500/20'
                                            : 'border-slate-200 bg-white/70 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-xs text-slate-900">Ottor Print (Your App)</span>
                                        {driverApp === 'ottor' && (
                                            <div className="size-4 rounded-full bg-sky-600 text-white flex items-center justify-center">
                                                <Check className="size-2.5" />
                                            </div>
                                        )}
                                    </div>
                                    <code className="text-[10px] font-mono text-sky-700 bg-sky-100/60 px-1.5 py-0.5 rounded block w-fit">
                                        ottor-print:
                                    </code>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setDriverApp('fidelier')}
                                    className={`p-3 rounded-2xl border-2 text-left transition-all ${
                                        driverApp === 'fidelier'
                                            ? 'border-sky-600 bg-white shadow-sm ring-2 ring-sky-500/20'
                                            : 'border-slate-200 bg-white/70 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-xs text-slate-900">Fidelier POS Driver</span>
                                        {driverApp === 'fidelier' && (
                                            <div className="size-4 rounded-full bg-sky-600 text-white flex items-center justify-center">
                                                <Check className="size-2.5" />
                                            </div>
                                        )}
                                    </div>
                                    <code className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded block w-fit">
                                        posprinterdriver
                                    </code>
                                </button>
                            </div>

                            {/* App Specific Details */}
                            {driverApp === 'ottor' ? (
                                <div className="space-y-3 pt-2 border-t border-sky-200/50">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-600">Android Deep Link URI Scheme</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={driverScheme}
                                                onChange={(e) => setDriverScheme(e.target.value)}
                                                placeholder="ottor-print"
                                                className="flex-1 h-9 px-3 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:ring-2 focus:ring-sky-500/20 bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={testPrint}
                                                className="h-9 px-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                                            >
                                                <Smartphone className="size-3.5" />
                                                Test App
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Points directly to your Android app using the <code>{driverScheme || 'ottor-print'}:</code> custom intent scheme. Receipts will open in your app with full Khmer, English, and graphic support.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 pt-2 border-t border-sky-200/50">
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Sends formatted receipts directly to the <strong>ESC POS Printer Driver</strong> Android app using the <code>com.fidelier.printfromweb</code> intent scheme (Package: <code>com.fidelier.posprinterdriver</code>).
                                    </p>
                                    <div className="flex items-center justify-between text-xs pt-1">
                                        <span className="font-semibold text-slate-700">App Reference:</span>
                                        <a
                                            href="https://github.com/solyarisoftware/posprinterdriver"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-bold text-sky-600 hover:underline flex items-center gap-1"
                                        >
                                            solyarisoftware/posprinterdriver ↗
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* USB Thermal Printer Section (NO IP Needed) */}
                    {printMode === 'usb' && (
                        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 space-y-2">
                            <div className="flex items-center gap-2.5">
                                <Usb className="size-5 text-emerald-600" />
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900">Plug & Play USB Thermal Printer</h4>
                                    <p className="text-xs text-slate-500">Connect printer directly via USB / USB OTG cable</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 pt-2 border-t border-emerald-200/50">
                                <strong>No IP address needed!</strong> Simply plug your USB thermal printer into your Android tablet or computer USB port. For Android, the RawBT driver automatically routes ESC/POS data to the USB device.
                            </p>
                        </div>
                    )}

                    {/* Network IP Printer Config Section (ONLY for Network Mode) */}
                    {printMode === 'network' && (
                        <div className="rounded-3xl border border-purple-100 bg-purple-50/40 p-5 space-y-4">
                            <div className="flex items-center gap-2.5">
                                <Wifi className="size-5 text-purple-600" />
                                <div>
                                    <h4 className="font-bold text-sm text-slate-900">Network (Ethernet/Wi-Fi) IP Settings</h4>
                                    <p className="text-xs text-slate-500">Target local network IP thermal printer on Wi-Fi/Ethernet</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-500">Printer IP Address</label>
                                    <input
                                        type="text"
                                        value={networkPrinterIp}
                                        onChange={(e) => setNetworkPrinterIp(e.target.value)}
                                        placeholder="192.168.1.200"
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-slate-500">Port</label>
                                    <input
                                        type="number"
                                        value={networkPrinterPort}
                                        onChange={(e) => setNetworkPrinterPort(Number(e.target.value))}
                                        placeholder="9100"
                                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 pt-2 border-t border-purple-200/50">
                                <strong>How it works on Android:</strong> Web browsers cannot open raw TCP sockets directly to LAN IPs due to browser security. When you print, the POS triggers an Android Intent to the <strong>RawBT Print Service</strong> app (<code>ru.a402d.rawbtprinter</code>). In the RawBT app, configure your printer under <em>WiFi / Ethernet</em> with your IP (<code>{networkPrinterIp}</code>) and Port (<code>{networkPrinterPort}</code>). RawBT immediately routes the print job over your local network!
                            </p>
                        </div>
                    )}

                    {/* Paper Width Options */}
                    <div>
                        <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-3">
                            {t('settings.paperWidth')}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: '58mm', label: '58mm Standard POS (32 Chars)' },
                                { id: '80mm', label: '80mm Wide Thermal (48 Chars)' },
                            ].map((paper) => (
                                <button
                                    key={paper.id}
                                    onClick={() => setPaperSize(paper.id as PaperSize)}
                                    className={`py-3 px-4 rounded-xl border-2 text-xs font-bold transition-all text-center ${
                                        paperSize === paper.id
                                            ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                                            : 'border-border bg-white text-slate-600 hover:border-slate-300'
                                    }`}
                                >
                                    {paper.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3 pt-2 border-t border-border">
                        <label className="flex items-center justify-between cursor-pointer p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Scissors className="size-5 text-slate-500" />
                                <div>
                                    <span className="font-bold text-sm text-slate-900 block">{t('settings.autoCut')}</span>
                                    <span className="text-xs text-muted-foreground">{t('settings.autoCutDesc')}</span>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={autoCut}
                                onChange={(e) => setAutoCut(e.target.checked)}
                                className="size-5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                            />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <DollarSign className="size-5 text-slate-500" />
                                <div>
                                    <span className="font-bold text-sm text-slate-900 block">{t('settings.openCashDrawer')}</span>
                                    <span className="text-xs text-muted-foreground">{t('settings.openCashDrawerDesc')}</span>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={openCashDrawer}
                                onChange={(e) => setOpenCashDrawer(e.target.checked)}
                                className="size-5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                            />
                        </label>

                        <label className="flex items-center justify-between cursor-pointer p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <Printer className="size-5 text-slate-500" />
                                <div>
                                    <span className="font-bold text-sm text-slate-900 block">{t('settings.autoPrintOnCheckout')}</span>
                                    <span className="text-xs text-muted-foreground">{t('settings.autoPrintDesc')}</span>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={autoPrintOnCheckout}
                                onChange={(e) => setAutoPrintOnCheckout(e.target.checked)}
                                className="size-5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                            />
                        </label>

                        {/* Print 2 Receipts Toggle */}
                        <div className="space-y-2.5 rounded-2xl p-3 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <Copy className="size-5 text-slate-500" />
                                    <div>
                                        <span className="font-bold text-sm text-slate-900 block">{t('settings.printTwoReceipts')}</span>
                                        <span className="text-xs text-muted-foreground">{t('settings.printTwoReceiptsDesc')}</span>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={printTwoReceipts}
                                    onChange={(e) => setPrintTwoReceipts(e.target.checked)}
                                    className="size-5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                                />
                            </label>

                            {/* Delay input when 2 receipts is checked */}
                            {printTwoReceipts && (
                                <div className="ml-8 pl-3 border-l-2 border-brand-primary/40 pt-1 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                        <Clock className="size-4 text-brand-primary" />
                                        <span>{t('settings.receiptDelaySeconds')}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <input
                                            type="number"
                                            min={0}
                                            max={30}
                                            step={1}
                                            value={receiptDelaySeconds}
                                            onChange={(e) => setReceiptDelaySeconds(Number(e.target.value) || 0)}
                                            className="w-16 h-8 px-2 rounded-lg border border-slate-200 text-center font-bold text-xs outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white"
                                        />
                                        <span className="text-xs text-slate-500 font-semibold">sec</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-border bg-slate-50/50 flex gap-3">
                    <button
                        onClick={testPrint}
                        className="flex-1 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-bold text-xs hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                    >
                        <Zap className="size-4 text-brand-primary" />
                        {t('settings.testPrintReceipt')}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                    >
                        {t('settings.saveAndClose')}
                    </button>
                </div>
            </div>
        </AnimatedModal>
    );
}
