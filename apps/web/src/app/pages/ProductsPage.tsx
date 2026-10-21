import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { useProductStore } from '@/app/store/product-store';
import { useAuthStore } from '@/app/store/auth-store';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, Search, Filter, ArrowUpDown, Eye, EyeOff, Image as ImageIcon, Upload, X, Check, AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Tag, Camera } from 'lucide-react';
import { PrintLabelsModal } from '@/app/components/labels/PrintLabelsModal';
import { CameraScannerModal } from '@/app/components/pos/CameraScannerModal';
import { scanFeedback } from '@/app/lib/scan-feedback';
import { cleanScannedCode } from '@/app/lib/product-code-index';
import { useSearchParams } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { AnimatedModal } from '@/app/components/motion/AnimatedPage';
import { toast } from 'sonner';
import { ProductInventorySection } from '@/app/components/products/ProductInventorySection';
import { PageHeader } from '@/app/components/ui/page-header';
import { ModifierGroup, ModifierOption } from '@/app/types';
import { useInventoryStore } from '@/app/store/inventory-store';
import { useTranslation } from '@/app/i18n';
import { normalizeImage } from '@/app/utils/image-processor';

export interface ProductOption {
  id: string;
  name: string;
  type: 'checkbox' | 'radio';
  price: number;
}

/** 12-digit in-store barcode: '2' + 10 random digits + check digit (scanner-readable, never clashes with retail codes). */
const generateBarcode = () => {
  let body = '2';
  for (let i = 0; i < 10; i++) body += Math.floor(Math.random() * 10);
  let sum = 0;
  for (let i = 0; i < 11; i++) sum += Number(body[i]) * (i % 2 === 0 ? 3 : 1);
  return body + ((10 - (sum % 10)) % 10);
};

/** Readable SKU from the product name, e.g. 'Latte' -> 'LAT-4821'. */
const generateSku = (name: string) => {
  const prefix = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'PRD';
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
};

