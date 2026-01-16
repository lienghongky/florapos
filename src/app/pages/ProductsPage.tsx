import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { useApp, ProductOption, Product } from '@/app/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, Search, Filter, ArrowUpDown, Eye, EyeOff, Image as ImageIcon, Upload, X, Check, AlertCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { AnimatedModal } from '@/app/components/motion/AnimatedPage';
import { toast } from 'sonner';
import { ProductInventorySection } from '@/app/components/products/ProductInventorySection';

export function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct, user, categories, addProductCategory } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Search, Filter, Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('name-asc');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    unit: 'piece' as 'piece' | 'stem' | 'bouquet',
    trackInventory: true,
    type: 'simple' as 'simple' | 'composite',
    inventoryItemId: '',
    recipe: [] as any[],
    category: '',
    lowStockThreshold: '10',
    isActive: true,
    options: [] as ProductOption[],
    image: '',
    imagePreview: ''
  });

  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived state
  const uniqueCategories = ['All', ...categories.map(c => c.name)];

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
        unit: product.unit || 'piece',
        trackInventory: product.trackInventory ?? true,
        type: product.type || 'simple',
        inventoryItemId: product.inventoryItemId || '',
        recipe: product.recipe || [],
        category: product.category,
        lowStockThreshold: product.lowStockThreshold.toString(),
        isActive: product.isActive ?? true,
        options: product.options || [],
        image: product.image,
        imagePreview: '' // Reset preview, will use product.image
      });
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
        category: '',
        lowStockThreshold: '10',
        isActive: true,
        options: [],
        image: 'placeholder',
        imagePreview: ''
      });
    }
    setShowModal(true);
    setIsAddingNewCategory(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      // Create local preview URL
      const previewUrl = URL.createObjectURL(file);
      setFormData({ ...formData, imagePreview: previewUrl, image: 'uploaded-image' }); // In a real app, upload to server here
    }
  };

  const handleAddNewCategory = () => {
    if (newCategoryName.trim()) {
      addProductCategory({ name: newCategoryName.trim() });
      setFormData({ ...formData, category: newCategoryName.trim() });
      setNewCategoryName('');
      setIsAddingNewCategory(false);
      toast.success('New category added!');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.type === 'composite' && formData.trackInventory && formData.recipe.length === 0) {
      toast.error('Composite products must have at least one component');
      return;
    }

    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      stock: formData.trackInventory ? parseInt(formData.stock) || 0 : 0,
      unit: formData.unit,
      trackInventory: formData.trackInventory,
      type: formData.type,
      inventoryItemId: formData.inventoryItemId,
      recipe: formData.recipe,
      category: formData.category,
      image: formData.image,
      lowStockThreshold: parseInt(formData.lowStockThreshold) || 5,
      options: formData.options,
      isActive: formData.isActive
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

  const isFormValid = formData.name && formData.price && formData.category;

  return (
    <AnimatedPage className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Products</h1>
          <p className="mt-1 text-muted-foreground">Manage your product catalog</p>
        </div>
        {user?.role === 'owner' && (
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground shadow-md"
          >
            <Plus className="size-4" />
            Add Product
          </motion.button>
        )}
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
              {uniqueCategories.map(cat => (
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
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Image</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Product Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Category</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Price</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Stock</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                {user?.role === 'owner' && (
                  <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
                )}
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
                    <div className="size-10 overflow-hidden rounded-lg bg-muted relative">
                      <img
                        src={product.image.startsWith('u') ? product.image : `https://images.unsplash.com/photo-1520763185298-1b434c919102?w=80&h=80&fit=crop`}
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
                        {product.stock === 0 ? 'Out of Stock' : `${product.stock} ${product.unit}(s)`}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">Unlimited</span>
                    )}

                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${product.isActive ? 'text-green-600' : 'text-muted-foreground'
                      }`}>
                      {product.isActive ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                      {product.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  {user?.role === 'owner' && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
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
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Creation/Edit Modal */}
      <AnimatedModal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="rounded-xl bg-white p-0 shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
          </div>

          <div className="overflow-y-auto flex-1 p-6 space-y-8">
            <form id="product-form" onSubmit={handleSubmit} className="space-y-8">
              {/* Image Upload Section */}
              <div className="grid grid-cols-[120px_1fr] gap-6">
                <div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative size-28 rounded-xl border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-all overflow-hidden"
                  >
                    {formData.imagePreview || (editingProduct && formData.image && formData.image !== 'placeholder') ? (
                      <img
                        src={formData.imagePreview || (editingProduct ? formData.image : '')}
                        alt="Preview"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground p-2 text-center">
                        <ImageIcon className="size-6" />
                        <span className="text-[10px] uppercase font-semibold">Upload</span>
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
                    accept="image/png, image/jpeg"
                    onChange={handleImageUpload}
                  />
                  <p className="mt-2 text-[10px] text-muted-foreground text-center">
                    JPG/PNG, max 5MB
                  </p>

                  {/* Price Preview */}
                  <div className="mt-4 text-center">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Price Preview</p>
                    <div className="text-2xl font-bold text-gray-900 tracking-tight">
                      ${formData.price ? parseFloat(formData.price).toFixed(2) : '0.00'}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Product Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Red Rose Bouquet"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Category <span className="text-red-500">*</span></label>
                    {!isAddingNewCategory ? (
                      <div className="flex gap-2">
                        <select
                          required
                          value={formData.category}
                          onChange={(e) => {
                            if (e.target.value === 'new') {
                              setIsAddingNewCategory(true);
                            } else {
                              setFormData({ ...formData, category: e.target.value });
                            }
                          }}
                          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                          <option value="new" className="font-semibold text-primary">+ Add New Category</option>
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



              {/* Inventory Section (Unified) */}
              <ProductInventorySection
                trackInventory={formData.trackInventory}
                onTrackChange={(trackInventory) => setFormData({ ...formData, trackInventory })}
                stock={parseInt(formData.stock) || 0}
                onStockChange={(stock) => setFormData({ ...formData, stock: stock.toString() })}
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

              {/* Options Management */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium">Customization Options</label>
                    <p className="text-xs text-muted-foreground">Add-ons like vases, ribbons, etc.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newOption = {
                        id: Date.now().toString(),
                        name: '',
                        type: 'checkbox' as const,
                        price: 0
                      };
                      setFormData({ ...formData, options: [...formData.options, newOption] });
                    }}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    + Add Option
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.options.length === 0 && (
                    <div className="text-sm text-muted-foreground/60 text-center py-6 border border-dashed border-border rounded-lg bg-muted/5">
                      No options added yet
                    </div>
                  )}
                  {formData.options.map((option, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 items-start p-3 rounded-lg bg-muted/20 border border-border/50 group"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Option Name"
                            value={option.name}
                            onChange={(e) => {
                              const newOptions = [...formData.options];
                              newOptions[index].name = e.target.value;
                              setFormData({ ...formData, options: newOptions });
                            }}
                            className="flex-1 rounded-md border border-border bg-white px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary/20"
                          />
                          <div className="relative w-24">
                            <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">$</span>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={option.price}
                              onChange={(e) => {
                                const newOptions = [...formData.options];
                                newOptions[index].price = parseFloat(e.target.value) || 0;
                                setFormData({ ...formData, options: newOptions });
                              }}
                              className="w-full rounded-md border border-border bg-white pl-5 pr-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary/20"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name={`type-${index}`}
                              checked={option.type === 'checkbox'}
                              onChange={() => {
                                const newOptions = [...formData.options];
                                newOptions[index].type = 'checkbox';
                                setFormData({ ...formData, options: newOptions });
                              }}
                            />
                            Add-on (Checkbox)
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name={`type-${index}`}
                              checked={option.type === 'radio'}
                              onChange={() => {
                                const newOptions = [...formData.options];
                                newOptions[index].type = 'radio';
                                setFormData({ ...formData, options: newOptions });
                              }}
                            />
                            Variant (Radio)
                          </label>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newOptions = formData.options.filter((_, i) => i !== index);
                          setFormData({ ...formData, options: newOptions });
                        }}
                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-md transition-colors self-start"
                      >
                        <Trash2 className="size-4" />
                      </button>
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