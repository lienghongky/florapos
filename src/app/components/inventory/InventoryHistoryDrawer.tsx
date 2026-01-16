import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, Search, Filter, History, ShoppingBag, Sliders, ArrowDown, AlertTriangle, Clock, User } from "lucide-react";
import { useApp, InventoryHistoryLog, InventoryActionType } from "@/app/context/AppContext";

interface InventoryHistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    productId: string;
    productName: string;
    currentStock: number;
}

export function InventoryHistoryDrawer({
    isOpen,
    onClose,
    productId,
    productName,
    currentStock
}: InventoryHistoryDrawerProps) {
    // Mock History Data Generator (since we don't have a real backend for this demo)
    // In a real app, you'd fetch this from the API based on productId
    const [history, setHistory] = useState<InventoryHistoryLog[]>([
        {
            id: '1',
            productId,
            action: 'sale',
            quantityChange: -5,
            previousStock: 45,
            newStock: 40,
            date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
            userId: 'u2',
            userName: 'Sarah Sales',
            userRole: 'sales',
            referenceId: 'ORD-2024-001',
            note: 'Walk-in customer'
        },
        {
            id: '2',
            productId,
            action: 'adjustment',
            quantityChange: 10,
            previousStock: 35,
            newStock: 45,
            date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            userId: 'u1',
            userName: 'Alex Owner',
            userRole: 'owner',
            note: 'New stock delivery'
        },
        {
            id: '3',
            productId,
            action: 'damage',
            quantityChange: -2,
            previousStock: 37,
            newStock: 35,
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
            userId: 'u1',
            userName: 'Alex Owner',
            userRole: 'owner',
            note: 'Broken during transit'
        }
    ]);

    const [filterAction, setFilterAction] = useState<InventoryActionType | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // ACTION CONFIGURATION
    const actionConfig = {
        sale: { icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Sale' },
        adjustment: { icon: Sliders, color: 'text-gray-600', bg: 'bg-gray-50', label: 'Adjustment' },
        restock: { icon: ArrowDown, color: 'text-green-600', bg: 'bg-green-50', label: 'Restock' },
        damage: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', label: 'Damage' },
        expired: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Expired' },
    };

    // Filter Logic
    const filteredHistory = history.filter(item => {
        const matchesAction = filterAction === 'all' || item.action === filterAction;
        const matchesSearch = item.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.referenceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.userName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesAction && matchesSearch;
    });

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-[640px] bg-white shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border flex items-start justify-between bg-white">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <History className="size-5 text-gray-500" />
                                    Inventory History
                                </h2>
                                <p className="text-muted-foreground mt-1 font-medium">{productName}</p>
                                <div className="mt-2 text-xs font-semibold px-2 py-1 bg-gray-100 rounded-md inline-block text-gray-700">
                                    Current Stock: {currentStock}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors" title="Export History">
                                    <Download className="size-5" />
                                </button>
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                                    <X className="size-5" />
                                </button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="p-4 border-b border-border bg-gray-50/50 flex flex-col gap-3">
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                <button
                                    onClick={() => setFilterAction('all')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${filterAction === 'all' ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                >
                                    All Actions
                                </button>
                                {Object.entries(actionConfig).map(([key, config]) => (
                                    <button
                                        key={key}
                                        onClick={() => setFilterAction(key as InventoryActionType)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap flex items-center gap-1.5 ${filterAction === key ? 'bg-white border-primary ring-1 ring-primary text-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <config.icon className="size-3" />
                                        {config.label}
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by ref ID, user, or note..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 bg-white"
                                />
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[39px] top-6 bottom-6 w-px bg-gray-100" />

                            {filteredHistory.map((item, index) => {
                                const config = actionConfig[item.action];
                                const isPositive = item.quantityChange > 0;
                                const isNegative = item.quantityChange < 0;

                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="relative flex gap-4"
                                    >
                                        {/* Icon */}
                                        <div className={`relative z-10 shrink-0 size-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${config.bg} ${config.color}`}>
                                            <config.icon className="size-4" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 pt-0.5">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-900">{config.label}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(item.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                                </div>
                                                <div className={`text-right font-bold text-sm ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'}`}>
                                                    {isPositive ? '+' : ''}{item.quantityChange}
                                                </div>
                                            </div>

                                            {/* Details Card */}
                                            <div className="mt-3 bg-gray-50/50 rounded-lg p-3 border border-border/50 text-sm">
                                                <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs">
                                                    <span className="text-muted-foreground">Stock:</span>
                                                    <span className="font-medium text-gray-700">{item.previousStock} <span className="text-gray-400 mx-1">→</span> {item.newStock}</span>

                                                    <span className="text-muted-foreground">User:</span>
                                                    <span className="font-medium text-gray-700 flex items-center gap-1.5">
                                                        <User className="size-3 text-gray-400" />
                                                        {item.userName}
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide ${item.userRole === 'owner' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {item.userRole}
                                                        </span>
                                                    </span>

                                                    {item.referenceId && (
                                                        <>
                                                            <span className="text-muted-foreground">Ref:</span>
                                                            <span className="font-mono text-gray-600">{item.referenceId}</span>
                                                        </>
                                                    )}

                                                    {item.note && (
                                                        <div className="col-span-2 mt-1.5 pt-1.5 border-t border-gray-100 text-gray-600 italic">
                                                            "{item.note}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {filteredHistory.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <div className="mx-auto size-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                        <History className="size-6 opacity-40" />
                                    </div>
                                    <p className="text-sm font-medium">No history found</p>
                                    <p className="text-xs mt-1 opacity-70">Try adjusting your filters</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
