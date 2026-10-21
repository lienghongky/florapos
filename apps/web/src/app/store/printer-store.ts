import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EscPosBuilder } from '../utils/escpos-builder';
import { toast } from 'sonner';

import {
    connectPocketPrinter as connectPocketBle,
    disconnectPocketPrinter as disconnectPocketBle,
    getActivePocketConnection,
    generatePocketTestCanvas,
    canvasToPocketRaster,
    executePocketPrintJob,
    POCKET_PRINT_WIDTH
} from '../utils/pocket-printer';

export type PrintMode = 'system' | 'bluetooth' | 'pocket' | 'rawbt' | 'network' | 'native_bridge';
export type PaperSize = '58mm' | '80mm';

interface PrinterState {
    printMode: PrintMode;
    paperSize: PaperSize;
    autoPrintOnCheckout: boolean;
    autoCut: boolean;
    openCashDrawer: boolean;
    bluetoothDeviceName: string | null;
    isBluetoothConnected: boolean;
    isScanning: boolean;
    lastError: string | null;

    // Pocket BLE Printer (Lucky Jingle / DP-L1S)
    pocketDeviceName: string | null;
    isPocketConnected: boolean;
    pocketBattery: number | null;

    // Network Printer state
    networkPrinterIp: string;
    networkPrinterPort: number;

    // Actions
    setPrintMode: (mode: PrintMode) => void;
    setPaperSize: (size: PaperSize) => void;
    setAutoPrintOnCheckout: (enabled: boolean) => void;
    setAutoCut: (enabled: boolean) => void;
    setOpenCashDrawer: (enabled: boolean) => void;
    setNetworkPrinterIp: (ip: string) => void;
    setNetworkPrinterPort: (port: number) => void;

    connectBluetoothPrinter: () => Promise<boolean>;
    disconnectBluetoothPrinter: () => void;
    sendBluetoothBytes: (bytes: Uint8Array) => Promise<boolean>;

    connectPocketPrinter: () => Promise<boolean>;
    disconnectPocketPrinter: () => void;

    testPrint: () => Promise<void>;
}

// Global active bluetooth GATT characteristic reference (not persisted)
let cachedGattServer: any = null;
let cachedCharacteristic: any = null;

// Common Bluetooth POS Printer GATT Services & Characteristics
const POS_PRINTER_SERVICES = [
    '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Printer Service
    '0000ff00-0000-1000-8000-00805f9b34fb', // ESC/POS Custom Service
    '0000ae30-0000-1000-8000-00805f9b34fb', // Xprinter / Goojprt Service
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Serial Port Service
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
];

