import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { useAuthStore } from '@/app/store/auth-store';
import { useOrderStore } from '@/app/store/order-store';
import { useExpenseStore } from '@/app/store/expense-store';
import { Expense, ExpenseCategory, Income } from '@/app/types';
import { Order } from '@/app/types';
import { SmartCategorySelect } from '@/app/components/expenses/SmartCategorySelect';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import {
    PieChart,
    List,
    Tags,
    FileText,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Calendar,
    DollarSign,
    TrendingDown,
    Trash2,
    Edit,
    Download,
    RefreshCw,
    Loader2
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { AnimatedModal } from '@/app/components/motion/AnimatedPage';
import { toast } from 'sonner';
import { PageHeader } from '@/app/components/ui/page-header';

export function ExpensesPage() {
    const { user, selectedStore } = useAuthStore();
    const { orders, refreshOrders } = useOrderStore();
    const { 
        expenses, 
        expenseCategories, 
        addExpense, 
        deleteExpense, 
        addCategory, 
        deleteCategory, 
        incomes, 
        addIncome, 
        deleteIncome, 
        startingBalance, 
        setStartingBalance,
        isTransactionsLoading,
        isCategoriesLoading
    } = useExpenseStore();
    const { isOrdersLoading } = useOrderStore();
    const [activeTab, setActiveTab] = useState('overview'); // overview, list, categories, reports
    const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState<'expense' | 'income'>('expense');
    const [editingTransaction, setEditingTransaction] = useState<any>(null);

    const { updateExpense } = useExpenseStore();

    const { refreshTransactions, refreshExpenseCategories } = useExpenseStore();

    // Date Filters - Default to current full month
    const [dateRange, setDateRange] = useState(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    });

    // Initial load and filter change
    const handleRefresh = async () => {
        if (!selectedStore?.id) return;
        
        const filters = {
            startDate: dateRange.start,
            endDate: dateRange.end
        };
        
        await Promise.all([
            refreshTransactions(filters),
            refreshExpenseCategories(),
            refreshOrders({ ...filters, status: 'completed' })
        ]);
    };

    useEffect(() => {
        handleRefresh();
    }, [selectedStore?.id, dateRange.start, dateRange.end]);

    const isLoading = isTransactionsLoading || isOrdersLoading || isCategoriesLoading;

    const handleEdit = (transaction: any) => {
        setEditingTransaction({
            id: transaction.id,
            date: transaction.date,
            description: transaction.description || transaction.source,
            amount: transaction.amount,
            categoryId: transaction.categoryId,
            paymentMethod: transaction.paymentMethod,
            notes: transaction.notes,
            type: transaction.type
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateTransaction = async () => {
        if (!editingTransaction.description || !editingTransaction.amount) {
            toast.error("Description and amount are required");
            return;
        }

        try {
            await updateExpense(editingTransaction.id, {
                transaction_date: editingTransaction.date,
                description: editingTransaction.description,
                amount: Number(editingTransaction.amount),
                category_id: editingTransaction.categoryId,
                payment_method: editingTransaction.paymentMethod?.toLowerCase().replace(' ', '_'),
                notes: editingTransaction.notes,
                type: editingTransaction.type
            } as any);

            toast.success("Transaction updated successfully");
            setIsEditModalOpen(false);
            setEditingTransaction(null);
        } catch (err) {
            toast.error("Failed to update transaction");
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportCSV = () => {
        const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...filteredTransactions.map(item => [
                item.date,
                `"${item.description}"`,
                getCategoryName(item.categoryId),
                item.type,
                item.type === 'expense' ? `-${item.amount}` : item.amount,
                `"${item.notes || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expense_income_${dateRange.start}_${dateRange.end}.csv`;
        a.click();
    };

    // Form State
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        categoryId: expenseCategories[0]?.id || '',
        paymentMethod: 'Cash',
        notes: ''
    });

    const [newIncome, setNewIncome] = useState<Partial<Income>>({
        date: new Date().toISOString().split('T')[0],
        source: '',
        amount: 0,
        categoryId: expenseCategories[0]?.id || '',
        paymentMethod: 'Cash',
        notes: ''
    });

    const handleAddExpense = async () => {
        if (!newExpense.description || !newExpense.amount || !newExpense.categoryId) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            await addExpense({
                date: newExpense.date || new Date().toISOString(),
                description: newExpense.description,
                amount: Number(newExpense.amount),
                categoryId: newExpense.categoryId,
                paymentMethod: newExpense.paymentMethod,
                notes: newExpense.notes,
                isRecurring: false
            } as any);

            toast.success("Expense added successfully");
            setIsAddModalOpen(false);
            setNewExpense({
                date: new Date().toISOString().split('T')[0],
                description: '',
                amount: 0,
                categoryId: expenseCategories.find(c => c.type === 'expense')?.id || '',
                paymentMethod: 'Cash',
                notes: ''
            });
        } catch (err) {
            toast.error("Failed to add expense");
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        try {
            await addCategory({
                name: newCategoryName,
                type: newCategoryType,
                isActive: true,
                isDefault: false
            });
            setNewCategoryName('');
            setIsCategoryModalOpen(false);
            toast.success("Category added");
        } catch (err) {
            toast.error("Failed to add category");
        }
    };

    const handleAddIncome = async () => {
        if (!newIncome.source || !newIncome.amount) {
            toast.error("Please fill in source and amount");
            return;
        }

        try {
            await addIncome({
                date: newIncome.date || new Date().toISOString(),
                source: newIncome.source,
                amount: Number(newIncome.amount),
                categoryId: newIncome.categoryId || expenseCategories.find(c => c.type === 'income')?.id || '1',
                paymentMethod: newIncome.paymentMethod,
                notes: newIncome.notes
            });

            toast.success("Income added successfully");
            setIsAddIncomeModalOpen(false);
            setNewIncome({
                date: new Date().toISOString().split('T')[0],
                source: '',
                amount: 0,
                categoryId: expenseCategories.find(c => c.type === 'income')?.id || '',
                paymentMethod: 'Cash',
                notes: ''
            });
        } catch (err) {
            toast.error("Failed to add income");
        }
    };

    const getCategoryName = (id: string) => {
        if (id === 'Sales') return 'Sales Revenue';
        return expenseCategories.find((c: ExpenseCategory) => c.id === id)?.name || 'Unknown';
    };

    // Filter Logic
    const filterByDate = (itemDate: string) => {
        return itemDate >= dateRange.start && itemDate <= dateRange.end;
    };

    // Filter Logic - Search Aware (For List)
    const filteredExpenses = expenses.filter((exp: Expense) =>
        (exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            getCategoryName(exp.categoryId).toLowerCase().includes(searchQuery.toLowerCase())) &&
        filterByDate(exp.date)
    );

    // Filter Logic - Date Only (For Stats & Charts)
    const expensesByDate = expenses.filter((exp: Expense) => filterByDate(exp.date));

    const filteredSales = (orders || []).filter((order: Order) => {
        const dateObj = order.created_at ? new Date(order.created_at) : new Date();
        if (isNaN(dateObj.getTime())) return false;
        return filterByDate(dateObj.toISOString().split('T')[0]);
    });
    const filteredIncomes = incomes.filter((inc: Income) => filterByDate(inc.date));

    // Financial calculations (Use ID-agnostic, Date-filtered data)
    const salesRevenue = filteredSales.reduce((acc: number, order: Order) => acc + Number(order.grand_total), 0);
    const manualIncomeParams = filteredIncomes.reduce((acc: number, inc: Income) => acc + inc.amount, 0);
    const totalRevenue = salesRevenue + manualIncomeParams;

    const totalExpenses = expensesByDate.reduce((acc: number, exp: Expense) => acc + exp.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    const expensesByCategory = expensesByDate.reduce((acc: Record<string, number>, exp: Expense) => {
        const catName = getCategoryName(exp.categoryId);
        acc[catName] = (acc[catName] || 0) + exp.amount;
        return acc;
    }, {} as Record<string, number>);

    // ── Chart Data Preparation ──────────────────────────────────────────
    const getDaysArray = (startStr: string, endStr: string) => {
        const arr = [];
        const start = new Date(startStr + 'T00:00:00');
        const end = new Date(endStr + 'T00:00:00');
        
        const dt = new Date(start);
        while (dt <= end) {
            arr.push(new Date(dt).toISOString().split('T')[0]);
            dt.setDate(dt.getDate() + 1);
            if (arr.length > 100) break; // Safety break
        }
        return arr;
    };

    // Calculate balance before start date for accurate cumulative charting
    const calculateBalanceAt = (beforeDate: string) => {
        const historicalSales = (orders || []).filter(o => {
            if (!o.created_at) return false;
            const d = new Date(o.created_at);
            if (isNaN(d.getTime())) return false;
            const dateStr = d.toISOString().split('T')[0];
            return dateStr < beforeDate;
        }).reduce((sum, o) => sum + Number(o.grand_total), 0);
        
        const historicalIncome = (incomes || []).filter(i => i.date < beforeDate).reduce((sum, i) => sum + i.amount, 0);
        const historicalExpenses = (expenses || []).filter(e => e.date < beforeDate).reduce((sum, e) => sum + e.amount, 0);
        
        return startingBalance + historicalSales + historicalIncome - historicalExpenses;
    };

    const initialBalanceForRange = calculateBalanceAt(dateRange.start);
    let runningBalance = initialBalanceForRange;

    const chartData = getDaysArray(dateRange.start, dateRange.end).map(date => {
        const daysSales = filteredSales.filter((order: Order) => {
            if (!order.created_at) return false;
            const d = new Date(order.created_at);
            if (isNaN(d.getTime())) return false;
            return d.toISOString().split('T')[0] === date;
        }).reduce((sum: number, order: Order) => sum + Number(order.grand_total), 0);
        
        const daysIncome = filteredIncomes.filter((i: Income) => i.date === date).reduce((sum: number, i: Income) => sum + i.amount, 0);
        const totalDayIncome = daysSales + daysIncome;

        const daysExpenses = expensesByDate.filter((e: Expense) => e.date === date).reduce((sum: number, e: Expense) => sum + e.amount, 0);
        const dayNet = totalDayIncome - daysExpenses;
        runningBalance += dayNet;

        return {
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            income: totalDayIncome,
            expense: daysExpenses,
            net: dayNet,
            balance: runningBalance
        };
    });

    const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));
    const COLORS = ['#EF4444', '#F59E0B', '#F97316', '#F43F5E', '#EAB308', '#C2410C']; // Red, Amber, Orange, Rose, Yellow, Deep Orange

    // Sort logic for top expenses
    const topExpenses = (Object.entries(expensesByCategory) as [string, number][])
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10); // Show more in breakdown if available

    // Income Breakdown Logic
    const incomesByCategory = filteredIncomes.reduce((acc: Record<string, number>, inc: Income) => {
        const catName = getCategoryName(inc.categoryId);
        acc[catName] = (acc[catName] || 0) + inc.amount;
        return acc;
    }, {} as Record<string, number>);

    if (salesRevenue > 0) {
        incomesByCategory['Sales Revenue'] = (incomesByCategory['Sales Revenue'] || 0) + salesRevenue;
    }

    const incomePieData = Object.entries(incomesByCategory).map(([name, value]) => ({ name, value }));
    const getDynamicIncomeColor = (index: number) => {
        const baseColors = ['#10B981', '#3B82F6', '#38BDF8', '#14B8A6', '#6366F1', '#06B6D4'];
        if (index < baseColors.length) return baseColors[index];
        // Dynamic HSL variation within Green-Blue range (140 to 240)
        const hue = (140 + (index * 37)) % 100 + 140; 
        const saturation = 65 + (index % 3) * 10;
        const lightness = 45 + (index % 2) * 10;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    const getDynamicExpenseColor = (index: number) => {
        const baseColors = ['#EF4444', '#F59E0B', '#F97316', '#F43F5E', '#EAB308', '#C2410C'];
        if (index < baseColors.length) return baseColors[index];
        // Dynamic HSL variation within Red-Orange-Yellow range (0 to 50)
        const hue = (index * 23) % 55;
        const saturation = 80 + (index % 2) * 10;
        const lightness = 45 + (index % 3) * 5;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    const topIncomes = (Object.entries(incomesByCategory) as [string, number][])
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10); // Show more in breakdown if available

    // Combine for List View
    const allTransactions = [
        ...filteredExpenses.map(e => ({ ...e, type: 'expense' as const })),
        ...filteredIncomes.map(i => ({ ...i, description: i.source, type: 'income' as const })),
        ...filteredSales.map((order: Order) => {
            const dateObj = order.created_at ? new Date(order.created_at) : new Date();
            return {
                id: order.id,
                date: !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : '',
                description: `Sale #${order.order_number?.toUpperCase() || order.id.slice(-6).toUpperCase()} - ${order.items?.length || 0} items`,
                amount: Number(order.grand_total),
                categoryId: 'Sales',
                type: 'sale' as const,
                paymentMethod: order.payment_method || 'Unknown'
            };
        })
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filteredTransactions = allTransactions.filter(item => {
        // Type filter
        if (typeFilter === 'expense' && item.type !== 'expense') return false;
        if (typeFilter === 'income' && item.type !== 'income' && item.type !== 'sale') return false;
        
        // Category filter
        if (categoryFilter !== 'all' && item.categoryId !== categoryFilter) return false;
        
        // Search query
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
            item.description?.toLowerCase().includes(query) || 
            getCategoryName(item.categoryId).toLowerCase().includes(query) ||
            item.notes?.toLowerCase().includes(query);
        
        return matchesSearch;
    });

    return (
        <AnimatedPage className="space-y-6">
            <PageHeader 
                title="Expense Management" 
                subtitle="Track and manage business expenses"
                action={
                    activeTab === 'categories' ? (
                        <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary/90 active:scale-95"
                        >
                            <Plus className="size-5" />
                            Add Category
                        </button>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleRefresh}
                                disabled={isLoading}
                                className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
                            >
                                <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                            <button
                                onClick={() => setIsAddIncomeModalOpen(true)}
                                className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-600/20 transition-all hover:bg-green-700 active:scale-95"
                            >
                                <Plus className="size-5" />
                                Add Income
                            </button>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-700 active:scale-95"
                            >
                                <Plus className="size-5" />
                                Add Expense
                            </button>
                        </div>
                    )
                }
            />


            {/* Tabs */}
            <div className="grid grid-cols-2 md:flex md:overflow-x-auto rounded-xl border border-border bg-white p-1 gap-1">
                {[
                    { id: 'overview', label: 'Overview', icon: PieChart },
                    { id: 'list', label: 'Expense/Income', icon: List },
                    { id: 'categories', label: 'Categories', icon: Tags },
                    { id: 'reports', label: 'P&L Report', icon: FileText },
                ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center justify-start gap-3 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <Icon className="size-4 shrink-0" />
                            <span className="truncate">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="space-y-6">
                {activeTab === 'list' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        {/* Advanced Filters Bar */}
                        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
                            {/* Type Toggle */}
                            <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1">
                                {[
                                    { id: 'all', label: 'All' },
                                    { id: 'expense', label: 'Expense' },
                                    { id: 'income', label: 'Income' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setTypeFilter(tab.id as any)}
                                        className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
                                            typeFilter === tab.id 
                                                ? 'bg-white text-primary shadow-sm' 
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="h-6 w-px bg-border hidden md:block" />

                            {/* Search */}
                            <div className="flex items-center flex-1 min-w-[200px] relative">
                                <Search className="absolute left-3 size-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search transactions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-10 rounded-xl border border-border bg-muted/20 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                                />
                            </div>

                            <div className="h-6 w-px bg-border hidden lg:block" />

                            {/* Date Range */}
                            <div className="flex items-center gap-2 bg-muted/30 rounded-xl px-3 py-1.5 border border-border">
                                <Calendar className="size-4 text-muted-foreground" />
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange((prev: any) => ({ ...prev, start: e.target.value }))}
                                    className="text-xs border-none bg-transparent outline-none w-28"
                                />
                                <span className="text-muted-foreground">-</span>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange((prev: any) => ({ ...prev, end: e.target.value }))}
                                    className="text-xs border-none bg-transparent outline-none w-28"
                                />
                            </div>

                            <div className="h-6 w-px bg-border hidden xl:block" />

                            {/* Category Filter */}
                            <div className="flex items-center gap-2">
                                <Filter className="size-4 text-muted-foreground" />
                                <select 
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="h-10 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/10 min-w-[150px]"
                                >
                                    <option value="all">All Categories</option>
                                    {expenseCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                    <option value="Sales">Sales Revenue</option>
                                </select>
                            </div>

                            <div className="h-6 w-px bg-border" />

                            {/* Export Actions */}
                            <div className="flex gap-2">
                                <button onClick={handleExportCSV} className="p-2 border border-border rounded-xl hover:bg-muted text-muted-foreground transition-colors" title="Export CSV">
                                    <Download className="size-5" />
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden overflow-x-auto scrollbar-hide">
                            <table className="w-full min-w-[800px]">
                                <thead className="bg-muted/30 border-b border-border">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-bold text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                                        <th className="text-left py-4 px-6 font-bold text-xs uppercase tracking-wider text-muted-foreground">Description</th>
                                        <th className="text-left py-4 px-6 font-bold text-xs uppercase tracking-wider text-muted-foreground">Category</th>
                                        <th className="text-left py-4 px-6 font-bold text-xs uppercase tracking-wider text-muted-foreground">Type</th>
                                        <th className="text-left py-4 px-6 font-bold text-xs uppercase tracking-wider text-muted-foreground">Amount</th>
                                        <th className="text-right py-4 px-6 font-bold text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredTransactions.length > 0 ? (
                                        filteredTransactions.map((item: any) => (
                                                <tr key={`${item.type}-${item.id}`} className="hover:bg-muted/30 transition-colors group">
                                                    <td className="py-4 px-6 text-sm text-muted-foreground">
                                                        {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <p className="font-bold text-sm text-foreground">{item.description}</p>
                                                        {item.notes && <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[200px] truncate">{item.notes}</p>}
                                                        {item.type === 'sale' && <span className="inline-flex mt-1 text-[9px] font-black uppercase tracking-tighter text-brand-primary/60">Automated Sale</span>}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className="text-xs font-medium text-muted-foreground">
                                                            {getCategoryName(item.categoryId)}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border ${item.type === 'expense'
                                                            ? 'bg-red-50 text-red-600 border-red-100'
                                                            : 'bg-green-50 text-green-600 border-green-100'
                                                            }`}>
                                                            {item.type === 'sale' ? 'Income' : item.type}
                                                        </span>
                                                    </td>
                                                    <td className={`py-4 px-6 font-black text-sm ${item.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                                                        {item.type === 'expense' ? '-' : '+'}${item.amount.toFixed(2)}
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {item.type !== 'sale' && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleEdit(item)}
                                                                        className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-primary transition-colors"
                                                                    >
                                                                        <Edit className="size-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            if (confirm('Are you sure?')) {
                                                                                if (item.type === 'expense') deleteExpense(item.id);
                                                                                if (item.type === 'income') deleteIncome(item.id);
                                                                            }
                                                                        }}
                                                                        className="p-2 hover:bg-red-50 rounded-md text-muted-foreground hover:text-red-600 transition-colors"
                                                                    >
                                                                        <Trash2 className="size-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-12 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <div className="p-3 bg-muted rounded-full">
                                                        <DollarSign className="size-6 opacity-40" />
                                                    </div>
                                                    <p>No {typeFilter !== 'all' ? typeFilter : 'transaction'} records found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'categories' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="rounded-xl border border-border bg-white shadow-sm overflow-x-auto scrollbar-hide">
                            <table className="w-full min-w-[500px]">
                                <thead className="bg-muted/30 border-b border-border">
                                    <tr>
                                        <th className="text-left py-3 px-6 font-medium text-sm text-muted-foreground">Category Name</th>
                                        <th className="text-left py-3 px-6 font-medium text-sm text-muted-foreground">Type</th>
                                        <th className="text-left py-3 px-6 font-medium text-sm text-muted-foreground">Status</th>
                                        <th className="text-right py-3 px-6 font-medium text-sm text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {expenseCategories.map((cat: ExpenseCategory) => (
                                        <tr key={cat.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="py-4 px-6 font-medium capitalize">{cat.name}</td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${cat.type === 'expense'
                                                    ? 'bg-red-50 text-red-700 border-red-100'
                                                    : 'bg-green-50 text-green-700 border-green-100'
                                                    }`}>
                                                    {cat.type}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-muted-foreground">
                                                {cat.isDefault ? 'System Default' : 'Custom'}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cat.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {cat.isActive ? 'Active' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {!cat.isDefault && (
                                                    <button
                                                        onClick={() => deleteCategory(cat.id)}
                                                        className="p-2 hover:bg-red-50 rounded-md text-red-600 transition-colors"
                                                        title={cat.isActive ? "Disable" : "Enable"}
                                                    >
                                                        {cat.isActive ? <Trash2 className="size-4" /> : <Plus className="size-4 rotate-45" />}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        {/* Date Filter in Overview */}
                        <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-white border border-border rounded-xl p-4 md:p-6 shadow-sm gap-6">
                            <div className="grid grid-cols-2 lg:flex lg:items-center gap-6 md:gap-8 w-full lg:w-auto">
                                <div className="space-y-1 col-span-2 lg:col-span-1">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Opening Balance</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-bold text-foreground">$</span>
                                        <input
                                            type="number"
                                            value={startingBalance}
                                            onChange={(e) => setStartingBalance(Number(e.target.value))}
                                            className="text-xl font-bold bg-transparent border-none outline-none w-24 sm:w-32 focus:ring-1 focus:ring-primary/20 rounded"
                                        />
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-border hidden lg:block" />
                                <div className="space-y-1">
                                    <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Movement</p>
                                    <p className={`text-xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
                                    </p>
                                </div>
                                <div className="h-10 w-px bg-border hidden lg:block" />
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Closing Balance</p>
                                    <p className="text-xl font-bold text-primary">${(startingBalance + netProfit).toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                <div className="flex flex-1 items-center gap-2 bg-muted/30 rounded-lg p-1 lg:mr-4 min-w-[260px] sm:min-w-[300px]">
                                    <Calendar className="size-4 text-muted-foreground ml-2 shrink-0" />
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange((prev: any) => ({ ...prev, start: e.target.value }))}
                                        className="text-xs sm:text-sm border-none outline-none bg-transparent w-full"
                                    />
                                    <span className="text-muted-foreground text-xs sm:text-sm">-</span>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange((prev: any) => ({ ...prev, end: e.target.value }))}
                                        className="text-xs sm:text-sm border-none outline-none bg-transparent w-full"
                                    />
                                </div>
                                <div className="flex gap-2 ml-auto lg:ml-0">
                                    <button onClick={handleExportCSV} className="p-2 border border-border rounded-lg hover:bg-muted text-muted-foreground transition-colors" title="Export CSV">
                                        <Download className="size-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
                                { label: 'Total Expenses', value: `$${totalExpenses.toFixed(2)}`, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' },
                                { label: 'Net Profit', value: `$${netProfit.toFixed(2)}`, icon: PieChart, color: netProfit >= 0 ? 'text-blue-600' : 'text-red-600', bg: netProfit >= 0 ? 'bg-blue-100' : 'bg-red-100' },
                                { label: 'Profit Margin', value: `${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%`, icon: Tags, color: 'text-purple-600', bg: 'bg-purple-100' },
                            ].map((card, i) => (
                                <div key={i} className="rounded-xl border border-border bg-white p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex size-10 items-center justify-center rounded-lg ${card.bg} ${card.color}`}>
                                            <card.icon className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                                            <p className="text-2xl font-bold">{card.value}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>


                        {/* Income Breakdown & Expense Breakdown */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Income Breakdown Pie Chart */}
                            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                                <h3 className="mb-6 font-semibold flex items-center gap-2">
                                    <PieChart className="size-5 text-green-600" />
                                    Income Sources
                                </h3>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={incomePieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {incomePieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={getDynamicIncomeColor(index)} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                            <Legend />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {topIncomes.map(([name, amount]: [string, number], i: number) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="font-medium flex items-center gap-2">
                                                <div className="size-2 rounded-full" style={{ backgroundColor: getDynamicIncomeColor(i) }} />
                                                {name}
                                            </span>
                                            <span className="text-muted-foreground">${amount.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Expense Category Breakdown Pie Chart */}
                            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                                <h3 className="mb-6 font-semibold flex items-center gap-2">
                                    <PieChart className="size-5 text-red-600" />
                                    Expense Breakdown
                                </h3>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={getDynamicExpenseColor(index)} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                            <Legend />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {topExpenses.map(([name, amount]: [string, number], i: number) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="font-medium flex items-center gap-2">
                                                <div className="size-2 rounded-full" style={{ backgroundColor: getDynamicExpenseColor(i) }} />
                                                {name}
                                            </span>
                                            <span className="text-muted-foreground">${amount.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Cash Flow Area Chart */}
                        <div className="rounded-xl border border-border bg-white p-6 shadow-sm flex flex-col">
                            <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                                <TrendingDown className="size-5 text-primary" />
                                Cash Flow Analysis
                            </h3>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 10, fill: '#6B7280' }} 
                                            minTickGap={30}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fontSize: 10, fill: '#6B7280' }} 
                                            tickFormatter={(val) => `$${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`} 
                                        />
                                        <Tooltip
                                            contentStyle={{ 
                                                borderRadius: '12px', 
                                                border: '1px solid #E5E7EB', 
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                padding: '12px'
                                            }}
                                            formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, '']}
                                        />
                                        <Legend verticalAlign="top" height={36} iconType="circle" />
                                        <Area type="monotone" dataKey="income" name="Income" stroke="#16a34a" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="expense" name="Expenses" stroke="#dc2626" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="balance" name="Balance" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBalance)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'reports' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="rounded-xl border border-border bg-white shadow-sm overflow-x-auto scrollbar-hide">
                            <div className="bg-muted/30 border-b border-border px-4 py-4 md:px-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                <h3 className="font-semibold text-lg text-foreground">Profit & Loss Statement</h3>
                                {/* Date Filter in Reports */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="flex items-center gap-2 bg-white border border-border rounded-lg p-1 shadow-sm overflow-hidden">
                                        <input
                                            type="date"
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange((prev: any) => ({ ...prev, start: e.target.value }))}
                                            className="text-[10px] sm:text-xs border-none outline-none bg-transparent w-24 sm:w-28 px-1"
                                        />
                                        <span className="text-muted-foreground text-xs">-</span>
                                        <input
                                            type="date"
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange((prev: any) => ({ ...prev, end: e.target.value }))}
                                            className="text-[10px] sm:text-xs border-none outline-none bg-transparent w-24 sm:w-28 px-1"
                                        />
                                    </div>
                                    <div className="flex gap-2 ml-auto sm:ml-0">
                                        <button onClick={handleExportCSV} className="p-2 border border-border bg-white rounded-lg hover:bg-muted text-muted-foreground transition-colors" title="Export CSV">
                                            <Download className="size-4 md:size-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Income Section */}
                                <div>
                                    <h4 className="font-medium text-green-700 mb-3 uppercase text-xs tracking-wider">Income</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between py-2 border-b border-dashed border-border text-sm">
                                            <span>Sales Revenue</span>
                                            <span className="font-medium">${salesRevenue.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-dashed border-border text-sm">
                                            <span>Manual Income</span>
                                            <span className="font-medium">${manualIncomeParams.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-border font-medium bg-green-50 px-2 rounded-md">
                                            <span>Total Income</span>
                                            <span className="text-green-700">${totalRevenue.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Expenses Section */}
                                <div>
                                    <h4 className="font-medium text-red-700 mb-3 uppercase text-xs tracking-wider">Operating Expenses</h4>
                                    <div className="space-y-2">
                                        {(Object.entries(expensesByCategory) as [string, number][]).map(([name, amount]) => (
                                            <div key={name} className="flex justify-between py-2 border-b border-dashed border-border text-sm">
                                                <span>{name}</span>
                                                <span>${amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                        {Object.keys(expensesByCategory).length === 0 && (
                                            <div className="py-2 text-sm text-muted-foreground">No expenses recorded.</div>
                                        )}
                                        <div className="flex justify-between py-2 border-b border-border font-medium bg-red-50 px-2 rounded-md">
                                            <span>Total Expenses</span>
                                            <span className="text-red-700">${totalExpenses.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Net Profit Section */}
                                <div className="pt-4 space-y-2">
                                    <div className="flex justify-between py-2 border-t border-border text-sm">
                                        <span>Opening Cash Balance</span>
                                        <span className="font-medium">${startingBalance.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-border text-sm">
                                        <span>Net Change in Cash</span>
                                        <span className={`font-medium ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                            {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className={`flex justify-between py-4 font-bold text-lg ${startingBalance + netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        <span>Closing Cash Balance</span>
                                        <span>${(startingBalance + netProfit).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Placeholder for other tabs */}
                {(activeTab !== 'list' && activeTab !== 'categories' && activeTab !== 'overview' && activeTab !== 'reports') && (
                    <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground rounded-xl border border-border bg-white border-dashed">
                        <p>Content for {activeTab} coming next...</p>
                    </div>
                )}
            </div>

            {/* Add Category Modal */}
            <AnimatedModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)}>
                <div className="w-[400px] bg-white rounded-xl shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-border bg-muted/30">
                        <h2 className="text-lg font-bold">Add Category</h2>
                        <p className="text-sm text-muted-foreground">Create a new expense category</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Travel"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setNewCategoryType('expense')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${newCategoryType === 'expense'
                                        ? 'bg-red-50 border-red-200 text-red-700'
                                        : 'bg-white border-border text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    Expense
                                </button>
                                <button
                                    onClick={() => setNewCategoryType('income')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${newCategoryType === 'income'
                                        ? 'bg-green-50 border-green-200 text-green-700'
                                        : 'bg-white border-border text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    Income
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-muted/50 flex justify-end gap-3">
                        <button
                            onClick={() => setIsCategoryModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddCategory}
                            disabled={!newCategoryName.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            Save Category
                        </button>
                    </div>
                </div>
            </AnimatedModal>

            {/* Add Expense Modal */}
            <AnimatedModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)}>
                <div className="w-[500px] bg-white rounded-xl shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-border bg-muted/30">
                        <h2 className="text-lg font-bold">Add New Expense</h2>
                        <p className="text-sm text-muted-foreground">Record a business expense payment</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date</label>
                                <input
                                    type="date"
                                    value={newExpense.date}
                                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Amount</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={newExpense.amount || ''}
                                        onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })}
                                        className="w-full h-10 rounded-lg border border-border bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <input
                                type="text"
                                placeholder="e.g. Office Rent Types"
                                value={newExpense.description}
                                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <SmartCategorySelect
                                value={newExpense.categoryId}
                                onChange={(val) => setNewExpense({ ...newExpense, categoryId: val })}
                                type="expense"
                                placeholder="Select Expense Category"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notes (Optional)</label>
                            <textarea
                                rows={3}
                                value={newExpense.notes}
                                onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-muted/50 flex justify-end gap-3">
                        <button
                            onClick={() => setIsAddModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddExpense}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg shadow-sm hover:bg-primary/90 transition-colors"
                        >
                            Save Expense
                        </button>
                    </div>
                </div>
            </AnimatedModal>

            {/* Edit Transaction Modal */}
            <AnimatedModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                <div className="w-[500px] bg-white rounded-xl shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-border bg-muted/30">
                        <h2 className="text-lg font-bold">Edit {editingTransaction?.type === 'expense' ? 'Expense' : 'Income'}</h2>
                        <p className="text-sm text-muted-foreground">Modify transaction details</p>
                    </div>
                    {editingTransaction && (
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Date</label>
                                    <input
                                        type="date"
                                        value={editingTransaction.date}
                                        onChange={(e) => setEditingTransaction({ ...editingTransaction, date: e.target.value })}
                                        className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Amount</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={editingTransaction.amount}
                                            onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: parseFloat(e.target.value) })}
                                            className="w-full h-10 rounded-lg border border-border bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <input
                                    type="text"
                                    placeholder="Description"
                                    value={editingTransaction.description}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <SmartCategorySelect
                                    value={editingTransaction.categoryId}
                                    onChange={(val) => setEditingTransaction({ ...editingTransaction, categoryId: val })}
                                    type={editingTransaction.type === 'income' ? 'income' : 'expense'}
                                    placeholder="Select Category"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Notes (Optional)</label>
                                <textarea
                                    rows={3}
                                    value={editingTransaction.notes || ''}
                                    onChange={(e) => setEditingTransaction({ ...editingTransaction, notes: e.target.value })}
                                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>
                        </div>
                    )}
                    <div className="p-4 bg-muted/50 flex justify-end gap-3">
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpdateTransaction}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors ${editingTransaction?.type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'}`}
                        >
                            Update {editingTransaction?.type === 'expense' ? 'Expense' : 'Income'}
                        </button>
                    </div>
                </div>
            </AnimatedModal>

            {/* Add Income Modal */}
            <AnimatedModal isOpen={isAddIncomeModalOpen} onClose={() => setIsAddIncomeModalOpen(false)}>
                <div className="w-[500px] bg-white rounded-xl shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-border bg-muted/30">
                        <h2 className="text-lg font-bold">Add New Income</h2>
                        <p className="text-sm text-muted-foreground">Record manual income entry</p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Date</label>
                                <input
                                    type="date"
                                    value={newIncome.date}
                                    onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Amount</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={newIncome.amount || ''}
                                        onChange={(e) => setNewIncome({ ...newIncome, amount: parseFloat(e.target.value) })}
                                        className="w-full h-10 rounded-lg border border-border bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Source / Description</label>
                            <input
                                type="text"
                                placeholder="e.g. Consulting Fee"
                                value={newIncome.source}
                                onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })}
                                className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <SmartCategorySelect
                                value={newIncome.categoryId || ''}
                                onChange={(val) => setNewIncome({ ...newIncome, categoryId: val })}
                                type="income"
                                placeholder="Select Income Category"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notes (Optional)</label>
                            <textarea
                                rows={3}
                                value={newIncome.notes}
                                onChange={(e) => setNewIncome({ ...newIncome, notes: e.target.value })}
                                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-muted/50 flex justify-end gap-3">
                        <button
                            onClick={() => setIsAddIncomeModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddIncome}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 transition-colors"
                        >
                            Save Income
                        </button>
                    </div>
                </div>
            </AnimatedModal>
        </AnimatedPage >
    );
}
