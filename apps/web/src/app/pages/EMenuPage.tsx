import { useEffect, useState, useRef, useMemo } from 'react';
import { useEmenuStore } from '@/app/store/emenu-store';
import { useAuthStore } from '@/app/store/auth-store';
import { useProductStore } from '@/app/store/product-store';
import { QRCodeSVG } from 'qrcode.react';
import {
  Store as StoreIcon,
  QrCode,
  Settings as SettingsIcon,
  Package,
  Upload,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Palette,
  Globe,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Layout,
  Plus,
  Lock,
  Download,
  Trash2,
  Image as ImageIcon,
  QrCode as QrCodeIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { getAllTemplates } from '@/app/emenu/templates';

export function EMenuPage() {
  const { selectedStore, user } = useAuthStore();
  const {
    settings,
    loading,
    fetchSettings,
    updateSettings,
    uploadBanner,
    emenuProductIds,
    fetchEmenuProducts,
    toggleProductVisibility
  } = useEmenuStore();
  const { products, refreshProducts } = useProductStore();

  const [activeTab, setActiveTab] = useState<'editor' | 'branding' | 'publish'>('editor');
  const [searchQuery, setSearchQuery] = useState('');
  const [tags, setTags] = useState('');
  const [newTag, setNewTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (settings?.qr_tags?.includes(newTag.trim())) {
      toast.error('This tag already exists');
      return;
    }
    const updatedTags = [...(settings?.qr_tags || []), newTag.trim()];
    updateSettings(selectedStore.id, { qr_tags: updatedTags });
    setNewTag('');
    toast.success(`Tag "${newTag.trim()}" added`);
  };

  const handleRemoveTag = (tag: string) => {
    const updatedTags = (settings?.qr_tags || []).filter(t => t !== tag);
    updateSettings(selectedStore.id, { qr_tags: updatedTags });
    if (tags === tag) setTags('');
    toast.success(`Tag "${tag}" removed`);
  };

  const downloadQR = (id: string, fileName: string) => {
    const svg = document.getElementById(id);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Increase resolution for better print quality
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${fileName}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
        toast.success(`Downloading ${fileName}.png`);
      }
    };

    // Convert to UTF-8 aware base64
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.src = url;
  };

  useEffect(() => {
    if (selectedStore) {
      fetchSettings(selectedStore.id);
      refreshProducts();
      fetchEmenuProducts(selectedStore.id);
    }
  }, [selectedStore, fetchSettings, refreshProducts, fetchEmenuProducts]);

  const categorizedProducts = useMemo(() => {
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groups: Record<string, typeof products> = {};
    filtered.forEach(p => {
      const catName = p.category?.name || 'Uncategorized';
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(p);
    });
    return groups;
  }, [products, searchQuery]);

  if (!selectedStore) return null;

  const publicUrl = `${window.location.origin}/menu/${selectedStore.id}${tags ? `?tag=${encodeURIComponent(tags)}` : ''}`;

  const handleToggleEmenu = (checked: boolean) => {
    updateSettings(selectedStore.id, { is_enabled: checked });
  };

  const handleTogglePrices = (checked: boolean) => {
    updateSettings(selectedStore.id, { show_prices: checked });
  };

  const handleToggleOrdering = (checked: boolean) => {
    updateSettings(selectedStore.id, { allow_ordering: checked });
  };

  const handleToggleRequireName = (checked: boolean) => {
    updateSettings(selectedStore.id, { require_customer_name: checked });
  };

  const handleToggleRequirePhone = (checked: boolean) => {
    updateSettings(selectedStore.id, { require_customer_phone: checked });
  };

  const handleToggleProduct = (productId: string) => {
    const isVisible = emenuProductIds.includes(productId);
    toggleProductVisibility(selectedStore.id, productId, !isVisible);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size should be less than 2MB');
        return;
      }
      await uploadBanner(selectedStore.id, file);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('URL copied to clipboard');
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      {/* Unified Editor Container */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden flex flex-col md:flex-row h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)]">

        {/* Unified Sidebar */}
        <aside className="w-full md:w-72 bg-slate-50/80 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-6 md:p-8 border-b border-slate-200/60">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="size-10 rounded-xl bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/30">
                <Layout className="size-6" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 leading-tight">E-menu Editor</h1>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Build Mode</span>
              </div>
            </div>

            <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-2.5 px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all shrink-0 ${activeTab === 'editor' ? 'bg-white text-brand-primary shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/30'
                  }`}
              >
                <Package className="size-4 md:size-5" />
                Menu Items
              </button>
              <button
                onClick={() => setActiveTab('branding')}
                className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-2.5 px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all shrink-0 ${activeTab === 'branding' ? 'bg-white text-brand-primary shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/30'
                  }`}
              >
                <Palette className="size-4 md:size-5" />
                Styling
              </button>
              <button
                onClick={() => setActiveTab('publish')}
                className={`flex-1 md:w-full flex items-center justify-center md:justify-start gap-2.5 px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all shrink-0 ${activeTab === 'publish' ? 'bg-white text-brand-primary shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/30'
                  }`}
              >
                <Globe className="size-4 md:size-5" />
                Publish
              </button>
            </nav>
          </div>

          <div className="hidden md:flex p-8 flex-1 flex-col overflow-y-auto">
            <div className="space-y-8">
              {/* Unified Status & Preview Card */}
              <div className={`rounded-2xl p-6 transition-all border ${settings?.is_enabled
                ? 'bg-emerald-50 border-emerald-100 text-emerald-900 shadow-sm shadow-emerald-100'
                : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className={`size-2 rounded-full ${settings?.is_enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${settings?.is_enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {settings?.is_enabled ? 'Live' : 'Inactive'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={!!settings?.is_enabled} onChange={(e) => handleToggleEmenu(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-black transition-all active:scale-95 ${settings?.is_enabled
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                    : 'bg-white text-slate-400 cursor-not-allowed opacity-50 border border-slate-200'
                    }`}
                  onClick={(e) => !settings?.is_enabled && e.preventDefault()}
                >
                  <Eye className="size-3.5" />
                  View Live Menu
                </a>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Quick Settings</p>
                <div className="space-y-4 px-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Show Prices</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={!!settings?.show_prices} onChange={(e) => handleTogglePrices(e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Allow Order</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={!!settings?.allow_ordering} onChange={(e) => handleToggleOrdering(e.target.checked)} className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {settings?.allow_ordering && (
                      <div className="ml-4 pl-4 border-l-2 border-slate-100 space-y-4 pt-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500">Require Name</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={!!settings?.require_customer_name} onChange={(e) => handleToggleRequireName(e.target.checked)} className="sr-only peer" />
                            <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-primary"></div>
                          </label>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500">Require Phone</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={!!settings?.require_customer_phone} onChange={(e) => handleToggleRequirePhone(e.target.checked)} className="sr-only peer" />
                            <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-primary"></div>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Unified Content Panel */}
        <main className="flex-1 overflow-y-auto bg-white">
          <header className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-30 gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {activeTab === 'editor' && "Menu Builder"}
                {activeTab === 'branding' && "Visual Styling"}
                {activeTab === 'publish' && "Publish & Distribution"}
              </h2>
              <p className="text-slate-400 text-sm font-medium mt-1">
                {activeTab === 'editor' && "Select and organize items for your digital menu."}
                {activeTab === 'branding' && "Customize the aesthetic to match your brand."}
                {activeTab === 'publish' && "Generate QR codes and access links."}
              </p>
            </div>

            {activeTab === 'editor' && (
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none transition-all font-medium"
                />
              </div>
            )}
          </header>

          <div className="p-4 sm:p-6 md:p-10">
            {activeTab === 'editor' && (
              <div className="space-y-12 max-w-5xl">
                {Object.entries(categorizedProducts).map(([category, items]) => (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center gap-4">
                      <h3 className="font-black text-slate-800 text-lg uppercase tracking-wider">{category}</h3>
                      <div className="h-px flex-1 bg-slate-100"></div>
                      <span className="text-[10px] font-black text-slate-400">{items.length} Items</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {items.map(product => {
                        const isVisible = emenuProductIds.includes(product.id);
                        return (
                          <div
                            key={product.id}
                            onClick={() => handleToggleProduct(product.id)}
                            className={`group p-4 rounded-[1.25rem] border transition-all cursor-pointer flex items-center justify-between ${isVisible ? 'bg-brand-primary/5 border-brand-primary/20 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'
                              }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="size-14 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100 p-0.5">
                                {product.image_url ? (
                                  <img src={product.image_url} alt="" className="size-full object-cover rounded-[0.85rem]" />
                                ) : (
                                  <div className="size-full flex items-center justify-center bg-slate-100 rounded-[0.85rem]">
                                    <Package className="size-6 text-slate-300" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className={`font-bold transition-colors ${isVisible ? 'text-slate-900' : 'text-slate-600'}`}>{product.name}</p>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">${Number(product.base_price).toFixed(2)}</p>
                              </div>
                            </div>

                            <div className={`size-7 rounded-full border-2 flex items-center justify-center transition-all ${isVisible ? 'bg-brand-primary border-brand-primary shadow-lg shadow-brand-primary/20' : 'border-slate-100 bg-slate-50 group-hover:border-slate-300'
                              }`}>
                              {isVisible ? <Check className="size-4 text-white" /> : <Plus className="size-4 text-slate-200" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {Object.keys(categorizedProducts).length === 0 && (
                  <div className="py-24 text-center">
                    <div className="size-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Package className="size-10 text-slate-200" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">No matching items</h3>
                    <p className="text-slate-400 font-medium mt-2">Adjust your search or add new products to the catalog.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'branding' && settings && (
              <div className="max-w-3xl space-y-12">
                <section>
                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-8">
                    <div>
                      <label className="block text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Hero Banner Image</label>
                      <div className="relative overflow-hidden rounded-[1.75rem] aspect-[21/9] bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group cursor-pointer hover:border-brand-primary/50 transition-all shadow-inner">
                        {settings.banner_image || selectedStore.banner_image ? (
                          <>
                            <img src={settings.banner_image || selectedStore.banner_image} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                              <button onClick={() => fileInputRef.current?.click()} className="px-6 py-3 bg-white text-slate-900 font-black text-sm rounded-2xl shadow-2xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all active:scale-95">
                                <Upload className="size-4" /> Change Background
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-6" onClick={() => fileInputRef.current?.click()}>
                            <div className="size-14 bg-slate-50 rounded-full flex items-center justify-center shadow-sm mx-auto mb-4 border border-slate-100">
                              <Upload className="size-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-black text-slate-700">Click to upload banner</p>
                            <p className="text-xs font-bold text-slate-400 mt-1">Recommended: 1200x480px</p>
                          </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
                      </div>
                    </div>

                    <div className="pt-8 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-6">
                        <label className="block text-sm font-black text-slate-800 uppercase tracking-widest">Select Menu Template</label>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">2 Templates Free</span>
                      </div>

                      <div className="space-y-16">
                        {[
                          { plan: 'FREE', title: 'Starter Templates', badge: 'bg-emerald-50 text-emerald-600', description: 'Available for all stores to get started.' },
                          { plan: 'PRO', title: 'Pro Templates', badge: 'bg-brand-primary/10 text-brand-primary', description: 'Advanced professional designs for growing brands.' },
                          { plan: 'ELITE', title: 'Elite Templates', badge: 'bg-purple-100 text-purple-600', description: 'Exclusive high-end immersive experiences.' }
                        ].map(section => {
                          const sectionTemplates = getAllTemplates().filter(t => (t.metadata.requiredPlan || 'FREE') === section.plan);
                          if (sectionTemplates.length === 0 && section.plan !== 'ELITE') return null;

                          return (
                            <div key={section.plan} className="space-y-8">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                  <h4 className="text-sm font-black text-slate-900">{section.title}</h4>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${section.badge}`}>
                                    {section.plan}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 font-medium">{section.description}</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {sectionTemplates.map(template => {
                                  const userPlan = user?.subscription?.plan?.name?.toUpperCase() || 'FREE';
                                  const requiredPlan = template.metadata.requiredPlan || 'FREE';

                                  const plans = ['FREE', 'PRO', 'ELITE'];
                                  const userPlanIndex = plans.indexOf(userPlan);
                                  const requiredPlanIndex = plans.indexOf(requiredPlan);
                                  const isLocked = userPlanIndex < requiredPlanIndex;

                                  return (
                                    <div
                                      key={template.metadata.id}
                                      onClick={() => {
                                        if (isLocked) {
                                          toast.error(`This template requires a ${requiredPlan} plan.`, {
                                            description: 'Upgrade your subscription to unlock premium designs.',
                                            position: 'top-center'
                                          });
                                          return;
                                        }
                                        updateSettings(selectedStore.id, { template_id: template.metadata.id });
                                      }}
                                      className={`group relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${settings.template_id === template.metadata.id || (!settings.template_id && template.metadata.id === 'default')
                                        ? 'border-brand-primary shadow-2xl shadow-brand-primary/20 scale-[1.02]'
                                        : 'border-slate-100 hover:border-slate-200'
                                        } ${isLocked ? 'grayscale-[0.5] opacity-80' : ''}`}
                                    >
                                      <div className="aspect-[4/5] bg-slate-100 overflow-hidden relative">
                                        <img src={template.metadata.previewImage} alt={template.metadata.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />

                                        {isLocked && (
                                          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white">
                                            <div className="size-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-2">
                                              <Lock className="size-6" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{requiredPlan} PLAN</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="p-6 bg-white">
                                        <div className="flex items-center justify-between mb-2">
                                          <h5 className="font-black text-slate-900">{template.metadata.name}</h5>
                                          {(settings.template_id === template.metadata.id || (!settings.template_id && template.metadata.id === 'default')) && (
                                            <div className="size-8 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-brand-primary/30">
                                              <CheckCircle2 className="size-5" />
                                            </div>
                                          )}
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed">{template.metadata.description}</p>
                                      </div>

                                      {!(settings.template_id === template.metadata.id || (!settings.template_id && template.metadata.id === 'default')) && !isLocked && (
                                        <div className="absolute inset-0 bg-brand-primary/0 group-hover:bg-brand-primary/5 transition-colors" />
                                      )}
                                    </div>
                                  );
                                })}

                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'publish' && settings && (
              <div className="max-w-6xl space-y-8">
                {/* Minimal Info Banner */}
                <div className="bg-emerald-50/40 border border-emerald-100/50 p-6 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="size-12 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0">
                    <ExternalLink className="size-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-emerald-900 tracking-tight">Distribution Ready</h4>
                    <p className="text-emerald-700/70 text-xs font-bold leading-relaxed max-w-2xl">
                      Generate unique QR codes for tables or areas. When customers scan them, their table name will be automatically attached to their order in your POS.
                    </p>
                  </div>
                </div>

                {/* Main Link Section */}
                <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 md:space-y-10">
                  <div className="flex flex-col xl:flex-row gap-10 items-start">
                    <div className="flex-1 space-y-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-black text-slate-800 uppercase tracking-widest">Store E-Menu Link</label>
                        <p className="text-xs font-bold text-slate-400">This is your general menu link, perfect for Instagram bio or website.</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 p-1.5 bg-slate-50 rounded-2xl md:rounded-[1.5rem] border border-slate-100">
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}/menu/${selectedStore.id}`}
                          className="flex-1 px-4 md:px-5 py-2.5 md:py-3 bg-transparent text-slate-600 text-xs md:text-sm font-bold focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/menu/${selectedStore.id}`);
                            toast.success('Main URL copied');
                          }}
                          className="px-6 py-2.5 sm:py-0 bg-white border border-slate-200 text-slate-900 font-black text-xs md:text-sm rounded-xl md:rounded-[1.15rem] shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Copy className="size-3.5 md:size-4" /> Copy
                        </button>
                      </div>
                    </div>

                    <div className="w-full lg:w-64 bg-slate-50 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-100 flex flex-col items-center shadow-inner relative overflow-hidden group/gen">
                      <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover/gen:opacity-100 transition-opacity duration-500" />
                      <div className="relative z-10 bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/60 mb-6 group-hover/gen:scale-105 transition-transform duration-500 border border-slate-50 flex flex-col items-center">
                        <QRCodeSVG
                          id="general-qr"
                          value={`${window.location.origin}/menu/${selectedStore.id}`}
                          size={140}
                          bgColor={"#ffffff"}
                          fgColor={"#0f172a"}
                          level={"H"}
                          imageSettings={selectedStore.logo_url ? {
                            src: selectedStore.logo_url,
                            height: 32,
                            width: 32,
                            excavate: true,
                          } : undefined}
                        />
                        <p className="mt-4 text-[9px] font-black text-slate-800 uppercase tracking-widest">{selectedStore.name}</p>
                      </div>
                      <div className="relative z-10 text-center space-y-3">
                        <div className="text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Store Identity</p>
                          <h5 className="text-xs font-black text-slate-900">General QR Code</h5>
                        </div>
                        <button
                          onClick={() => downloadQR('general-qr', `${selectedStore.name}_General_QR`)}
                          className="px-4 py-2 bg-white border border-slate-200 text-slate-900 rounded-xl text-[10px] font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Download className="size-3" /> Download PNG
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Management Section */}
                <div className="space-y-8">
                  <div className="flex flex-col justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Table & Tags QR Codes</h3>
                      <p className="text-slate-400 text-sm font-medium mt-1">Generate unique codes for every table. Orders will be tagged automatically.</p>
                    </div>

                    <div className="flex w-full sm:w-auto justify-between gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                      <input
                        type="text"
                        placeholder="Table name (e.g. T-01)"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                        className="flex-1 sm:w-48 px-4 py-2 text-sm bg-transparent border-none outline-none font-bold text-slate-600"
                      />
                      <button
                        onClick={handleAddTag}
                        className="px-5 bg-slate-900 text-white font-black text-xs rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2"
                      >
                        <Plus className="size-3.5" /> Add Table
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                    {(settings?.qr_tags || []).map((tag) => {
                      const encodedTag = btoa(tag);
                      const tagUrl = `${window.location.origin}/menu/${selectedStore.id}?tag=${encodeURIComponent(encodedTag)}`;
                      return (
                        <div
                          key={tag}
                          className="group bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-brand-primary/10 transition-all duration-500 flex flex-col items-center text-center relative overflow-hidden"
                        >
                          {/* Decorative Background Element */}
                          <div className="absolute -top-10 -right-10 size-32 bg-brand-primary/5 rounded-full blur-3xl group-hover:bg-brand-primary/10 transition-colors" />

                          <div className="relative bg-white p-7 rounded-[2.5rem] mb-6 shadow-xl shadow-slate-100/50 group-hover:scale-105 transition-transform duration-500 border border-slate-50 flex flex-col items-center">
                            <QRCodeSVG
                              id={`qr-${tag.replace(/\s+/g, '-')}`}
                              value={tagUrl}
                              size={160}
                              bgColor={"#ffffff"}
                              fgColor={"#0f172a"}
                              level={"H"}
                              includeMargin={false}
                              imageSettings={selectedStore.logo_url ? {
                                src: selectedStore.logo_url,
                                height: 34,
                                width: 34,
                                excavate: true,
                              } : undefined}
                            />
                            <p className="mt-4 text-[10px] font-black text-slate-800 uppercase tracking-widest">{selectedStore.name}</p>
                          </div>

                          <div className="space-y-1 mb-8">
                            <h5 className="font-black text-slate-900 text-xl tracking-tight">{tag}</h5>
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="size-1.5 rounded-full bg-brand-primary animate-pulse" />
                              <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">Ready to Scan</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 w-full relative z-10">
                            <div className="flex items-center gap-2 w-full">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(tagUrl);
                                  toast.success(`Link for ${tag} copied`);
                                }}
                                className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95"
                              >
                                <Copy className="size-3.5" /> Copy Link
                              </button>
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="px-4 py-3.5 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all active:scale-95 border border-slate-100"
                              >
                                <Plus className="size-4 rotate-45" />
                              </button>
                            </div>
                            <button
                              onClick={() => downloadQR(`qr-${tag.replace(/\s+/g, '-')}`, `${selectedStore.name}_${tag.replace(/\s+/g, '_')}_QR`)}
                              className="w-full py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-black hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                              <Download className="size-3.5" /> Download QR
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {(settings?.qr_tags || []).length === 0 && (
                      <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-50 rounded-[3rem] bg-slate-50/30">
                        <div className="size-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <QrCode className="size-10 text-slate-200" />
                        </div>
                        <h4 className="text-xl font-black text-slate-900">No tables defined</h4>
                        <p className="text-slate-400 font-medium mt-2 max-w-xs mx-auto">Add your first table using the input above to generate unique QR codes.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