export const usePrinterStore = create<PrinterState>()(
    persist(
        (set, get) => ({
            printMode: 'system',
            paperSize: '58mm',
            autoPrintOnCheckout: false,
            autoCut: true,
            openCashDrawer: false,
            bluetoothDeviceName: null,
            isBluetoothConnected: false,
            isScanning: false,
            lastError: null,

            pocketDeviceName: null,
            isPocketConnected: false,
            pocketBattery: null,

            networkPrinterIp: '192.168.1.200',
            networkPrinterPort: 9100,

            setPrintMode: (mode) => set({ printMode: mode, lastError: null }),
            setPaperSize: (size) => set({ paperSize: size }),
            setAutoPrintOnCheckout: (enabled) => set({ autoPrintOnCheckout: enabled }),
            setAutoCut: (enabled) => set({ autoCut: enabled }),
            setOpenCashDrawer: (enabled) => set({ openCashDrawer: enabled }),
            setNetworkPrinterIp: (ip) => set({ networkPrinterIp: ip }),
            setNetworkPrinterPort: (port) => set({ networkPrinterPort: port }),

            connectBluetoothPrinter: async () => {
                const nav = navigator as any;
                if (!nav.bluetooth) {
                    const msg = 'Web Bluetooth API is not supported on this browser or OS. Try Chrome on Android, macOS, or Windows.';
                    toast.error(msg);
                    set({ lastError: msg, isBluetoothConnected: false });
                    return false;
                }

                set({ isScanning: true, lastError: null });

                try {
                    toast.info('Scanning for Bluetooth POS Printers...');
                    const device = await nav.bluetooth.requestDevice({
                        acceptAllDevices: true,
                        optionalServices: POS_PRINTER_SERVICES,
                    });

                    if (!device) {
                        set({ isScanning: false });
                        return false;
                    }

                    device.addEventListener('gattserverdisconnected', () => {
                        cachedGattServer = null;
                        cachedCharacteristic = null;
                        set({ isBluetoothConnected: false, bluetoothDeviceName: null });
                        toast.warning('Bluetooth printer disconnected');
                    });

                    toast.loading(`Connecting to ${device.name || 'Printer'}...`, { id: 'bt-connect' });
                    const server = await device.gatt.connect();
                    cachedGattServer = server;

                    // Find writable characteristic across primary services
                    let targetChar: any = null;
                    const services = await server.getPrimaryServices();

                    for (const service of services) {
                        try {
                            const characteristics = await service.getCharacteristics();
                            for (const char of characteristics) {
                                if (char.properties.write || char.properties.writeWithoutResponse) {
                                    targetChar = char;
                                    break;
                                }
                            }
                        } catch (e) {
                            console.warn('Service scan error:', e);
                        }
                        if (targetChar) break;
                    }

                    if (!targetChar) {
                        throw new Error('No writable GATT characteristic found on printer');
                    }

                    cachedCharacteristic = targetChar;
                    const devName = device.name || 'Bluetooth Receipt Printer';

                    set({
                        isBluetoothConnected: true,
                        bluetoothDeviceName: devName,
                        printMode: 'bluetooth',
                        isScanning: false,
                        lastError: null,
                    });

                    toast.dismiss('bt-connect');
                    toast.success(`Connected to ${devName}!`);
                    return true;
                } catch (err: any) {
                    console.error('Bluetooth connection error:', err);
                    const errorMsg = err.message || 'Failed to connect Bluetooth printer';
                    toast.dismiss('bt-connect');
                    toast.error(errorMsg);
                    set({ isScanning: false, isBluetoothConnected: false, lastError: errorMsg });
                    return false;
                }
            },

            disconnectBluetoothPrinter: () => {
                if (cachedGattServer && cachedGattServer.connected) {
                    try {
                        cachedGattServer.disconnect();
                    } catch (e) {
                        console.warn('Disconnect error:', e);
                    }
                }
                cachedGattServer = null;
                cachedCharacteristic = null;
                set({
                    isBluetoothConnected: false,
                    bluetoothDeviceName: null,
                    printMode: 'system'
                });
                toast.info('Disconnected from Bluetooth printer');
            },

            sendBluetoothBytes: async (bytes: Uint8Array) => {
                if (!cachedCharacteristic || !cachedGattServer?.connected) {
                    const reconnected = await get().connectBluetoothPrinter();
                    if (!reconnected || !cachedCharacteristic) {
                        return false;
                    }
                }

                try {
                    const chunkSize = 128;
                    for (let i = 0; i < bytes.length; i += chunkSize) {
                        const chunk = bytes.subarray(i, i + chunkSize);
                        if (cachedCharacteristic.properties.writeWithoutResponse) {
                            await cachedCharacteristic.writeValueWithoutResponse(chunk);
                        } else {
                            await cachedCharacteristic.writeValue(chunk);
                        }
                        await new Promise(res => setTimeout(res, 20));
                    }
                    return true;
                } catch (err: any) {
                    console.error('Print bluetooth data send error:', err);
                    toast.error('Failed to send print job to Bluetooth printer');
                    set({ lastError: err.message || 'Print job transfer failed' });
                    return false;
                }
            },

            connectPocketPrinter: async () => {
                set({ isScanning: true, lastError: null });
                try {
                    const conn = await connectPocketBle((battery) => {
                        set({ pocketBattery: battery });
                    });
                    set({
                        isPocketConnected: true,
                        pocketDeviceName: conn.name,
                        pocketBattery: conn.battery,
                        printMode: 'pocket',
                        isScanning: false,
                        lastError: null,
                    });
                    toast.success(`Connected to ${conn.name}!`);
                    return true;
                } catch (err: any) {
                    console.error('Pocket printer connection error:', err);
                    const errorMsg = err?.message || 'Failed to connect Pocket printer';
                    toast.error(errorMsg);
                    set({ isScanning: false, isPocketConnected: false, lastError: errorMsg });
                    return false;
                }
            },

            disconnectPocketPrinter: () => {
                disconnectPocketBle().catch(() => {});
                set({
                    isPocketConnected: false,
                    pocketDeviceName: null,
                    pocketBattery: null,
                    printMode: 'system'
                });
                toast.info('Disconnected from Pocket printer');
            },

            testPrint: async () => {
                const { paperSize, printMode, sendBluetoothBytes } = get();

                if (printMode === 'pocket') {
                    let active = getActivePocketConnection();
                    if (!active || !active.connected()) {
                        const ok = await get().connectPocketPrinter();
                        if (!ok) return;
                        active = getActivePocketConnection();
                    }
                    if (!active) return;
                    const toastId = toast.loading('Sending test print to Pocket printer (Lucky Jingle)...');
                    try {
                        const testCanvas = generatePocketTestCanvas();
                        const raster = canvasToPocketRaster(testCanvas, POCKET_PRINT_WIDTH);
                        await executePocketPrintJob(active.writeChar, raster, {
                            labelMode: false,
                            density: 1,
                            feedDots: 80,
                        });
                        toast.dismiss(toastId);
                        toast.success('Pocket test receipt printed successfully!');
                    } catch (err: any) {
                        toast.dismiss(toastId);
                        toast.error(err?.message || 'Pocket printer test print failed');
                    }
                    return;
                }

                const builder = new EscPosBuilder(paperSize);
                builder.align('center');
                builder.bold(true);
                builder.textSize(2, 2);
                builder.textLine("OTTOR POS TEST");
                builder.textSize(1, 1);
                builder.bold(false);
                builder.lineFeed(1);
                builder.textLine(`Mode: ${printMode.toUpperCase()}`);
                builder.textLine(new Date().toLocaleString());
                builder.divider('-');
                builder.textLine("Paper Size: " + paperSize);
                builder.textLine("Status: OK");
                builder.divider('=');
                builder.cut();

                const bytes = builder.getBytes();

                if (printMode === 'bluetooth') {
                    const toastId = toast.loading('Sending test print command to Bluetooth...');
                    const success = await sendBluetoothBytes(bytes);
                    toast.dismiss(toastId);
                    if (success) {
                        toast.success('Test receipt printed successfully!');
                    }
                } else if (printMode === 'rawbt' || printMode === 'network') {
                    // Send test print via RawBT Intent
                    let binary = '';
                    for (let i = 0; i < bytes.length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    const base64Data = btoa(binary);
                    const intentUrl = `intent:#Intent;scheme=rawbt;package=ru.a4105.rawbt;S.base64=${encodeURIComponent(base64Data)};end;`;
                    window.location.href = intentUrl;
                    toast.success('Test print sent to Android RawBT / Network Printer Driver!');
                } else {
                    toast.info('Triggering System Print dialog for test print...');
                    window.print();
                }
            },
        }),
        {
            name: 'ottorpos-printer-settings',
            partialize: (state) => ({
                printMode: state.printMode,
                paperSize: state.paperSize,
                autoPrintOnCheckout: state.autoPrintOnCheckout,
                autoCut: state.autoCut,
                openCashDrawer: state.openCashDrawer,
                networkPrinterIp: state.networkPrinterIp,
                networkPrinterPort: state.networkPrinterPort,
            }),
        }
    )
);
