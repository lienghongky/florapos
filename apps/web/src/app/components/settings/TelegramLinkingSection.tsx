import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, QrCode, Link as LinkIcon, Check, X, RefreshCw, ExternalLink, Bot, BellRing } from 'lucide-react';
import { useAuthStore } from '@/app/store/auth-store';
import { telegramService, TelegramStatus, TelegramLinkResponse } from '@/app/services/telegram.service';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

export function TelegramLinkingSection() {
  const { token, user } = useAuthStore();
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkData, setLinkData] = useState<TelegramLinkResponse | null>(null);
  const [showQR, setShowQR] = useState(false);

  const fetchStatus = async () => {
    if (!token) return;
    try {
      const data = await telegramService.getStatus(token);
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch Telegram status', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [token]);

  const handleGenerateLink = async () => {
    if (!token) return;
    setIsGenerating(true);
    try {
      const data = await telegramService.generateLink(token);
      setLinkData(data);
      toast.success('Invite link generated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUnlink = async () => {
    if (!token || !confirm('Are you sure you want to disconnect your Telegram account?')) return;
    try {
      await telegramService.unlink(token);
      setStatus({ linked: false });
      setLinkData(null);
      toast.success('Telegram account disconnected');
    } catch (error: any) {
      toast.error(error.message || 'Failed to unlink');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="size-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
            <Send className="size-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Telegram Notifications</h3>
            <p className="text-sm text-slate-500">Get real-time order alerts and daily summaries</p>
          </div>
        </div>

        {status?.linked ? (
          <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-green-600 border border-green-100">
            <Check className="size-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Linked as @{status.username || 'User'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-slate-500 border border-slate-100">
            <X className="size-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Not Connected</span>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-6">
        {status?.linked ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
                <div className={`size-8 rounded-lg flex items-center justify-center ${status.preferences?.notify_orders ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                  <BellRing className="size-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orders</p>
                  <p className="text-xs font-bold text-slate-700">{status.preferences?.notify_orders ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
                <div className={`size-8 rounded-lg flex items-center justify-center ${status.preferences?.notify_daily_summary ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Bot className="size-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reports</p>
                  <p className="text-xs font-bold text-slate-700">{status.preferences?.notify_daily_summary ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-3">
                <div className="size-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Bot className="size-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bot Access</p>
                  <p className="text-xs font-bold text-slate-700">Full Menu</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <button
                onClick={() => window.open(`https://t.me/${status.username || 'bot'}`, '_blank')}
                className="w-full sm:w-auto rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white flex items-center justify-center gap-2 hover:bg-brand-primary transition-all"
              >
                <ExternalLink className="size-4" />
                Open Telegram
              </button>
              <button
                onClick={handleUnlink}
                className="w-full sm:w-auto rounded-xl border border-red-100 bg-red-50 px-6 py-3 text-sm font-bold text-red-600 hover:bg-red-100 transition-all"
              >
                Disconnect Account
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center sm:text-left italic">
              Manage specific notification toggles directly within the Telegram bot using /settings.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="size-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Bot className="size-10" />
              </div>
              <div className="max-w-md">
                <h4 className="font-bold text-slate-900">Connect your account</h4>
                <p className="text-sm text-slate-500">Generate a unique invite link to link your Telegram account and start receiving notifications.</p>
              </div>
              
              {!linkData ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerateLink}
                  disabled={isGenerating}
                  className="rounded-2xl bg-brand-primary px-8 py-3.5 font-bold text-white shadow-xl shadow-brand-primary/20 transition-all hover:bg-brand-primary/90 flex items-center gap-2"
                >
                  {isGenerating ? <RefreshCw className="size-5 animate-spin" /> : <LinkIcon className="size-5" />}
                  Generate Invite Link
                </motion.button>
              ) : (
                <div className="w-full space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <input 
                      readOnly 
                      value={linkData.link} 
                      className="flex-1 bg-transparent border-none outline-none text-xs text-slate-600 font-mono"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(linkData.link);
                        toast.success('Link copied to clipboard');
                      }}
                      className="p-2 hover:bg-slate-50 rounded-xl text-brand-primary"
                    >
                      <LinkIcon className="size-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => window.open(linkData.link, '_blank')}
                      className="w-full sm:w-auto rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white flex items-center justify-center gap-2 hover:bg-brand-primary transition-all shadow-lg"
                    >
                      <ExternalLink className="size-4" />
                      Open Bot
                    </button>
                    <button
                      onClick={() => setShowQR(true)}
                      className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      <QrCode className="size-4" />
                      Show QR Code
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && linkData && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowQR(false)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="size-6 text-slate-400" />
              </button>
              
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Scan QR Code</h3>
                  <p className="text-sm text-slate-500">Scan this code with your phone camera or Telegram to link your account.</p>
                </div>
                
                <div className="flex justify-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <QRCodeSVG 
                      value={linkData.link} 
                      size={200}
                      level="H"
                      includeMargin={false}
                      imageSettings={{
                        src: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
                        x: undefined,
                        y: undefined,
                        height: 40,
                        width: 40,
                        excavate: true,
                      }}
                    />
                  </div>
                </div>
                
                <div className="text-xs text-slate-400 italic">
                  Expires in {linkData.expires_in}
                </div>
                
                <button
                  onClick={() => setShowQR(false)}
                  className="w-full rounded-2xl bg-slate-900 py-4 font-black text-white shadow-xl hover:bg-brand-primary transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
