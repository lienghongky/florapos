import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Search, Package, Info, AlertTriangle, ArrowRight, Settings2, Calculator } from "lucide-react";
import { useInventoryStore } from "@/app/store/inventory-store";
import { InventoryItem, ProductRecipeItem } from "@/app/types";

interface ProductInventorySectionProps {
    trackInventory: boolean;
    onTrackChange: (track: boolean) => void;
    // State
    stock: string | number;
    onStockChange: (qty: string) => void;
    unit: string;
    onUnitChange: (unit: 'piece' | 'stem' | 'bouquet') => void;

    // Recipe
    recipe: ProductRecipeItem[];
    onRecipeChange: (recipe: ProductRecipeItem[]) => void;

    // Low Stock
    lowStockThreshold: number;
    onLowStockChange: (num: number) => void;

    // Negative Stock
    allowNegativeStock: boolean;
    onAllowNegativeChange: (val: boolean) => void;

    // Mode
    isNew?: boolean;
}

export function ProductInventorySection({
    trackInventory,
    onTrackChange,
    stock,
    onStockChange,
    unit,
    onUnitChange,
    recipe,
    onRecipeChange,
    lowStockThreshold,
    onLowStockChange,
    allowNegativeStock,
    onAllowNegativeChange,
    isNew = false
}: ProductInventorySectionProps) {
    const { inventoryItems } = useInventoryStore();
    const [limitingItem, setLimitingItem] = useState<{ name: string, stock: number } | null>(null);

    // Derived State
    const hasRecipe = recipe.length > 0;
    const isManualStock = !hasRecipe;

    // Auto-calculate stock for Composite Products (Recipe exists)
    useEffect(() => {
        if (hasRecipe && trackInventory) {
            let maxPossibleStock = Infinity;
            let limiter: InventoryItem | null = null;

            recipe.forEach(item => {
                const invItem = inventoryItems.find(i => i.id === item.inventory_item_id);
                if (invItem && item.quantity_required > 0) {
                    const possible = Math.floor(invItem.current_stock / item.quantity_required);
                    if (possible < maxPossibleStock) {
                        maxPossibleStock = possible;
                        limiter = invItem;
                    }
                }
            });

            const finalStock = maxPossibleStock === Infinity ? 0 : maxPossibleStock;

            // Only update if changed to avoid loops
            if (stock.toString() !== finalStock.toString()) {
                onStockChange(finalStock.toString());
            }

            if (limiter) {
                setLimitingItem({ name: (limiter as any).name, stock: (limiter as any).current_stock });
            } else {
                setLimitingItem(null);
            }
        }
    }, [trackInventory, recipe, inventoryItems, hasRecipe]); // Logic runs when these change


    // Handlers
    const addRecipeItem = () => {
        onRecipeChange([...recipe, { inventory_item_id: "", quantity_required: 1 }]);
    };

    const removeRecipeItem = (index: number) => {
        const newRecipe = [...recipe];
        newRecipe.splice(index, 1);
        onRecipeChange(newRecipe);
    };

    const updateRecipeItem = (index: number, field: keyof ProductRecipeItem, value: any) => {
        const newRecipe = [...recipe];
        newRecipe[index] = { ...newRecipe[index], [field]: value };
        onRecipeChange(newRecipe);
    };

    return (
        <div className="rounded-xl border border-border p-6 space-y-8 bg-green-50/50">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        Inventory Tracking
                        {trackInventory && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">On</span>
                        )}
                    </h3>
                    <p className="text-sm text-muted-foreground">Manage stock levels and recipes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={trackInventory}
                        onChange={(e) => onTrackChange(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
            </div>

            <AnimatePresence mode="wait">
                {trackInventory && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-8 overflow-hidden"
                    >
                        {/* UNIFIED CONTENT AREA */}
                        <div className="bg-muted/10 rounded-xl p-1">
                            <div className=" space-y-8">

                                {/* 1. Stock & Unit (Top Level) */}
                                <div className="space-y-6">
                                    {/* Stock Display */}
                                    <div className="bg-white rounded-xl border border-border p-5 shadow-sm">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                                            {isNew && isManualStock ? "Initial Stock Level" : "Available Stock"}
                                        </label>

                                        <div className="flex items-center gap-3">
                                            {isManualStock ? (
                                                <input
                                                    type="number"
                                                    value={stock}
                                                    onChange={(e) => onStockChange(e.target.value)}
                                                    readOnly={!isNew}
                                                    className={`w-full text-3xl font-bold text-gray-900 bg-transparent outline-none border-b-2 transition-all placeholder-gray-300 ${isNew ? 'border-primary/20 focus:border-primary' : 'border-transparent'}`}
                                                    placeholder="0"
                                                />
                                            ) : (
                                                <div className="flex flex-col">
                                                    <span className="text-3xl font-bold text-gray-900">{stock}</span>
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Calculator className="size-3" />
                                                        Auto-calculated from recipe
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex flex-col items-end">
                                            </div>
                                        </div>

                                        {!isNew && (
                                            <div className="mt-3 flex items-start gap-2 text-[10px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100/50">
                                                <Info className="size-3 shrink-0 mt-0.5" />
                                                <span>Current stock is read-only here. To add or adjust stock levels, please go to the <strong>Inventory</strong> page.</span>
                                            </div>
                                        )}

                                        {isNew && isManualStock && (
                                            <div className="mt-3 flex items-start gap-2 text-[10px] text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100/50">
                                                <Info className="size-3 shrink-0 mt-0.5" />
                                                <span>Enter the initial quantity of this product currently in your possession.</span>
                                            </div>
                                        )}

                                        {/* Limiting Factor Alert (for Recipe Mode) */}
                                        {hasRecipe && limitingItem && (
                                            <div className="mt-4 pt-3 border-t border-dashed border-border text-xs text-amber-700 flex items-center gap-1.5">
                                                <AlertTriangle className="size-3" />
                                                Limited by <span className="font-semibold">{limitingItem.name}</span> ({limitingItem.stock} left)
                                            </div>
                                        )}
                                    </div>


                                </div>


                                {/* 2. Recipe / Composition Builder */}
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                <Package className="size-4 text-primary" />
                                                Composition / Recipe
                                            </h4>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Add ingredients to automatically calculate stock. Leave empty for manual stock.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addRecipeItem}
                                            className="text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                                        >
                                            <Plus className="size-3" />
                                            Add Component
                                        </button>
                                    </div>

                                    <div className="rounded-lg border border-border bg-white overflow-hidden shadow-sm">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50/50 border-b border-border">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-500 w-[50%]">Material</th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-500 w-[20%]">Quantity</th>
                                                    <th className="px-4 py-3 text-left font-medium text-gray-500 w-[20%]">Unit cost</th> {/* Placeholder */}
                                                    <th className="px-4 py-3 w-[10%]"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/40">
                                                {recipe.map((item, index) => {
                                                    const invItem = inventoryItems.find(i => i.id === item.inventory_item_id);
                                                    return (
                                                        <motion.tr
                                                            key={index}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                        >
                                                            <td className="p-3">
                                                                <div className="relative">
                                                                    <select
                                                                        className="w-full bg-transparent outline-none text-gray-700 font-medium py-1"
                                                                        value={item.inventory_item_id || ''}
                                                                        onChange={(e) => updateRecipeItem(index, 'inventory_item_id', e.target.value)}
                                                                    >
                                                                        <option value="">Select Material...</option>
                                                                        {inventoryItems.map(ii => (
                                                                            <option key={ii.id} value={ii.id} disabled={recipe.some((r, idx) => r.inventory_item_id === ii.id && idx !== index)}>
                                                                                {ii.name} ({ii.current_stock} {ii.unit_id || 'units'})
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                {invItem && (
                                                                    <div className="text-[10px] text-muted-foreground mt-0.5 ml-1">
                                                                        Current Stock: {invItem.current_stock} {invItem.unit_id || 'units'}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="number"
                                                                        min="1"
                                                                        step="1"
                                                                        className="w-20 bg-muted/30 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-primary/30 text-center font-medium"
                                                                        value={item.quantity_required || 0}
                                                                        onChange={(e) => updateRecipeItem(index, 'quantity_required', parseFloat(e.target.value) || 0)}
                                                                    />
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {invItem ? (invItem.unit_id || 'units') : ''}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-gray-500 text-xs">
                                                                {invItem ? `$${(Number(invItem.average_cost) || Number(invItem.cost_price) || 0).toFixed(2)}` : '-'}
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeRecipeItem(index)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                >
                                                                    <Trash2 className="size-4" />
                                                                </button>
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                })}
                                                {recipe.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="p-8 text-center text-gray-400 bg-gray-50/20">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className="p-3 rounded-full bg-gray-100">
                                                                    <Settings2 className="size-5 opacity-40" />
                                                                </div>
                                                                <span className="text-xs font-medium">No components linked</span>
                                                                <span className="text-[10px] text-muted-foreground">Stock is managed manually above.</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                            </div>

                            {/* 3. Low Stock Alert (Separate Section) */}
                            <div className="pt-2 border-t border-border/50 space-y-6">
                                {/* Negative Stock Setting */}
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <label className="block text-sm font-medium text-gray-700">Allow Negative Stock</label>
                                        <p className="text-[10px] text-muted-foreground italic">If enabled, the product can still be sold when stock is 0 or less.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={allowNegativeStock}
                                            onChange={(e) => onAllowNegativeChange(e.target.checked)}
                                        />
                                        <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                                    </label>
                                </div>

                                {/* Low Stock Alert */}
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Low Stock Alert</label>
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-32">
                                            <input
                                                type="number"
                                                value={lowStockThreshold}
                                                onChange={(e) => onLowStockChange(parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 rounded-lg border border-border bg-green-50/20 text-sm focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground">Alert when stock falls below this level.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
