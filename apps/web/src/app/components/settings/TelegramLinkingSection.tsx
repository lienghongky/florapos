import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, QrCode, Link as LinkIcon, Check, X, RefreshCw, ExternalLink, Bot, BellRing, Crown, BarChart3, AlertTriangle } from 'lucide-react';

import { useAuthStore } from '@/app/store/auth-store';
import { telegramService, TelegramStatus, TelegramLinkResponse } from '@/app/services/telegram.service';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from '@/app/i18n';

export function TelegramLinkingSection() {
  const { token, user } = useAuthStore();
  const { t } = useTranslation();
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkData, setLinkData] = useState<TelegramLinkResponse | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [isGlobalEnabled, setIsGlobalEnabled] = useState(true);
  
  const planFeaturesArray = user?.subscription?.plan?.features || [];
  const flattenedFeaturesArray = (user?.subscription as any)?.plan_features || [];
  
  const hasTelegramFeature = planFeaturesArray.includes('telegram_notifications') || 
                            flattenedFeaturesArray.includes('telegram_notifications');

  // Linking is allowed if global setting is ON AND user has the feature
  const isLinkingEnabled = isGlobalEnabled && !!hasTelegramFeature;

  useEffect(() => {
    console.log('TelegramLinkingSection: Debug Info', {
      planName: user?.subscription?.plan?.name,
      planFeatures: planFeaturesArray,
      flattenedFeatures: flattenedFeaturesArray,
      hasTelegramFeature,
      isGlobalEnabled,
      isLinkingEnabled
    });
  }, [user, isGlobalEnabled, isLinkingEnabled]);

  const fetchStatus = async () => {
    if (!token) return;
    try {
      const [data, globalStatus] = await Promise.all([
        telegramService.getStatus(token),
        telegramService.getGlobalStatus(token)
      ]);
      setStatus(data);
      setIsGlobalEnabled(globalStatus.enabled);
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

  const handleTogglePreference = async (key: 'notify_orders' | 'notify_daily_summary' | 'notify_low_stock') => {
    if (!token || !status?.preferences) return;
    const currentVal = !!status.preferences[key];
    const newVal = !currentVal;

    // Optimistic update
    setStatus(prev => prev ? {
      ...prev,
      preferences: {
        ...prev.preferences!,
        [key]: newVal,
      },
    } : null);

    try {
      const updated = await telegramService.updatePreferences(token, { [key]: newVal });
      setStatus(prev => prev ? {
        ...prev,
        preferences: {
          ...prev.preferences!,
          ...updated,
        },
      } : null);
      toast.success(newVal ? 'Notification channel enabled' : 'Notification channel disabled');
    } catch (error: any) {
      // Revert on error
      setStatus(prev => prev ? {
        ...prev,
        preferences: {
          ...prev.preferences!,
          [key]: currentVal,
        },
      } : null);
      toast.error(error.message || 'Failed to update notification setting');
    }
  };

  const handleBatchTogglePreferences = async (enable: boolean) => {
    if (!token || !status?.preferences) return;
    const previous = { ...status.preferences };

    const newPrefs = {
      notify_orders: enable,
      notify_daily_summary: enable,
      notify_low_stock: enable,
    };

    setStatus(prev => prev ? {
      ...prev,
      preferences: newPrefs,
    } : null);

    try {
      const updated = await telegramService.updatePreferences(token, newPrefs);
      setStatus(prev => prev ? {
        ...prev,
        preferences: {
          ...prev.preferences!,
          ...updated,
        },
      } : null);
      toast.success(enable ? 'All notifications enabled' : 'All notifications muted');
    } catch (error: any) {
      setStatus(prev => prev ? {
        ...prev,
        preferences: previous,
      } : null);
      toast.error(error.message || 'Failed to update notification settings');
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
            <h3 className="text-lg font-bold text-slate-900">{t('settings.telegramTitle')}</h3>
            <p className="text-sm text-slate-500">{t('settings.telegramSubtitle')}</p>
          </div>
        </div>

        {status?.linked && !hasTelegramFeature && (
          <div className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-red-600 border border-red-100">
            <X className="size-4" />
            <span className="text-xs font-bold uppercase tracking-wider">{t('settings.upgradeRequired')}</span>
          </div>
        )}

        {status?.linked && hasTelegramFeature && (
          status.is_active ? (
            <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-green-600 border border-green-100">
              <Check className="size-4" />
              <span className="text-xs font-bold uppercase tracking-wider">{t('settings.linkedAs', { username: status.username || 'User' })}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-orange-600 border border-orange-100">
              <X className="size-4" />
              <span className="text-xs font-bold uppercase tracking-wider">{t('settings.accountSuspended')}</span>
            </div>
          )
        )}

        {!status?.linked && (
          !isLinkingEnabled ? (
            <div className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-red-600 border border-red-100">
              <X className="size-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {!hasTelegramFeature ? t('settings.upgradeRequired') : t('settings.featureDisabled')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-slate-500 border border-slate-100">
              <X className="size-4" />
              <span className="text-xs font-bold uppercase tracking-wider">{t('settings.notConnected')}</span>
            </div>
          )
        )}
      </div>

      <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-6 relative overflow-hidden">
        {status?.linked && !hasTelegramFeature && (
          <div className="absolute inset-0 z-10 bg-slate-50/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
            <div className="size-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4 shadow-xl">
              <Crown className="size-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">{t('settings.upgradePlan')}</h4>
            <p className="text-sm text-slate-600 max-w-xs mt-2">
              {t('settings.telegramUpgradeDesc')}
            </p>
            <button 
              onClick={() => (window as any).location.href = '/settings?tab=plan'}
              className="mt-6 rounded-xl bg-brand-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition-all"
            >
              {t('settings.viewPlans')}
            </button>
          </div>
        )}

        {status?.linked ? (
          <div className="space-y-6">
            {/* Interactive Notification Preferences */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{t('settings.notificationChannels')}</h4>
                  <p className="text-xs text-slate-500">{t('settings.notificationChannelsDesc')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBatchTogglePreferences(true)}
                    className="text-[11px] font-bold text-brand-primary hover:text-brand-primary/80 px-2.5 py-1 rounded-lg hover:bg-brand-primary/5 transition-colors active:scale-95"
                  >
                    {t('settings.enableAll')}
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleBatchTogglePreferences(false)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors active:scale-95"
                  >
                    {t('settings.disableAll')}
                  </button>
                </div>
              </div>

              {/* Channels Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Channel 1: Order Notifications */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  status.preferences?.notify_orders 
                    ? 'bg-white border-emerald-200/90 shadow-sm' 
                    : 'bg-white/60 border-slate-200/70 opacity-75'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                        status.preferences?.notify_orders ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <BellRing className="size-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">{t('settings.orders')}</h5>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${
                          status.preferences?.notify_orders ? 'text-emerald-600' : 'text-slate-400'
                        }`}>
                          {status.preferences?.notify_orders ? t('settings.enabled') : t('settings.disabled')}
                        </span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        checked={!!status.preferences?.notify_orders}
                        onChange={() => handleTogglePreference('notify_orders')}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2">
                    {t('settings.orderNotificationsDesc')}
                  </p>
                </div>

                {/* Channel 2: Daily Sales Summary */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  status.preferences?.notify_daily_summary 
                    ? 'bg-white border-blue-200/90 shadow-sm' 
                    : 'bg-white/60 border-slate-200/70 opacity-75'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                        status.preferences?.notify_daily_summary ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <BarChart3 className="size-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">{t('settings.reports')}</h5>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${
                          status.preferences?.notify_daily_summary ? 'text-blue-600' : 'text-slate-400'
                        }`}>
                          {status.preferences?.notify_daily_summary ? t('settings.enabled') : t('settings.disabled')}
                        </span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        checked={!!status.preferences?.notify_daily_summary}
                        onChange={() => handleTogglePreference('notify_daily_summary')}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2">
                    {t('settings.dailySummaryDesc')}
                  </p>
                </div>

                {/* Channel 3: Low Stock Alerts */}
                <div className={`p-4 rounded-2xl border transition-all ${
                  status.preferences?.notify_low_stock 
                    ? 'bg-white border-amber-200/90 shadow-sm' 
                    : 'bg-white/60 border-slate-200/70 opacity-75'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                        status.preferences?.notify_low_stock ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        <AlertTriangle className="size-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">{t('settings.lowStock')}</h5>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${
                          status.preferences?.notify_low_stock ? 'text-amber-600' : 'text-slate-400'
                        }`}>
                          {status.preferences?.notify_low_stock ? t('settings.enabled') : t('settings.disabled')}
                        </span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input 
                        type="checkbox" 
                        checked={!!status.preferences?.notify_low_stock}
                        onChange={() => handleTogglePreference('notify_low_stock')}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2.5 line-clamp-2">
                    {t('settings.lowStockDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <button
                onClick={() => window.open(`https://t.me/${status.bot_username || 'bot'}`, '_blank')}
                className="w-full sm:w-auto rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white flex items-center justify-center gap-2 hover:bg-brand-primary transition-all active:scale-95 shadow-sm"
              >
                <ExternalLink className="size-4" />
                {t('settings.openBot')}
              </button>
              <button
                onClick={handleUnlink}
                className="w-full sm:w-auto rounded-xl border border-red-100 bg-red-50 px-6 py-3 text-sm font-bold text-red-600 hover:bg-red-100 transition-all active:scale-95"
              >
                {t('settings.disconnectAccount')}
              </button>
            </div>
            {!status.is_active && (
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 text-orange-700 text-xs font-medium flex items-center gap-3">
                <X className="size-4 shrink-0" />
                <span>Your Telegram account has been temporarily disabled by the administrator. You will not receive any notifications until it is re-enabled.</span>
              </div>
            )}
            <p className="text-[10px] text-slate-400 text-center sm:text-left italic">
              {t('settings.botSettingsHint')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="size-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Bot className="size-10" />
              </div>
              <div className="max-w-md">
                <h4 className="font-bold text-slate-900">
                  {isLinkingEnabled ? t('settings.connectAccount') : t('settings.featureDisabled')}
                </h4>
                <p className="text-sm text-slate-500">
                  {isLinkingEnabled 
                    ? t('settings.connectAccountDesc')
                    : 'The administrator has temporarily disabled new Telegram account links. Existing links will continue to function.'}
                </p>
              </div>
              
              {!linkData ? (
                <motion.button
                  whileHover={isLinkingEnabled ? { scale: 1.02 } : {}}
                  whileTap={isLinkingEnabled ? { scale: 0.98 } : {}}
                  onClick={handleGenerateLink}
                  disabled={isGenerating || !isLinkingEnabled}
                  className={`rounded-2xl px-8 py-3.5 font-bold text-white shadow-xl transition-all flex items-center gap-2 ${
                    isLinkingEnabled 
                      ? 'bg-brand-primary shadow-brand-primary/20 hover:bg-brand-primary/90' 
                      : 'bg-slate-300 shadow-none cursor-not-allowed'
                  }`}
                >
                  {isGenerating ? <RefreshCw className="size-5 animate-spin" /> : <LinkIcon className="size-5" />}
                  {isLinkingEnabled ? t('settings.generateLink') : t('settings.featureDisabled')}
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
                        toast.success(t('settings.copied'));
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
                      {t('settings.openBot')}
                    </button>
                    <button
                      onClick={() => setShowQR(true)}
                      className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                    >
                      <QrCode className="size-4" />
                      {t('settings.showQrCode')}
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
                  <h3 className="text-xl font-black text-slate-900">{t('settings.scanQrCode')}</h3>
                  <p className="text-sm text-slate-500">{t('settings.scanQrDesc')}</p>
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
                  {t('settings.done')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
