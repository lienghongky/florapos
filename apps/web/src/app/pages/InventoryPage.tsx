import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { useInventoryStore } from '@/app/store/inventory-store';
import { useProductStore } from '@/app/store/product-store';
import { useAuthStore } from '@/app/store/auth-store';
import { InventoryItem } from '@/app/types';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Package, Search, Filter, ArrowUpDown, Download, Upload, TrendingUp, TrendingDown, Edit, Save, X, RotateCcw, History, Trash2, Zap, ChevronLeft, ChevronRight, Settings2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { toast } from 'sonner';
import { InventoryHistoryDrawer } from '@/app/components/inventory/InventoryHistoryDrawer';
import { QuickAdjustModal } from '@/app/components/inventory/QuickAdjustModal';
import { AnimatedModal } from '@/app/components/motion/AnimatedPage';
import { PageHeader } from '@/app/components/ui/page-header';

export function InventoryPage() {
  const { inventoryItems, adjustInventoryStock, deleteInventoryItem, refreshInventory } = useInventoryStore();
  const { products, categories, refreshProducts } = useProductStore();
  const { selectedStore } = useAuthStore();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('updated-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Fetch fresh data whenever this page mounts or the store changes
  useEffect(() => {
    refreshInventory();
    refreshProducts();
  }, [selectedStore?.id]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // History Drawer State
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<any>(null);

  // Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<any>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('New delivery');

  // Deletion State
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick Adjust Modal State
  const [showQuickAdjust, setShowQuickAdjust] = useState(false);

  // Combine inventory items and composite products
  const combinedItems = [
    ...inventoryItems.map(item => {
      // Find a product that corresponds to this inventory item (either by name match or recipe link)
      const ownerProduct = (products || []).find(p => p.name === item.name) ||
        (products || []).find(p => p.recipe?.some((r: any) => r.inventory_item_id === item.id));

      const categoryId = item.category_id || ownerProduct?.category_id;
      const itemTags = (item.tags && item.tags.length > 0) ? item.tags : (ownerProduct?.tags || []);

      return {
        ...item,
        isComposite: false,
        recipe: [],
        category: categories.find(c => c.id === categoryId)?.name || 'Uncategorized',
        tags: itemTags,
        updated_at: item.updated_at || ownerProduct?.updated_at,
        selling_price: ownerProduct?.base_price || 0
      };
    }),
    ...(products || []).filter(p => p.product_type === 'composite').map(p => ({
      id: p.id,
      name: p.name,
      sku: p.sku || '',
      barcode: p.barcode || '',
      current_stock: p.calculated_stock || 0,
      min_stock_threshold: 0,
      cost_price: p.cost_price || 0,
      isComposite: true,
      recipe: p.recipe || [],
      unit_id: 'piece',
      category: categories.find(c => c.id === p.category_id)?.name || 'Uncategorized',
      tags: p.tags || [],
      updated_at: p.updated_at,
      selling_price: p.base_price || 0
    }))
  ];

  // Summary Calculations
  const totalProducts = combinedItems.length;
  const lowStockCount = combinedItems.filter(p => (Number(p.current_stock) || 0) > 0 && (Number(p.current_stock) || 0) <= (Number(p.min_stock_threshold) || 10)).length;
  const outOfStockCount = combinedItems.filter(p => (Number(p.current_stock) || 0) === 0).length;
  const totalValue = combinedItems.reduce((acc: number, p: any) => acc + ((Number(p.average_cost) || Number(p.cost_price) || Number(p.selling_price) || 0) * (Number(p.current_stock) || 0)), 0);

  // Filter & Sort
  const filteredProducts = combinedItems.filter((p: any) => {
    const searchStr = searchQuery.toLowerCase();
    const nameMatch = (p.name || '').toLowerCase().includes(searchStr);
    const skuMatch = (p.sku || '').toLowerCase().includes(searchStr);
    const barcodeMatch = (p.barcode || '').toLowerCase().includes(searchStr);
    const tagMatch = (p.tags || []).some((tag: string) => tag.toLowerCase().includes(searchStr));
    const categoryMatch = (p.category || '').toLowerCase().includes(searchStr);
    const matchesSearch = nameMatch || skuMatch || barcodeMatch || tagMatch || categoryMatch;

    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  }).sort((a: any, b: any) => {
    const aStock = Number(a.current_stock) || 0;
    const bStock = Number(b.current_stock) || 0;
    const aValue = (Number(a.cost_price) || 0) * aStock;
    const bValue = (Number(b.cost_price) || 0) * bStock;

    const aName = a.name || '';
    const bName = b.name || '';

    switch (sortOption) {
      case 'name-asc': return aName.localeCompare(bName);
      case 'name-desc': return bName.localeCompare(aName);
      case 'stock-asc': return aStock - bStock;
      case 'stock-desc': return bStock - aStock;
      case 'value-asc': return aValue - bValue;
      case 'value-desc': return bValue - aValue;
      case 'updated-desc': {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA || b.name.localeCompare(a.name);
      }
      case 'updated-asc': {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateA - dateB || a.name.localeCompare(b.name);
      }
      default: return 0;
    }
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Handlers
  const handleExport = () => {
    const headers = ['ID', 'Name', 'Status', 'Effective Cost', 'Stock', 'Total Value'];
    const rows = combinedItems.map((p: any) => {
      const cost = Number(p.average_cost) || Number(p.cost_price) || Number(p.selling_price) || 0;
      const stock = Number(p.current_stock) || 0;
      const value = cost * stock;

      let status = '🟢 In Stock';
      if (stock === 0) status = '🔴 Out of Stock';
      else if (!p.isComposite && stock <= (Number(p.min_stock_threshold) || 10)) status = '🟡 Low Stock';

      return [
        p.id,
        p.name,
        status,
        cost.toFixed(2),
        stock,
        value.toFixed(2)
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers, ...rows].map(e => (e as any[]).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Inventory exported successfully');
  };

  const handleAdjustStock = async () => {
    if (!adjustingProduct || !adjustmentAmount) return;
    const amount = parseInt(adjustmentAmount);
    if (isNaN(amount) || amount < 0) return;

    try {
      if (adjustmentType === 'add') await adjustInventoryStock(adjustingProduct.id, 'increase', amount, adjustmentReason);
      else if (adjustmentType === 'remove') await adjustInventoryStock(adjustingProduct.id, 'decrease', amount, adjustmentReason);
      else if (adjustmentType === 'set') await adjustInventoryStock(adjustingProduct.id, 'set', amount, adjustmentReason);

      toast.success(`Stock updated for ${adjustingProduct.name}`);
      setShowAdjustModal(false);
      setAdjustmentAmount('');
      setAdjustingProduct(null);
    } catch (e) {
      toast.error('Failed to update stock');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    toast.promise(deleteInventoryItem(itemToDelete.id), {
      loading: `Deleting ${itemToDelete.name}...`,
      success: () => {
        setItemToDelete(null);
        setIsDeleting(false);
        return `${itemToDelete.name} deleted successfully`;
      },
      error: (err: any) => {
        setIsDeleting(false);
        return err.message || `Failed to delete ${itemToDelete.name}`;
      }
    });
  };

  const openAdjustModal = (product: any) => {
    setAdjustingProduct(product);
    setAdjustmentAmount('');
    setAdjustmentType('add');
    setAdjustmentReason('New delivery');
    setShowAdjustModal(true);
  };

  return (
    <AnimatedPage className="space-y-6">
      <PageHeader
        title="Inventory"
        subtitle="Manage stock levels and track value"
        action={
          <>
            <button className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-all hover:bg-muted active:scale-95">
              <Upload className="size-4" />
              Import
            </button>
            <button
              onClick={() => setShowQuickAdjust(true)}
              className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90 active:scale-95"
            >
              <Zap className="size-4" />
              Quick Adjust
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-600/20 transition-all hover:bg-green-700 active:scale-95"
            >
              <Download className="size-4" />
              Export CSV
            </button>
          </>
        }
      />


      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Package className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold">{lowStockCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
              <X className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold">{outOfStockCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Est. Value</p>
              <p className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/30 py-2 pl-9 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 rounded-lg border border-border bg-muted/30 pl-8 pr-2 text-sm outline-none focus:border-primary/50"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="h-10 rounded-lg border border-border bg-muted/30 pl-8 pr-2 text-sm outline-none focus:border-primary/50"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="stock-asc">Stock (Low-High)</option>
              <option value="stock-desc">Stock (High-Low)</option>
              <option value="value-asc">Value (Low-High)</option>
              <option value="value-desc">Value (High-Low)</option>
              <option value="updated-desc">Recently Updated</option>
              <option value="updated-asc">Oldest Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Unified Table */}
      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Reference</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Product/Material</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Category</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Stock Level</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Value</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product: any, index: number) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="group border-b border-border last:border-0 transition-colors hover:bg-muted/50"
                >
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-muted-foreground bg-muted/50 rounded p-1 inline-block truncate max-w-[120px]" title={product.sku || product.barcode || product.id}>
                      {product.sku || product.barcode || product.id.split('-')[0]}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">{product.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{product.category}</span>
                  </td>

                  <td className="px-6 py-4">
                    {product.isComposite ? (
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-blue-600 text-lg">
                          {Number(product.current_stock) || 0}
                        </span>
                        <span className="text-[10px] text-muted-foreground bg-blue-50 px-1.5 py-0.5 rounded w-fit border border-blue-100">Auto-calculated</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${(Number(product.current_stock) || 0) <= (Number(product.min_stock_threshold) || 10) ? 'text-red-600' : 'text-foreground'}`}>
                            {Number(product.current_stock) || 0}
                          </span>
                          <span className="text-xs text-muted-foreground">/ {Number(product.min_stock_threshold) || 10} min</span>
                        </div>
                        <div className="mt-1 h-1.5 w-20 rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${(Number(product.current_stock) || 0) <= (Number(product.min_stock_threshold) || 10) ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, ((Number(product.current_stock) || 0) / ((Number(product.min_stock_threshold) || 10) * 3)) * 100)}%` }}
                          />
                        </div>
                      </>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    ${((Number(product.average_cost) || Number(product.cost_price) || Number(product.selling_price) || 0) * (Number(product.current_stock) || 0)).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    {(Number(product.current_stock) || 0) === 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        <X className="size-3" /> Out of Stock
                      </span>
                    ) : (!product.isComposite && (Number(product.current_stock) || 0) <= (Number(product.min_stock_threshold) || 10)) ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                        <AlertTriangle className="size-3" /> Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        <Package className="size-3" /> In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {product.isComposite ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-[10px] font-bold text-primary uppercase mb-0.5 bg-primary/5 px-2 py-0.5 rounded-full">Recipe Dependencies</span>
                        {product.recipe?.map((r: any) => {
                          const dep = inventoryItems.find(i => i.id === r.inventory_item_id);
                          return dep ? (
                            <span key={r.inventory_item_id} className="text-xs text-muted-foreground flex items-center gap-1.5 justify-end">
                              <span className="font-medium text-gray-700">{r.quantity_required}x</span> {dep.name}
                              <span className="text-[10px] opacity-70 bg-muted px-1 rounded">({dep.current_stock})</span>
                            </span>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => openAdjustModal(product)}
                          className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Adjust Stock"
                        >
                          <Settings2 className="size-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProductForHistory(product);
                            setShowHistoryDrawer(true);
                          }}
                          className="ml-2 rounded-lg border border-purple-200 bg-purple-50 p-2 text-purple-600 transition-colors hover:bg-purple-100 hover:text-purple-700 hover:border-purple-300"
                          title="View History"
                        >
                          <History className="size-4" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(product)}
                          className="ml-2 rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100 hover:text-red-700 hover:border-red-300"
                          title="Delete Item"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </>
                    )}
                  </td>
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
            Showing <span className="font-medium text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of <span className="font-medium text-foreground">{filteredProducts.length}</span> items
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

      {/* Manual Adjustment Modal */}
      <AnimatedModal isOpen={showAdjustModal} onClose={() => setShowAdjustModal(false)}>
        {/* ... (existing modal content) ... */}
        <div className="w-[400px] rounded-xl bg-white p-6 shadow-xl">
          <h2 className="mb-2 text-xl font-semibold">Adjust Stock</h2>
          <p className="mb-6 text-sm text-muted-foreground flex flex-wrap items-center gap-x-2">
            Update inventory for <span className="font-bold text-foreground">{adjustingProduct?.name}</span>
            {adjustingProduct?.category && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground border border-border">
                {adjustingProduct.category}
              </span>
            )}
          </p>

          <div className="space-y-4">
            {/* Adjustment Type Tabs */}
            <div className="flex rounded-lg bg-muted p-1">
              {['add', 'remove', 'set'].map((type) => (
                <button
                  key={type}
                  onClick={() => setAdjustmentType(type as any)}
                  className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-all ${adjustmentType === type
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {type === 'add' ? 'Add' : type === 'remove' ? 'Remove' : 'Set'}
                </button>
              ))}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">
                {adjustmentType === 'set' ? 'New Stock Level' : 'Quantity'}
              </label>
              <input
                type="number"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="0"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Reason</label>
              <select
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option>New delivery</option>
                <option>Sale correction</option>
                <option>Damaged</option>
                <option>Expired</option>
                <option>Manual correction</option>
              </select>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 rounded-lg border border-border bg-white py-2 font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustStock}
                className="flex-1 rounded-lg bg-primary py-2 font-medium text-white shadow-md hover:bg-primary/90"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </AnimatedModal>

      {/* History Drawer */}
      {/* Quick Adjust Modal */}
      <QuickAdjustModal
        isOpen={showQuickAdjust}
        onClose={() => setShowQuickAdjust(false)}
      />

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open: boolean) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{itemToDelete?.name}</strong>.
              {itemToDelete && Number(itemToDelete.current_stock) > 0 && (
                <div className="mt-2 p-2 bg-red-50 text-red-600 rounded text-xs border border-red-100">
                  <strong>Warning:</strong> This item still has {itemToDelete.current_stock} units in stock. Deletion will be blocked by the server unless stock is 0.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete Item"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedProductForHistory && (
        <InventoryHistoryDrawer
          isOpen={showHistoryDrawer}
          onClose={() => setShowHistoryDrawer(false)}
          productId={selectedProductForHistory.id}
          productName={selectedProductForHistory.name}
          currentStock={selectedProductForHistory.current_stock || 0}
        />
      )}
    </AnimatedPage>
  );
}
