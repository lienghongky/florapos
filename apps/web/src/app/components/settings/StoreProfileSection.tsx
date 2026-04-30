import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/app/store/auth-store';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Upload, Store as StoreIcon, Save, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { OrderReceipt } from '@/app/components/orders/OrderReceipt';

export function StoreProfileSection() {
  const { user, selectedStore, updateStoreInfo, uploadStoreBanner, uploadStoreLogo } = useAuthStore();
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  
  const [taxId, setTaxId] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [website, setWebsite] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('');
  const [invoiceNextNumber, setInvoiceNextNumber] = useState(1);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [enableTax, setEnableTax] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedStore) {
      setName(selectedStore.name || '');
      setAddress(selectedStore.address || '');
      setPhone(selectedStore.phone_number || '');
      setDescription(selectedStore.description || '');
      setTaxId(selectedStore.tax_id || '');
      setTaxRate(selectedStore.tax_rate || 0);
      setWebsite(selectedStore.website || '');
      setReceiptFooter(selectedStore.receipt_footer_text || '');
      setInvoicePrefix(selectedStore.invoice_prefix || '');
      setInvoiceNextNumber(selectedStore.invoice_next_number || 1);
      setExchangeRate(selectedStore.exchange_rate || 1);
      setEnableTax(selectedStore.enable_tax ?? true);
      
      if (selectedStore.banner_image) {
        setBannerPreview(`/api${selectedStore.banner_image}`);
      } else {
        setBannerPreview(null);
      }

      if (selectedStore.logo_url) {
        setLogoPreview(`/api${selectedStore.logo_url}`);
      } else {
        setLogoPreview(null);
      }
    }
  }, [selectedStore]);

  const handleSave = async () => {
    if (!selectedStore) return;
    setIsSaving(true);
    try {
      await updateStoreInfo(selectedStore.id, {
        name,
        address,
        phone_number: phone,
        description,
        tax_id: taxId,
        tax_rate: Number(taxRate),
        website,
        receipt_footer_text: receiptFooter,
        invoice_prefix: invoicePrefix,
        invoice_next_number: Number(invoiceNextNumber),
        exchange_rate: Number(exchangeRate),
        enable_tax: enableTax
      });
      toast.success('Store information updated successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update store information');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStore) return;

    const reader = new FileReader();
    reader.onload = (e) => setBannerPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploadingBanner(true);
    try {
      await uploadStoreBanner(selectedStore.id, file);
      toast.success('Banner uploaded successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload banner');
      setBannerPreview(selectedStore.banner_image ? `/api${selectedStore.banner_image}` : null);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedStore) return;

    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploadingLogo(true);
    try {
      await uploadStoreLogo(selectedStore.id, file);
      toast.success('Logo uploaded successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload logo');
      setLogoPreview(selectedStore.logo_url ? `/api${selectedStore.logo_url}` : null);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  if (!selectedStore) return <div className="p-8 text-center text-muted-foreground">Select a store to view its profile.</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Store Profile</h2>
          <p className="text-sm text-muted-foreground">Manage your store's public identity and contact information.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : (
            <>
              <Save className="mr-2 size-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          {/* Images Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2 md:col-span-2">
            <Label>Store Banner</Label>
            <div className="relative h-48 w-full bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 overflow-hidden group">
              {bannerPreview ? (
                <img src={bannerPreview} alt="Store Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="size-10 mb-2 opacity-50" />
                  <p className="text-sm font-medium">No banner image</p>
                </div>
              )}
              
              <div className={`absolute inset-0 bg-black/50 transition-opacity flex items-center justify-center ${bannerPreview ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                <Button 
                  variant={bannerPreview ? "secondary" : "default"} 
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={isUploadingBanner}
                >
                  <Upload className="mr-2 size-4" />
                  {isUploadingBanner ? 'Uploading...' : 'Upload Banner'}
                </Button>
              </div>
              <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerChange} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Store Logo (Receipts)</Label>
            <div className="relative h-48 w-full bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 overflow-hidden group">
              {logoPreview ? (
                <img src={logoPreview} alt="Store Logo" className="w-full h-full object-contain p-4 bg-white" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                  <ImageIcon className="size-10 mb-2 opacity-50" />
                  <p className="text-sm font-medium">No logo uploaded</p>
                </div>
              )}
              
              <div className={`absolute inset-0 bg-black/50 transition-opacity flex items-center justify-center ${logoPreview ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                <Button 
                  variant={logoPreview ? "secondary" : "default"} 
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  size="sm"
                >
                  <Upload className="mr-2 size-4" />
                  {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                </Button>
              </div>
              <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoChange} />
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Store Name <span className="text-red-500">*</span></Label>
            <div className="relative">
              <StoreIcon className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input 
                className="pl-9" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="My Awesome Shop"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="+1 (555) 000-0000"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label>Physical Address</Label>
            <Input 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              placeholder="123 Main Street, Suite 100, City, Country"
            />
          </div>

          <div className="space-y-2">
            <Label>Website URL</Label>
            <Input 
              value={website} 
              onChange={(e) => setWebsite(e.target.value)} 
              placeholder="https://myflowershop.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Tax ID / VAT Number</Label>
            <Input 
              value={taxId} 
              onChange={(e) => setTaxId(e.target.value)} 
              placeholder="VAT-123456789"
            />
          </div>
          
          <div className="md:col-span-2">
            <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all">
              <div className="space-y-0.5">
                <Label className="text-base">Global Tax Setting</Label>
                <p className="text-xs text-muted-foreground">Manage tax calculation and display on receipts</p>
              </div>
              <div className="flex items-center gap-4">
                <AnimatePresence>
                  {enableTax && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="relative w-24 sm:w-32"
                    >
                      <Input 
                        type="number"
                        step="0.01"
                        value={taxRate} 
                        onChange={(e) => setTaxRate(Number(e.target.value))} 
                        placeholder="0.00"
                        className="h-10 pr-7 text-right font-bold border-brand-primary/20 focus:border-brand-primary"
                      />
                      <span className="absolute right-2.5 top-2.5 text-xs font-bold text-brand-primary">%</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  onClick={() => setEnableTax(!enableTax)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus:ring-2 focus:ring-brand-primary/20 outline-none ${enableTax ? 'bg-brand-primary' : 'bg-slate-300'}`}
                >
                  <div
                    className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-transform ${enableTax ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Exchange Rate (1 USD = ? KHR)</Label>
            <div className="relative">
               <Input 
                type="number"
                step="1"
                value={exchangeRate} 
                onChange={(e) => setExchangeRate(Number(e.target.value))} 
                placeholder="4100"
                className="pr-4"
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Commonly 4000 or 4100. This rate will be used for KHR conversions.</p>
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Invoice Prefix</Label>
              <Input 
                value={invoicePrefix} 
                onChange={(e) => setInvoicePrefix(e.target.value)} 
                placeholder="INV-"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Added to all generated invoice numbers.</p>
            </div>
            
            <div className="space-y-2">
              <Label>Next Invoice Number</Label>
              <Input 
                type="number"
                value={invoiceNextNumber} 
                onChange={(e) => setInvoiceNextNumber(Number(e.target.value))} 
                placeholder="1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">The very next invoice will use this number.</p>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Custom Receipt Footer</Label>
            <Input 
              value={receiptFooter} 
              onChange={(e) => setReceiptFooter(e.target.value)} 
              placeholder="Thank you for shopping with us! Returns accepted within 14 days."
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Store Description</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Tell your customers what makes your store special..."
              className="h-24 resize-none"
            />
          </div>
        </div>
        </div>

        <div className="xl:col-span-1 space-y-4">
          <Label>Live Receipt Preview</Label>
          <div className="rounded-xl border border-border bg-slate-50 p-4 flex justify-center items-start overflow-hidden">
             <div className="w-full scale-90 origin-top transform-gpu">
                <OrderReceipt 
                  storeOverride={{
                    name, address, phone_number: phone, tax_id: taxId, website, receipt_footer_text: receiptFooter, invoice_prefix: invoicePrefix, logo_url: logoPreview, exchange_rate: exchangeRate, enable_tax: enableTax
                  }} 
                  order={{
                    id: 'mock-123456',
                    order_number: '00019',
                    created_at: new Date().toISOString(),
                    status: 'completed',
                    order_type: 'delivery',
                    payment_method: 'cash',
                    subtotal: '50.00',
                    tax_total: '0.00',
                    discount_total: '0.00',
                    delivery_fee: '0.00',
                    grand_total: '50.00',
                    staff_name: user?.full_name || 'System',
                    items: [{
                      product_name_snapshot: 'Flower Bouquet Size M',
                      quantity: 1,
                      unit_price: '50.00',
                      line_total: '50.00'
                    }]
                  } as any} 
                />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
