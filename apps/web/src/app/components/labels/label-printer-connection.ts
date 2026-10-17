/** Connections belong exclusively to label printing, never the receipt printer store. */
export type DirectLabelMode = 'bluetooth' | 'usb';
export interface LabelConnection {
  mode: DirectLabelMode;
  id: string;
  name: string;
  connected: () => boolean;
  send: (bytes: Uint8Array) => Promise<void>;
  disconnect: () => Promise<void>;
}
let connection: LabelConnection | null = null;
let connecting = false;
const SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ae30-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
];
export function directLabelSupport(mode: DirectLabelMode): string | null {
  if (!window.isSecureContext) return 'Direct connections require HTTPS. Use System dialog on this page.';
  if (!(navigator as any)[mode]) return 'This browser does not support direct ' + (mode === 'usb' ? 'USB' : 'Bluetooth') + '. On iPad use System dialog / AirPrint or PDF with your printer app. On Android try Chrome.';
  return null;
}
export function getLabelConnection(mode: DirectLabelMode, id?: string) {
  return connection?.mode === mode && (!id || connection.id === id) && connection.connected() ? connection : null;
}
export async function disconnectLabelPrinter() {
  const old = connection; connection = null;
  if (old) await old.disconnect();
}

/** Must be called directly from a click, before any await, to open the browser chooser. */
export async function chooseLabelPrinter(mode: DirectLabelMode): Promise<LabelConnection> {
  const unsupported = directLabelSupport(mode);
  if (unsupported) throw new Error(unsupported);
  if (connecting) throw new Error('A printer chooser is already open.');
  connecting = true;
  try {
    if (mode === 'bluetooth') {
      const device = await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: SERVICES });
      await disconnectLabelPrinter();
      try {
        const server = await device.gatt.connect();
        let characteristic: any;
        for (const uuid of SERVICES) {
          try {
            const service = await server.getPrimaryService(uuid);
            const candidates = (await service.getCharacteristics()).filter((c: any) => c.properties.write || c.properties.writeWithoutResponse);
            if (candidates.length === 1) { characteristic = candidates[0]; break; }
          } catch { /* Try the next known printer service. */ }
        }
        if (!characteristic) throw new Error('No supported Bluetooth LE print service found. Bluetooth Classic and proprietary printers need their printer app or system driver.');
        const current: LabelConnection = {
          mode, id: device.id, name: device.name || 'Bluetooth label printer', connected: () => server.connected,
          disconnect: async () => server.disconnect(),
          send: async bytes => {
            // Conservative BLE payload size works with printers using the default 23-byte MTU.
            for (let offset = 0; offset < bytes.length; offset += 20) {
              if (!server.connected) throw new Error('Label printer disconnected. Some labels may already have printed.');
              const chunk = bytes.slice(offset, offset + 20);
              if (characteristic.properties.write) await characteristic.writeValueWithResponse(chunk);
              else { await characteristic.writeValueWithoutResponse(chunk); await new Promise(r => setTimeout(r, 10)); }
            }
          },
        };
        connection = current;
        device.addEventListener('gattserverdisconnected', () => { if (connection === current) connection = null; });
        return current;
      } catch (error) { device.gatt?.disconnect(); throw error; }
    }
    const device = await (navigator as any).usb.requestDevice({ filters: [{ classCode: 7 }, { classCode: 255 }] });
    await disconnectLabelPrinter();
    let claimed: number | undefined;
    try {
      await device.open();
      if (!device.configuration) await device.selectConfiguration(device.configurations[0]?.configurationValue || 1);
      let selected: { interfaceNumber: number; alternateSetting: number; endpointNumber: number } | undefined;
      for (const iface of device.configuration.interfaces) {
        for (const alternate of iface.alternates) {
          if (![7, 255].includes(alternate.interfaceClass)) continue;
          const endpoint = alternate.endpoints.find((e: any) => e.direction === 'out' && e.type === 'bulk');
          if (endpoint) { selected = { interfaceNumber: iface.interfaceNumber, alternateSetting: alternate.alternateSetting, endpointNumber: endpoint.endpointNumber }; break; }
        }
        if (selected) break;
      }
      if (!selected) throw new Error('No USB printer output found. Use the printer’s system driver.');
      await device.claimInterface(selected.interfaceNumber); claimed = selected.interfaceNumber;
      await device.selectAlternateInterface(selected.interfaceNumber, selected.alternateSetting);
      const endpoint = selected.endpointNumber;
      const current: LabelConnection = {
        mode, id: `${device.vendorId}:${device.productId}:${device.serialNumber || ''}`, name: device.productName || 'USB label printer', connected: () => device.opened,
        disconnect: async () => { try { if (device.opened) await device.releaseInterface(claimed); } finally { if (device.opened) await device.close(); } },
        send: async bytes => {
          for (let offset = 0; offset < bytes.length; offset += 4096) {
            const chunk = bytes.slice(offset, offset + 4096);
            const result = await device.transferOut(endpoint, chunk);
            if (result.status !== 'ok' || result.bytesWritten !== chunk.length) throw new Error('USB transfer failed. Some labels may already have printed. Check the printer before retrying.');
          }
        },
      };
      connection = current;
      return current;
    } catch (error) {
      try { if (claimed !== undefined && device.opened) await device.releaseInterface(claimed); } catch {}
      if (device.opened) await device.close();
      throw error;
    }
  } finally { connecting = false; }
}