export function ProductsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, addProduct, updateProduct, deleteProduct, categories, addProductCategory, refreshProducts, refreshProductCategories } = useProductStore();
  const { refreshInventory } = useInventoryStore();
  const { user, selectedStore } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [showLabels, setShowLabels] = useState(false);
  const [labelProductIds, setLabelProductIds] = useState<string[] | undefined>(undefined);
  const openLabels = (ids?: string[]) => { setLabelProductIds(ids); setShowLabels(true); };

  // Camera Scanner Modal State
  const [cameraModal, setCameraModal] = useState<{
    isOpen: boolean;
    mode: 'form-barcode' | 'page-quick-scan';
  }>({ isOpen: false, mode: 'form-barcode' });

  // Search, Filter, Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState('All');
  const [sortOption, setSortOption] = useState('created-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;


  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    costPrice: '',
    stock: '',
    unit: 'piece' as 'piece' | 'stem' | 'bouquet',
    trackInventory: true,
    type: 'simple' as 'simple' | 'composite',
    inventoryItemId: '',
    recipe: [] as any[],
    category_id: '',
    lowStockThreshold: '10',
    isActive: true,
    allowNegativeStock: false,
    options: [] as ProductOption[],
    image: '',
    imagePreview: '',
    imageFile: null as File | null,
    tags: [] as string[],
    sku: '',
    barcode: '',
    modifierGroups: [] as ModifierGroup[],
  });

  // Tag chip input state
  const [tagInput, setTagInput] = useState('');
  // Once the user edits the SKU manually, stop auto-filling it from the name
  const [skuTouched, setSkuTouched] = useState(false);


  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const skuInputRef = useRef<HTMLInputElement>(null);

  // Hardware barcode scanner detection (replaces existing barcode instead of appending)
  useEffect(() => {
    let buffer = '';
    let firstAt = 0;
    let lastAt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let focusedEl: HTMLInputElement | null = null;
    let originalVal = '';

    const reset = () => {
      buffer = '';
      clearTimeout(timer);
    };

    const isFast = () => {
      return buffer.length >= 3 && (lastAt - firstAt) / (buffer.length - 1) < 45;
    };

    const applyScannedCode = (raw: string) => {
      const code = cleanScannedCode(raw);
      if (!code) return;

      if (showModal) {
        // Modal is open: replace code in the form
        if (focusedEl === skuInputRef.current) {
          // User explicitly focused SKU input
          setFormData(prev => ({ ...prev, sku: code }));
          scanFeedback.success();
          scanFeedback.vibrate();
          toast.success(`SKU scanned: ${code}`);
        } else {
          // User focused barcode input or any other field (name/price) or nothing
          if (focusedEl && focusedEl !== barcodeInputRef.current) {
            // Restore whatever was in that field before scanner burst typed into it
            focusedEl.value = originalVal;
            focusedEl.dispatchEvent(new Event('input', { bubbles: true }));
          }

          // REPLACE the barcode field (never append!)
          setFormData(prev => ({
            ...prev,
            barcode: code,
            sku: (!prev.sku || prev.sku.startsWith('PRD-')) ? code : prev.sku,
          }));

          scanFeedback.success();
          scanFeedback.vibrate();
          toast.success(`Barcode scanned: ${code}`);
        }
      } else {
        // Main products page: quick search/lookup or open new product
        handleCameraDetected(code);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when modifier keys are held or during IME composition
      if (e.ctrlKey || e.altKey || e.metaKey || e.isComposing) {
        reset();
        return;
      }

      // If camera scanner modal is open, let camera handle it
      if (cameraModal.isOpen) {
        reset();
        return;
      }

      const target = e.target as HTMLElement | null;
      const currentInput = target?.tagName === 'INPUT' ? (target as HTMLInputElement) : null;
      const now = performance.now();

      // Enter or Tab triggers scanner completion
      if (e.key === 'Enter' || e.key === 'Tab') {
        if (isFast()) {
          e.preventDefault();
          e.stopPropagation();
          applyScannedCode(buffer);
        }
        reset();
        return;
      }

      // Check for single printable character
      if (e.key.length !== 1) {
        if (e.key !== 'Shift') reset();
        return;
      }

      // Reset buffer if gap between keys exceeds 80ms (human typing)
      if (buffer && now - lastAt >= 80) {
        reset();
      }

      if (!buffer) {
        firstAt = now;
        focusedEl = currentInput;
        originalVal = currentInput?.value || '';
      }

      buffer += e.key;
      lastAt = now;

      // Fallback timer for scanners that do not send an Enter key
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (isFast()) {
          applyScannedCode(buffer);
        }
        reset();
      }, 70);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      reset();
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [showModal, cameraModal.isOpen, products]);

  // Fetch fresh data whenever this page mounts or the store changes
  useEffect(() => {
    refreshProducts();
    refreshProductCategories();
    refreshInventory();
  }, [selectedStore?.id]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedTag]);

  // Derived state
  const uniqueCategories = ['All', ...categories.map(c => c.name)];

  const displayProducts = products.map(product => {
    const categoryName = categories.find(c => c.id === product.category_id)?.name || 'Uncategorized';

    return {
      ...product,
      category: categoryName,
      price: product.base_price,
      stock: product.track_inventory ? (product.calculated_stock ?? 0) : 0,
      unit: 'piece',
      trackInventory: product.track_inventory,
      allowNegativeStock: product.allow_negative_stock,
      type: product.product_type,
      inventoryItemId: product.recipe?.[0]?.inventory_item_id || '',
      recipe: product.recipe || [],
      lowStockThreshold: product.low_stock_threshold || 10,
      isActive: product.is_active,
      options: [],
      image: product.image_url || '',
      tags: product.tags || [],
    };
  });

  // Collect all unique tags across all products for the filter bar
  const allTags = ['All', ...Array.from(new Set(displayProducts.flatMap(p => p.tags || []))).sort()];

  const filteredProducts = displayProducts
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.tags || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesTag = selectedTag === 'All' || (product.tags || []).map(t => t.toLowerCase()).includes(selectedTag.toLowerCase());
      return matchesSearch && matchesCategory && matchesTag;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'stock-asc': return a.stock - b.stock;
        case 'stock-desc': return b.stock - a.stock;
        case 'updated-desc': {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateB - dateA || b.name.localeCompare(a.name);
        }
        case 'created-desc': {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA || b.name.localeCompare(a.name);
        }
        default: return 0;
      }
    });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenModal = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        costPrice: product.cost_price?.toString() || '0',
        stock: product.stock.toString(),
        unit: product.unit || 'piece',
        trackInventory: product.trackInventory ?? true,
        type: product.type || 'simple',
        inventoryItemId: product.inventoryItemId || '',
        recipe: product.recipe || [],
        category_id: product.category_id || '',
        lowStockThreshold: product.lowStockThreshold?.toString() || '10',
        isActive: product.isActive ?? true,
        allowNegativeStock: product.allowNegativeStock ?? false,
        options: product.options || [],
        image: product.image,
        imagePreview: '',
        imageFile: null,
        tags: product.tags || [],
        sku: product.sku || '',
        barcode: product.barcode || '',
        modifierGroups: product.modifier_groups || [],
      });
      setTagInput('');
      setSkuTouched(true);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        stock: '',
        unit: 'piece',
        trackInventory: true,
        type: 'simple',
        inventoryItemId: '',
        recipe: [],
        category_id: '',
        lowStockThreshold: '10',
        isActive: true,
        allowNegativeStock: false,
        options: [],
        image: 'placeholder',
        imagePreview: '',
        imageFile: null,
        tags: [],
        sku: generateSku(''),
        barcode: generateBarcode(),
        modifierGroups: [],
      });
      setTagInput('');
      setSkuTouched(false);

    }
    setShowModal(true);
    setIsAddingNewCategory(false);
  };

  useEffect(() => {
    const barcode = searchParams.get('barcode');
    if (!barcode || user?.role?.toLowerCase() !== 'owner') return;
    handleOpenModal();
    setFormData(previous => ({ ...previous, barcode }));
    setSearchParams(previous => { const next = new URLSearchParams(previous); next.delete('barcode'); return next; }, { replace: true });
  }, [searchParams, user?.role]);

  const handleCameraDetected = (rawCode: string) => {
    const code = cleanScannedCode(rawCode);
    if (!code) return false;

    scanFeedback.success();
    scanFeedback.vibrate();

    if (cameraModal.mode === 'form-barcode') {
      setFormData(prev => ({
        ...prev,
        barcode: code,
        // If sku is empty or default auto-generated, also sync with scanned code
        sku: (!prev.sku || prev.sku.startsWith('PRD-')) ? code : prev.sku,
      }));
      toast.success(`Barcode scanned: ${code}`);
      return true;
    }

    if (cameraModal.mode === 'page-quick-scan') {
      const normalized = code.toLowerCase();
      const existing = products.find(p =>
        (p.barcode && p.barcode.toLowerCase() === normalized) ||
        (p.sku && p.sku.toLowerCase() === normalized) ||
        (p.variants || []).some(v =>
          (v.barcode && v.barcode.toLowerCase() === normalized) ||
          (v.sku && v.sku.toLowerCase() === normalized)
        )
      );

      if (existing) {
        toast.info(`Found existing product: ${existing.name}`);
        handleOpenModal(existing);
      } else {
        toast.success(`New code: ${code}. Opening new product form.`);
        handleOpenModal();
        setFormData(prev => ({
          ...prev,
          barcode: code,
          sku: code,
        }));
      }
      return true;
    }

    return false;
  };

  const barcodeConflict = formData.barcode?.trim()
    ? products.find(p =>
        p.id !== editingProduct?.id &&
        (
          (p.barcode && p.barcode.trim() === formData.barcode.trim()) ||
          (p.variants || []).some(v => v.barcode && v.barcode.trim() === formData.barcode.trim())
        )
      )
    : null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsProcessingImage(true);
        const { file: normalizedFile, previewUrl } = await normalizeImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.85,
        });

        setFormData(prev => ({
          ...prev,
          imageFile: normalizedFile,
          imagePreview: previewUrl,
        }));
      } catch (err: any) {
        console.error('Image processing error:', err);
        toast.error(err?.message || 'Failed to process image');
      } finally {
        setIsProcessingImage(false);
        if (e.target) e.target.value = '';
      }
    }
  };


  const handleAddNewCategory = async () => {
    if (newCategoryName.trim()) {
      try {
        await addProductCategory({
          name: newCategoryName.trim(),
          display_order: 0,
          is_active: true
        });
        setFormData({ ...formData, category_id: newCategoryName.trim() }); // Temporary store name for new category
        setNewCategoryName('');
        setIsAddingNewCategory(false);
        toast.success('New category added!');
      } catch (error: any) {
        console.error('Category creation error:', error);
        toast.error(error.message || 'Failed to add category');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.price || !formData.category_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.type === 'composite' && formData.trackInventory && formData.recipe.length === 0) {
      toast.error('Composite products must have at least one component');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('base_price', formData.price);
    // If category_id is a name (from new category flow), try to find the ID after refresh
    let finalCategoryId = formData.category_id;
    if (finalCategoryId && !finalCategoryId.includes('-')) { // Simple check for UUID vs name
      finalCategoryId = categories.find(c => c.name === formData.category_id)?.id || '';
    }
    formDataToSend.append('category_id', finalCategoryId);
    formDataToSend.append('product_type', formData.type);
    formDataToSend.append('pricing_type', 'fixed');
    formDataToSend.append('cost_price', formData.costPrice || '0');
    formDataToSend.append('taxable', 'true');
    formDataToSend.append('tax_rate', '0');
    formDataToSend.append('track_inventory', formData.trackInventory.toString());
    formDataToSend.append('allow_negative_stock', formData.allowNegativeStock.toString());
    formDataToSend.append('low_stock_threshold', formData.lowStockThreshold);
    formDataToSend.append('is_active', formData.isActive.toString());
    formDataToSend.append('sku', formData.sku);
    formDataToSend.append('barcode', formData.barcode);

    if (!editingProduct && formData.type === 'simple') {
      formDataToSend.append('initial_stock', formData.stock || '0');
    }

    if (formData.imageFile) {
      // New file uploaded — send it as multipart
      formDataToSend.append('image', formData.imageFile);
    } else if (editingProduct) {
      // No new file — preserve the existing image by sending back its server-relative path.
      // The frontend stores images as '/api/uploads/...' but the backend expects '/uploads/...',
      // so strip the '/api' prefix before sending.
      const existingUrl = formData.image && formData.image !== 'placeholder' ? formData.image : null;
      if (existingUrl) {
        const serverPath = existingUrl.startsWith('/api') ? existingUrl.slice(4) : existingUrl;
        formDataToSend.append('image_url', serverPath);
      }
    }

    const recipe = formData.recipe
      .filter((r: any) => r.inventory_item_id)
      .map((r: any) => ({
        inventory_item_id: r.inventory_item_id,
        quantity_required: parseFloat(r.quantity_required.toString()) || 0
      }));
    formDataToSend.append('recipe', JSON.stringify(recipe));

    // Legacy addons/variants are no longer sent as they are replaced by modifier_groups
    formDataToSend.append('addons', JSON.stringify([]));
    formDataToSend.append('variants', JSON.stringify([]));

    const modifierGroups = formData.modifierGroups.map(group => ({
      ...group,
      id: (group.id && group.id.length > 30) ? group.id : undefined,
      options: group.options.map(o => ({
        ...o,
        id: (o.id && o.id.length > 30) ? o.id : undefined,
        price_adjustment: parseFloat(o.price_adjustment?.toString() || '0')
      }))
    }));
    formDataToSend.append('modifier_groups', JSON.stringify(modifierGroups));

    // Append tags — clean up whitespace and remove duplicates
    const cleanTags = [...new Set(formData.tags.map(t => t.trim()).filter(Boolean))];
    formDataToSend.append('tags', JSON.stringify(cleanTags));

    if (editingProduct) {
      try {
        await updateProduct(editingProduct.id, formDataToSend);
        toast.success('Product updated successfully!');
        setShowModal(false);
      } catch (error: any) {
        toast.error(error?.message || 'Failed to update product');
      }
    } else {
      try {
        await addProduct(formDataToSend);
        toast.success('Product added successfully!');
        setShowModal(false);
      } catch (error: any) {
        toast.error(error?.message || 'Failed to add product');
      }
    }

  };

  const isFormValid = formData.name && formData.price && formData.category_id;

  return (
    <AnimatedPage className="space-y-6">
      <PageHeader
        title={t('products.title')}
        subtitle={t('products.subtitle')}
        action={user?.role?.toLowerCase() === 'owner' && (
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCameraModal({ isOpen: true, mode: 'page-quick-scan' })}
              className="flex items-center gap-2 rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm font-semibold text-foreground shadow-xs transition-all hover:border-brand-primary/40 hover:text-brand-primary"
              title={t('products.scanToAdd')}
            >
              <Camera className="size-4 text-brand-primary" />
              <span className="hidden sm:inline">{t('products.scanToAdd')}</span>
            </motion.button>
            <motion.button
              id="print-labels-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openLabels()}
              className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-bold text-foreground shadow-sm transition-all hover:border-brand-primary/40 hover:text-brand-primary"
            >
              <Tag className="size-4" />
              <span className="hidden sm:inline">Print Labels</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90 active:scale-95"
            >
              <Plus className="size-4" />
              {t('products.addProduct')}
            </motion.button>
          </div>
        )}
      />

      <CameraScannerModal
        isOpen={cameraModal.isOpen}
        onClose={() => setCameraModal(prev => ({ ...prev, isOpen: false }))}
        onDetected={handleCameraDetected}
        title={cameraModal.mode === 'form-barcode' ? t('products.scanBarcode') : t('products.scanToAdd')}
        subtitle={cameraModal.mode === 'form-barcode' ? 'Point camera at the QR code or barcode to input number' : 'Point camera at any QR code or barcode to look up or create'}
        initialContinuous={false}
      />

      <PrintLabelsModal
        isOpen={showLabels}
        onClose={() => setShowLabels(false)}
        products={products}
        categories={categories}
        storeId={selectedStore?.id}
        storeName={(selectedStore as any)?.name}
        initialProductIds={labelProductIds}
        generateBarcode={generateBarcode}
        onSaveBarcode={async (product, barcode) => {
          const fd = new FormData();
          fd.append('name', product.name);
          fd.append('sku', product.sku || '');
          fd.append('barcode', barcode);
          await updateProduct(product.id, fd);
        }}
      />


      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('products.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted/30 py-2 pl-9 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div className="flex gap-3 justify-between sm:justify-start  w-full sm:w-auto">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 rounded-lg border border-border bg-muted/30 pl-9 pr-8 text-sm outline-none focus:border-primary/50"
              >
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? t('common.all') : cat}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="h-10 rounded-lg border border-border bg-muted/30 pl-9 pr-0 text-sm outline-none focus:border-primary/50"
              >
                <option value="created-desc">Newest First</option>
                <option value="updated-desc">Recently Updated</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-asc">Price (Low-High)</option>
                <option value="price-desc">Price (High-Low)</option>
                <option value="stock-asc">Stock (Low-High)</option>
                <option value="stock-desc">Stock (High-Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tag Filter Chips — only shown when tags exist */}
        {allTags.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 px-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('products.filterByTag')}</span>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all ${selectedTag === tag
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                {tag === 'All' ? `✦ ${t('common.all')}` : `# ${tag}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Card List — shown only on small screens */}
      <div className="sm:hidden space-y-3">
        {paginatedProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`rounded-xl border border-border bg-white shadow-sm p-3 flex items-center gap-3 ${!product.isActive ? 'opacity-60' : ''}`}
          >
            {/* Image */}
            <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
              <img
                src={product.image || `https://images.unsplash.com/photo-1520763185298-1b434c919102?w=80&h=80&fit=crop`}
                alt={product.name}
                className="size-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x80?text=None'; }}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm truncate">{product.name}</p>
                <span className="text-sm font-bold text-foreground shrink-0">${product.price.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {/* Stock badge */}
                {product.trackInventory ? (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${product.stock === 0 ? 'bg-gray-100 text-gray-700' :
                    product.stock <= product.lowStockThreshold ? 'bg-red-100 text-red-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                    <span className={`size-1.5 rounded-full ${product.stock === 0 ? 'bg-gray-400' : 'bg-current'}`} />
                    {product.stock === 0 ? t('products.outOfStock') : `${product.stock} ${t('products.inStock')}`}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">{t('products.unlimited')}</span>
                )}
                {/* Status badge */}
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${product.isActive ? 'text-green-600' : 'text-muted-foreground'
                  }`}>
                  {product.isActive ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                  {product.isActive ? t('products.active') : t('products.hidden')}
                </span>
              </div>
            </div>

            {/* Actions */}
            {user?.role?.toLowerCase() === 'owner' && (
              <div className="flex flex-col gap-1 shrink-0">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleOpenModal(product)}
                  className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                >
                  <Edit2 className="size-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={async () => {
                    if (confirm(t('products.deleteConfirm'))) {
                      try {
                        await deleteProduct(product.id);
                        toast.success('Product deleted successfully!');
                      } catch (error: any) {
                        toast.error(error.message || 'Failed to delete product');
                      }
                    }
                  }}
                  className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                </motion.button>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Desktop Table — hidden on small screens */}
      <div className="hidden sm:block rounded-xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('products.image')}</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('products.productName')}</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('products.category')}</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('products.tags')}</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('products.price')}</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('products.stock')}</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">{t('products.status')}</th>
                {user?.role?.toLowerCase() === 'owner' && (
                  <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">{t('products.actions')}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product, index) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className={`group border-b border-border last:border-0 transition-colors hover:bg-muted/50 ${!product.isActive ? 'opacity-60 bg-muted/20' : ''}`}
                >
                  <td className="px-6 py-4">
                    <div className="size-10 overflow-hidden rounded-lg bg-muted relative">
                      <img
                        src={product.image || `https://images.unsplash.com/photo-1520763185298-1b434c919102?w=80&h=80&fit=crop`}
                        alt={product.name}
                        className="size-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/80x80?text=None';
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{product.category}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {(product.tags || []).length > 0 ? (
                        (product.tags as string[]).map(tag => (
                          <button
                            key={tag}
                            onClick={() => setSelectedTag(selectedTag === tag ? 'All' : tag)}
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all ${selectedTag === tag
                              ? 'bg-brand-primary text-white'
                              : 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100'
                              }`}
                          >
                            # {tag}
                          </button>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground/40 italic">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    {product.trackInventory ? (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${product.stock === 0
                          ? 'bg-gray-100 text-gray-700'
                          : product.stock <= product.lowStockThreshold
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                          }`}
                      >
                        <span className={`size-1.5 rounded-full ${product.stock === 0 ? 'bg-gray-400' : 'bg-current'}`} />
                        {product.stock === 0 ? t('products.outOfStock') : product.stock}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">{t('products.unlimited')}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${product.isActive ? 'text-green-600' : 'text-muted-foreground'
                      }`}>
                      {product.isActive ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                      {product.isActive ? t('products.active') : t('products.hidden')}
                    </span>
                  </td>
                  {user?.role?.toLowerCase() === 'owner' && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Print label"
                          onClick={() => openLabels([product.id])}
                          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Tag className="size-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleOpenModal(product)}
                          className="rounded-lg p-2 text-primary transition-colors hover:bg-primary/10"
                        >
                          <Edit2 className="size-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={async () => {
                            if (confirm(t('products.deleteConfirm'))) {
                              try {
                                await deleteProduct(product.id);
                                toast.success('Product deleted successfully!');
                              } catch (error: any) {
                                toast.error(error.message || 'Failed to delete product');
                              }
                            }
                          }}
                          className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                        </motion.button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of <span className="font-medium text-foreground">{filteredProducts.length}</span> products
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex size-9 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground transition-all hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                // Only show a few page numbers if there are many
                if (totalPages > 7 && page !== 1 && page !== totalPages && Math.abs(page - currentPage) > 1) {
                  if (page === 2 || page === totalPages - 1) return <span key={page} className="px-1 text-muted-foreground">...</span>;
                  return null;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`size-9 rounded-lg text-sm font-bold transition-all ${currentPage === page
                      ? 'bg-brand-primary text-white shadow-md'
                      : 'border border-border bg-white text-muted-foreground hover:bg-muted'
                      }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex size-9 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground transition-all hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Product Creation/Edit Modal */}
      <AnimatedModal isOpen={showModal} onClose={() => setShowModal(false)} closeOnClickOutside={false}>
        <div className="rounded-t-3xl sm:rounded-xl bg-white p-0 shadow-xl w-full max-w-5xl my-0 sm:my-auto flex flex-col" style={{ maxHeight: '92dvh' }}>
          <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {editingProduct ? t('products.editProduct') : t('products.addProduct')}
            </h2>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6 sm:space-y-8">
            <form id="product-form" onSubmit={handleSubmit} className="space-y-8">
              {/* Image Upload Section */}
              <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4 sm:gap-6">
                <div className="flex sm:flex-col items-center gap-4 sm:gap-0">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative size-20 sm:size-28 shrink-0 rounded-xl border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-all overflow-hidden"
                  >
                    {isProcessingImage ? (
                      <div className="flex flex-col items-center gap-1.5 text-primary p-2 text-center">
                        <RefreshCw className="size-5 animate-spin" />
                        <span className="text-[9px] uppercase font-bold tracking-wider">Optimizing...</span>
                      </div>
                    ) : formData.imagePreview || (editingProduct && formData.image && formData.image !== 'placeholder') ? (
                      <img
                        src={formData.imagePreview || formData.image}
                        alt="Preview"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground p-2 text-center">
                        <ImageIcon className="size-6" />
                        <span className="text-[10px] uppercase font-semibold">{t('products.upload')}</span>
                      </div>
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-xs backdrop-blur-[1px]">
                      Change
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  {/* Price preview — inline on mobile, stacked on desktop */}
                  <div className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-0 sm:mt-4">
                    <p className="text-[10px] text-muted-foreground sm:text-center">Mobile & camera photos auto-optimized</p>
                    <div className="hidden sm:flex flex-col items-center mt-2">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">{t('products.pricePreview')}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-muted-foreground">$</span>
                        <span className="text-4xl font-black tracking-tighter text-slate-900">
                          {(() => {
                            const val = parseFloat(formData.price || '0');
                            return val % 1 === 0 ? val.toString() : val.toFixed(2);
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t('products.productName')} <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Red Rose Bouquet"
                      value={formData.name}
                      onChange={e => {
                        const name = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          name,
                          // Keep the number part stable, only refresh the prefix while auto-filling
                          sku: skuTouched ? prev.sku : `${name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'PRD'}-${prev.sku.split('-')[1] || Math.floor(1000 + Math.random() * 9000)}`,
                        }));
                      }}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">{t('products.sku')}</label>
                      <div className="relative">
                        <input
                          ref={skuInputRef}
                          type="text"
                          placeholder="e.g. ROSE-001"
                          value={formData.sku}
                          onChange={e => { setSkuTouched(true); setFormData({ ...formData, sku: e.target.value }); }}
                          onFocus={e => e.target.select()}
                          className="w-full rounded-lg border border-border bg-white py-2 pl-3 pr-9 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                        <button
                          type="button"
                          title="Generate SKU"
                          onClick={() => { setSkuTouched(false); setFormData({ ...formData, sku: generateSku(formData.name) }); }}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-all hover:bg-muted hover:text-primary active:rotate-180"
                        >
                          <RefreshCw className="size-3.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-sm font-medium">{t('products.barcode')}</label>
                        {barcodeConflict && (
                          <span className="text-xs text-amber-600 font-medium flex items-center gap-1" title={barcodeConflict.name}>
                            <AlertCircle className="size-3" />
                            Already used by "{barcodeConflict.name}"
                          </span>
                        )}
                      </div>
                      <div className="relative flex items-center">
                        <input
                          ref={barcodeInputRef}
                          type="text"
                          placeholder="Scan QR/barcode or generate"
                          value={formData.barcode}
                          onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                          onFocus={e => e.target.select()}
                          onPaste={e => {
                            const pasted = e.clipboardData.getData('text');
                            if (pasted && pasted.trim()) {
                              e.preventDefault();
                              setFormData(prev => ({ ...prev, barcode: cleanScannedCode(pasted.trim()) }));
                            }
                          }}
                          onKeyDown={e => { if (e.key === 'Enter') e.preventDefault(); /* scanners send Enter */ }}
                          className={`w-full rounded-lg border bg-white py-2 pl-3 pr-28 font-mono text-sm outline-none transition-all focus:ring-2 ${
                            barcodeConflict ? 'border-amber-400 focus:ring-amber-200' : 'border-border focus:ring-primary/20'
                          }`}
                        />
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            type="button"
                            title={t('products.scanWithCamera')}
                            onClick={() => setCameraModal({ isOpen: true, mode: 'form-barcode' })}
                            className="flex items-center gap-1 rounded-md bg-brand-primary/10 px-2 py-1 text-xs font-semibold text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-2xs"
                          >
                            <Camera className="size-3.5" />
                            <span className="text-[11px]">{t('products.scanBarcode')}</span>
                          </button>
                          <button
                            type="button"
                            title="Generate barcode"
                            onClick={() => setFormData({ ...formData, barcode: generateBarcode() })}
                            className="rounded-md p-1.5 text-muted-foreground transition-all hover:bg-muted hover:text-primary active:rotate-180"
                          >
                            <RefreshCw className="size-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Point camera at any QR code or retail barcode to insert number instantly.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t('products.category')} <span className="text-red-500">*</span></label>
                    {!isAddingNewCategory ? (
                      <div className="flex gap-2">
                        <select
                          required
                          value={formData.category_id}
                          onChange={(e) => {
                            if (e.target.value === 'new') {
                              setIsAddingNewCategory(true);
                            } else {
                              setFormData({ ...formData, category_id: e.target.value });
                            }
                          }}
                          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="">{t('products.selectCategory')}</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                          <option value="new" className="font-semibold text-primary">{t('products.addNewCategory')}</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                        <input
                          type="text"
                          placeholder="New category name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleAddNewCategory}
                          className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                          <Check className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingNewCategory(false)}
                          className="p-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Selling Price <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        className="w-full rounded-lg border border-border bg-white pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>


                </div>
              </div>

              {/* Tags Section */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Tags
                  <span className="ml-2 text-xs text-muted-foreground font-normal">Press Enter to add</span>
                </label>
                {/* Chip display + input */}
                <div
                  className="min-h-[42px] flex flex-wrap gap-1.5 items-center rounded-lg border border-border bg-white px-3 py-2 cursor-text focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all"
                  onClick={() => (document.getElementById('tag-input-field') as HTMLInputElement)?.focus()}
                >
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 px-2.5 py-0.5 text-xs font-semibold text-violet-700"
                    >
                      # {tag}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })}
                        className="ml-0.5 rounded-full hover:bg-violet-200 p-0.5 transition-colors"
                      >
                        <X className="size-2.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    id="tag-input-field"
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const newTag = tagInput.trim();
                        if (newTag && !formData.tags.includes(newTag)) {
                          setFormData({ ...formData, tags: [...formData.tags, newTag] });
                        }
                        setTagInput('');
                      } else if (e.key === 'Backspace' && !tagInput && formData.tags.length > 0) {
                        setFormData({ ...formData, tags: formData.tags.slice(0, -1) });
                      }
                    }}
                    onBlur={() => {
                      // Commit whatever is in the input when focus leaves
                      const newTag = tagInput.trim();
                      if (newTag && !formData.tags.includes(newTag)) {
                        setFormData({ ...formData, tags: [...formData.tags, newTag] });
                      }
                      setTagInput('');
                    }}
                    placeholder={formData.tags.length === 0 ? 'e.g. seasonal, bestseller, vegan' : ''}
                    className="flex-1 min-w-[140px] outline-none bg-transparent text-sm placeholder:text-muted-foreground/50"
                  />
                </div>
                {/* Suggested tags (quick-add) */}
                {allTags.filter(t => t !== 'All' && !formData.tags.includes(t)).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide self-center">Existing:</span>
                    {allTags.filter(t => t !== 'All' && !formData.tags.includes(t)).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, tags: [...formData.tags, t] })}
                        className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-violet-300 px-2 py-0.5 text-[10px] font-semibold text-violet-500 hover:bg-violet-50 transition-colors"
                      >
                        + {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>



              {/* Inventory Section (Unified) */}
              <ProductInventorySection
                trackInventory={formData.trackInventory}
                onTrackChange={(trackInventory) => setFormData({ ...formData, trackInventory })}
                stock={formData.stock}
                onStockChange={(stock) => setFormData({ ...formData, stock })}
                unit={formData.unit}
                onUnitChange={(unit) => setFormData({ ...formData, unit })}
                recipe={formData.recipe}
                onRecipeChange={(recipe) => {
                  // Infer type based on recipe presence
                  const newType = recipe.length > 0 ? 'composite' : 'simple';
                  setFormData({ ...formData, recipe, type: newType });
                }}
                lowStockThreshold={parseInt(formData.lowStockThreshold) || 10}
                onLowStockChange={(val) => setFormData({ ...formData, lowStockThreshold: val.toString() })}
                allowNegativeStock={formData.allowNegativeStock}
                onAllowNegativeChange={(val) => setFormData({ ...formData, allowNegativeStock: val })}
                isNew={!editingProduct}
              />

              {/* Status Section */}
              <div>
                <label className="mb-3 block text-sm font-medium">Product Status</label>
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${formData.isActive
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-white hover:bg-muted/30'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${formData.isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        <Eye className="size-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Active</div>
                        <div className="text-xs text-muted-foreground">Visible in POS</div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="status"
                      className="text-primary focus:ring-primary"
                      checked={formData.isActive}
                      onChange={() => setFormData({ ...formData, isActive: true })}
                    />
                  </label>

                  <label className={`flex-1 flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${!formData.isActive
                    ? 'border-muted-foreground/50 bg-muted/20 shadow-sm'
                    : 'border-border bg-white hover:bg-muted/30'
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${!formData.isActive ? 'bg-gray-200 text-gray-700' : 'bg-muted text-muted-foreground'}`}>
                        <EyeOff className="size-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">Hidden</div>
                        <div className="text-xs text-muted-foreground">Hidden from POS</div>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="status"
                      className="text-gray-500 focus:ring-gray-500"
                      checked={!formData.isActive}
                      onChange={() => setFormData({ ...formData, isActive: false })}
                    />
                  </label>
                </div>
              </div>

              {/* Modifier Groups Management */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 uppercase tracking-tight">Option Groups</label>
                    <p className="text-xs text-muted-foreground">Dynamic groups like "Size", "Temperature", or "Toppings".</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newGroup: ModifierGroup = {
                        name: '',
                        selection_type: 'single',
                        min_selection: 1,
                        max_selection: 1,
                        options: []
                      };
                      setFormData({ ...formData, modifierGroups: [...formData.modifierGroups, newGroup] });
                    }}
                    className="text-xs font-bold px-4 py-2 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90 transition-all shadow-md shadow-brand-primary/10"
                  >
                    + Add Group
                  </button>
                </div>

                <div className="space-y-6">
                  {formData.modifierGroups.length === 0 && (
                    <div className="text-sm text-muted-foreground/60 text-center py-10 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
                      No dynamic groups added yet
                    </div>
                  )}
                  {formData.modifierGroups.map((group, groupIndex) => (
                    <motion.div
                      key={groupIndex}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-6 rounded-[2rem] bg-green-50/50 border border-green-100 shadow-sm space-y-5"
                    >
                      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Group Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Temperature"
                            value={group.name}
                            onChange={(e) => {
                              const newGroups = formData.modifierGroups.map((g, i) =>
                                i === groupIndex ? { ...g, name: e.target.value } : g
                              );
                              setFormData({ ...formData, modifierGroups: newGroups });
                            }}
                            className="w-full text-lg font-bold border border-green-100 bg-white px-3 py-1.5 rounded-xl outline-none placeholder:text-slate-200 focus:ring-2 focus:ring-primary/10 transition-all"
                          />
                        </div>
                        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-green-100 shadow-sm">
                          <button
                            type="button"
                            onClick={() => {
                              const newGroups = formData.modifierGroups.map((g, i) =>
                                i === groupIndex ? { ...g, selection_type: 'single', max_selection: 1 } : g
                              );
                              setFormData({ ...formData, modifierGroups: newGroups });
                            }}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-xl transition-all ${group.selection_type === 'single' ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            Single
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const newGroups = formData.modifierGroups.map((g, i) =>
                                i === groupIndex ? { ...g, selection_type: 'multiple', max_selection: 10 } : g
                              );
                              setFormData({ ...formData, modifierGroups: newGroups });
                            }}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-xl transition-all ${group.selection_type === 'multiple' ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                            Multiple
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newGroups = formData.modifierGroups.filter((_, i) => i !== groupIndex);
                            setFormData({ ...formData, modifierGroups: newGroups });
                          }}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="size-5" />
                        </button>
                      </div>

                      {/* Options within this group */}
                      <div className="space-y-3 pl-4 border-l-2 border-slate-50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Options</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newGroups = [...formData.modifierGroups];
                              newGroups[groupIndex].options.push({
                                name: '',
                                price_adjustment: 0
                              });
                              setFormData({ ...formData, modifierGroups: newGroups });
                            }}
                            className="text-[10px] font-bold text-brand-primary uppercase bg-brand-primary/5 px-2.5 py-1 rounded-lg hover:bg-brand-primary/10 transition-all"
                          >
                            + Add Choice
                          </button>
                        </div>

                        {group.options.length === 0 && (
                          <p className="text-[10px] text-slate-300 italic">No choices added yet.</p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {group.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex gap-2 items-center bg-white p-2 rounded-2xl border border-green-100 shadow-sm group/opt">
                              <input
                                type="text"
                                placeholder="Choice name"
                                value={option.name}
                                onChange={(e) => {
                                  const newGroups = formData.modifierGroups.map((g, gi) =>
                                    gi === groupIndex ? {
                                      ...g,
                                      options: g.options.map((o, oi) =>
                                        oi === optIndex ? { ...o, name: e.target.value } : o
                                      )
                                    } : g
                                  );
                                  setFormData({ ...formData, modifierGroups: newGroups });
                                }}
                                className="flex-1 bg-transparent border-none p-0 px-2 text-sm font-semibold outline-none focus:ring-0 placeholder:text-slate-200"
                              />
                              <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-xl px-2 py-1">
                                <span className="text-[10px] font-bold text-slate-300">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={option.price_adjustment}
                                  onChange={(e) => {
                                    const newGroups = formData.modifierGroups.map((g, gi) =>
                                      gi === groupIndex ? {
                                        ...g,
                                        options: g.options.map((o, oi) =>
                                          oi === optIndex ? { ...o, price_adjustment: parseFloat(e.target.value) || 0 } : o
                                        )
                                      } : g
                                    );
                                    setFormData({ ...formData, modifierGroups: newGroups });
                                  }}
                                  className="w-12 bg-transparent border-none p-0 text-xs font-black outline-none focus:ring-0 text-right"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newGroups = [...formData.modifierGroups];
                                  newGroups[groupIndex].options = newGroups[groupIndex].options.filter((_, i) => i !== optIndex);
                                  setFormData({ ...formData, modifierGroups: newGroups });
                                }}
                                className="p-1 text-slate-200 hover:text-red-500 opacity-0 group-hover/opt:opacity-100 transition-all"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </form>
          </div>

          <div className="p-4 border-t border-border flex gap-3 bg-muted/10 rounded-b-xl">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 rounded-lg border border-border bg-white py-2.5 font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={!isFormValid}
              className={`flex-1 rounded-lg py-2.5 font-medium text-primary-foreground shadow-md transition-all ${isFormValid
                ? 'bg-primary hover:bg-primary/90'
                : 'bg-primary/50 cursor-not-allowed opacity-70'
                }`}
            >
              {editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </div>
      </AnimatedModal>
    </AnimatedPage>
  );
}