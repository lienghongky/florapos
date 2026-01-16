import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { useApp } from '@/app/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Package, Search, Filter, ArrowUpDown, Download, Upload, TrendingUp, TrendingDown, Edit, Save, X, RotateCcw, History } from 'lucide-react';
import { useState } from 'react';
import { AnimatedModal } from '@/app/components/motion/AnimatedPage';
import { toast } from 'sonner';
import { InventoryHistoryDrawer } from '@/app/components/inventory/InventoryHistoryDrawer';

export function InventoryPage() {
  const { products, updateProduct } = useApp();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('name-asc');

  // History Drawer State
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<any>(null);

  // Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<any>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('New delivery');

  // Summary Calculations
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const totalValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

  // Filter & Sort
  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    switch (sortOption) {
      case 'name-asc': return a.name.localeCompare(b.name);
      case 'name-desc': return b.name.localeCompare(a.name);
      case 'stock-asc': return a.stock - b.stock;
      case 'stock-desc': return b.stock - a.stock;
      case 'value-asc': return (a.price * a.stock) - (b.price * b.stock);
      case 'value-desc': return (b.price * b.stock) - (a.price * a.stock);
      default: return 0;
    }
  });

  // Handlers
  const handleExport = () => {
    const headers = ['ID', 'Name', 'Category', 'Price', 'Stock', 'Threshold', 'Value'];
    const rows = products.map(p => [
      p.id, p.name, p.category, p.price, p.stock, p.lowStockThreshold, (p.price * p.stock).toFixed(2)
    ]);
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Inventory exported successfully');
  };

  const handleAdjustStock = () => {
    if (!adjustingProduct || !adjustmentAmount) return;
    const amount = parseInt(adjustmentAmount);
    if (isNaN(amount)) return;

    let newStock = adjustingProduct.stock;
    if (adjustmentType === 'add') newStock += amount;
    else if (adjustmentType === 'remove') newStock = Math.max(0, newStock - amount);
    else if (adjustmentType === 'set') newStock = Math.max(0, amount);

    updateProduct(adjustingProduct.id, { stock: newStock });
    toast.success(`Stock updated for ${adjustingProduct.name}`);
    setShowAdjustModal(false);
    setAdjustmentAmount('');
    setAdjustingProduct(null);
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
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Inventory</h1>
          <p className="mt-1 text-muted-foreground">Manage stock levels and track value</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 font-medium transition-colors hover:bg-muted">
            <Upload className="size-4" />
            Import
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white shadow-md transition-colors hover:bg-green-700">
            <Download className="size-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Package className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Products</p>
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
              className="h-10 rounded-lg border border-border bg-muted/30 pl-9 pr-8 text-sm outline-none focus:border-primary/50"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="h-10 rounded-lg border border-border bg-muted/30 pl-9 pr-8 text-sm outline-none focus:border-primary/50"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="stock-asc">Stock (Low-High)</option>
              <option value="stock-desc">Stock (High-Low)</option>
              <option value="value-asc">Value (Low-High)</option>
              <option value="value-desc">Value (High-Low)</option>
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
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Product</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Category</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Stock Level</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Value</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="group border-b border-border last:border-0 transition-colors hover:bg-muted/50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <img
                          src={`https://images.unsplash.com/photo-1520763185298-1b434c919102?w=80&h=80&fit=crop`}
                          alt={product.name}
                          className="size-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x80?text=None'; }}
                        />
                      </div>
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{product.category}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${product.stock <= product.lowStockThreshold ? 'text-red-600' : 'text-foreground'}`}>
                        {product.stock}
                      </span>
                      <span className="text-xs text-muted-foreground">/ {product.lowStockThreshold} min</span>
                    </div>
                    <div className="mt-1 h-1.5 w-20 rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${product.stock <= product.lowStockThreshold ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(100, (product.stock / (product.lowStockThreshold * 3)) * 100)}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    ${(product.price * product.stock).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    {product.stock === 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        <X className="size-3" /> Out of Stock
                      </span>
                    ) : product.stock <= product.lowStockThreshold ? (
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
                    <button
                      onClick={() => openAdjustModal(product)}
                      className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Adjust Stock"
                    >
                      <RotateCcw className="size-4" />
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
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      <AnimatedModal isOpen={showAdjustModal} onClose={() => setShowAdjustModal(false)}>
        {/* ... (existing modal content) ... */}
        <div className="w-[400px] rounded-xl bg-white p-6 shadow-xl">
          <h2 className="mb-2 text-xl font-semibold">Adjust Stock</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Update inventory for <span className="font-medium text-foreground">{adjustingProduct?.name}</span>
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
      {selectedProductForHistory && (
        <InventoryHistoryDrawer
          isOpen={showHistoryDrawer}
          onClose={() => setShowHistoryDrawer(false)}
          productId={selectedProductForHistory.id}
          productName={selectedProductForHistory.name}
          currentStock={selectedProductForHistory.stock}
        />
      )}
    </AnimatedPage>
  );
}
