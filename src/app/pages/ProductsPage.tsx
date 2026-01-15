import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { useApp, ProductOption, Product } from '@/app/context/AppContext';
import { motion } from 'motion/react';
import { Plus, Edit2, Trash2, Search, Filter, ArrowUpDown, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { AnimatedModal } from '@/app/components/motion/AnimatedPage';
import { toast } from 'sonner';

export function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Search, Filter, Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('name-asc'); // name-asc, name-desc, price-asc, price-desc, stock-asc, stock-desc

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    lowStockThreshold: '10',
    isActive: true, // Start active by default
    options: [] as ProductOption[],
  });

  // Derived state
  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'price-asc': return a.price - b.price;
        case 'price-desc': return b.price - a.price;
        case 'stock-asc': return a.stock - b.stock;
        case 'stock-desc': return b.stock - a.stock;
        default: return 0;
      }
    });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        stock: product.stock.toString(),
        category: product.category,
        lowStockThreshold: product.lowStockThreshold.toString(),
        isActive: product.isActive ?? true,
        options: product.options || [],
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        stock: '',
        category: '',
        lowStockThreshold: '10',
        isActive: true,
        options: [],
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      category: formData.category,
      image: 'placeholder',
      lowStockThreshold: parseInt(formData.lowStockThreshold),
      options: formData.options,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
      toast.success('Product updated successfully!');
    } else {
      addProduct(productData);
      toast.success('Product added successfully!');
    }

    setShowModal(false);
  };

  return (
    <AnimatedPage className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Products</h1>
          <p className="mt-1 text-muted-foreground">Manage your product catalog</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground shadow-md"
        >
          <Plus className="size-4" />
          Add Product
        </motion.button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
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
              <option value="price-asc">Price (Low-High)</option>
              <option value="price-desc">Price (High-Low)</option>
              <option value="stock-asc">Stock (Low-High)</option>
              <option value="stock-desc">Stock (High-Low)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Image
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Product Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Price
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Stock
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className={`group border-b border-border last:border-0 transition-colors hover:bg-muted/50 ${!product.isActive ? 'opacity-60 bg-muted/20' : ''
                    }`}
                >
                  <td className="px-6 py-4">
                    <div className="size-10 overflow-hidden rounded-lg bg-muted">
                      <img
                        src={`https://images.unsplash.com/photo-1520763185298-1b434c919102?w=80&h=80&fit=crop`}
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
                  <td className="px-6 py-4 text-sm font-medium">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${product.stock <= product.lowStockThreshold
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                        }`}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {product.stock} units
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => updateProduct(product.id, { isActive: !product.isActive })}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${product.isActive
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {product.isActive ? (
                        <>
                          <Eye className="size-3" />
                          Visible
                        </>
                      ) : (
                        <>
                          <EyeOff className="size-3" />
                          Hidden
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
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
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this product?')) {
                            deleteProduct(product.id);
                            toast.success('Product deleted successfully!');
                          }
                        }}
                        className="rounded-lg p-2 text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      <AnimatedModal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="rounded-xl bg-white p-6 shadow-xl">
          <h2 className="mb-6 text-xl font-semibold">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Product Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Category</label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Stock</label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Options Management */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Customization Options</label>
                <button
                  type="button"
                  onClick={() => {
                    const newOption = {
                      id: Date.now().toString(),
                      name: '',
                      type: 'checkbox',
                      price: 0
                    };
                    setFormData({ ...formData, options: [...formData.options, newOption] });
                  }}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  + Add Option
                </button>
              </div>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {formData.options.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-2 bg-muted/20 rounded-lg">
                    No options added
                  </div>
                )}
                {formData.options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-start p-2 rounded-lg bg-muted/20 border border-border/50">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder="Option Name (e.g. Size, Vase)"
                        value={option.name}
                        onChange={(e) => {
                          const newOptions = [...formData.options];
                          newOptions[index].name = e.target.value;
                          setFormData({ ...formData, options: newOptions });
                        }}
                        className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                      />
                      <div className="flex gap-2">
                        <select
                          value={option.type}
                          onChange={(e) => {
                            const newOptions = [...formData.options];
                            newOptions[index].type = e.target.value;
                            setFormData({ ...formData, options: newOptions });
                          }}
                          className="flex-1 rounded-md border border-border bg-white px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                        >
                          <option value="checkbox">Add-on (Checkbox)</option>
                          <option value="radio">Variant (Radio)</option>
                        </select>
                        <div className="relative w-24">
                          <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">$</span>
                          <input
                            type="number"
                            placeholder="Price"
                            value={option.price}
                            onChange={(e) => {
                              const newOptions = [...formData.options];
                              newOptions[index].price = parseFloat(e.target.value) || 0;
                              setFormData({ ...formData, options: newOptions });
                            }}
                            className="w-full rounded-md border border-border bg-white pl-5 pr-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newOptions = formData.options.filter((_, i) => i !== index);
                        setFormData({ ...formData, options: newOptions });
                      }}
                      className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-border bg-white py-2 font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex-1 rounded-lg bg-primary py-2 font-medium text-primary-foreground shadow-md"
              >
                {editingProduct ? 'Update' : 'Add'} Product
              </motion.button>
            </div>
          </form>
        </div>
      </AnimatedModal>
    </AnimatedPage>
  );
}