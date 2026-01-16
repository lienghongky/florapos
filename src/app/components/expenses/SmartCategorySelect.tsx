import { useState, useMemo } from 'react';
import { useApp, ExpenseCategory } from '@/app/context/AppContext';
import { Plus, Check, X, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface SmartCategorySelectProps {
    value: string;
    onChange: (categoryId: string) => void;
    type: 'expense' | 'income';
    placeholder?: string;
}

export function SmartCategorySelect({ value, onChange, type, placeholder = "Select Category" }: SmartCategorySelectProps) {
    const { expenseCategories, addCategory } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');

    // Filter categories by type and active status
    const filteredCategories = useMemo(() => {
        return expenseCategories.filter(
            cat => cat.isActive && (cat.type === type || (!cat.type && type === 'expense')) // Fallback for old data
        ).filter(
            cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [expenseCategories, type, searchQuery]);

    const selectedCategory = expenseCategories.find(c => c.id === value);

    const handleCreateCategory = () => {
        if (!newCategoryName.trim()) return;

        // Check for duplicates
        const exists = expenseCategories.some(
            c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase() && c.type === type
        );

        if (exists) {
            toast.error('Category already exists');
            return;
        }

        addCategory({
            name: newCategoryName.trim(),
            type: type,
            isActive: true,
            isDefault: false
        });

        // Find the newly added category (since addCategory is sync in mock, we can try to find it, 
        // but better is if addCategory returned it. Since it doesn't, we'll rely on name matching or just close)
        // Actually, we can't easily get the ID back immediately in this mock setup without changing AppContext.
        // So we will optimisticly wait or just reset. 
        // Ideally update AppContext to return the new ID.
        // For now, I'll close the creation mode and let the user select it (it will appear in list).
        // Or better: auto-select it if possible. 

        // Workaround: We'll set the search query to the new name so it's easy to find.
        setSearchQuery(newCategoryName.trim());
        setIsCreating(false);
        setNewCategoryName('');
        toast.success(`${type === 'expense' ? 'Expense' : 'Income'} category created`);
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            {!isCreating ? (
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-white flex items-center justify-between text-sm hover:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                >
                    <span className={selectedCategory ? 'text-foreground' : 'text-muted-foreground'}>
                        {selectedCategory ? selectedCategory.name : placeholder}
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground opacity-50" />
                </button>
            ) : (
                /* Inline Creation Input */
                <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder={`New ${type} category name...`}
                        autoFocus
                        className="flex-1 h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateCategory();
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={!newCategoryName.trim()}
                        className="h-10 px-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        <Check className="size-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsCreating(false);
                            setNewCategoryName('');
                        }}
                        className="h-10 px-3 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            )}

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && !isCreating && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute top-full mt-1 left-0 w-full bg-white rounded-lg border border-border shadow-lg z-20 max-h-[250px] flex flex-col overflow-hidden"
                        >
                            {/* Search Header */}
                            <div className="p-2 border-b border-border sticky top-0 bg-white">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2 size-3.5 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search..."
                                        className="w-full pl-8 pr-2 py-1.5 text-xs rounded-md bg-muted/30 border-none outline-none focus:bg-muted/50"
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="overflow-y-auto flex-1 p-1">
                                {filteredCategories.length > 0 ? (
                                    filteredCategories.map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => {
                                                onChange(cat.id);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${value === cat.id
                                                    ? 'bg-primary/10 text-primary font-medium'
                                                    : 'hover:bg-muted text-gray-700'
                                                }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                                        No categories found
                                    </div>
                                )}
                            </div>

                            {/* Add New Button */}
                            <div className="p-1 border-t border-border bg-muted/10">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(true)}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary font-medium hover:bg-primary/5 rounded-md transition-colors"
                                >
                                    <Plus className="size-4" />
                                    Create "{searchQuery || 'New'}"
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
