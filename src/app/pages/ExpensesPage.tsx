import { AnimatedPage } from '@/app/components/motion/AnimatedPage';
import { useApp, Expense, Sale, ExpenseCategory, Income } from '@/app/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
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
    Printer
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

export function ExpensesPage() {
    const { user, expenses, sales, expenseCategories, addExpense, deleteExpense, addCategory, deleteCategory, incomes, addIncome, deleteIncome } = useApp();
    const [activeTab, setActiveTab] = useState('overview'); // overview, list, categories, reports
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');

    // Date Filters
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
        end: new Date().toISOString().split('T')[0] // Today
    });

    const handlePrint = () => {
        window.print();
    };

    const handleExportCSV = () => {
        const headers = ['Date', 'Description', 'Category', 'Amount', 'Payment Method', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...filteredExpenses.map(exp => [
                exp.date,
                `"${exp.description}"`,
                getCategoryName(exp.categoryId),
                exp.amount,
                exp.paymentMethod,
                `"${exp.notes || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses-${dateRange.start}-to-${dateRange.end}.csv`;
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

    const handleAddExpense = () => {
        if (!newExpense.description || !newExpense.amount || !newExpense.categoryId) {
            toast.error("Please fill in all required fields");
            return;
        }

        addExpense({
            date: newExpense.date || new Date().toISOString(),
            description: newExpense.description,
            amount: Number(newExpense.amount),
            categoryId: newExpense.categoryId,
            paymentMethod: newExpense.paymentMethod,
            notes: newExpense.notes,
            isRecurring: false // default for now
        } as any);

        toast.success("Expense added successfully");
        setIsAddModalOpen(false);
        // Reset form
        setNewExpense({
            date: new Date().toISOString().split('T')[0],
            description: '',
            amount: 0,
            categoryId: expenseCategories[0]?.id || '',
            paymentMethod: 'Cash',
            notes: ''
        });
    };

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;
        addCategory({
            name: newCategoryName,
            isActive: true,
            isDefault: false
        });
        setNewCategoryName('');
        setIsCategoryModalOpen(false);
        toast.success("Category added");
    };

    const handleAddIncome = () => {
        if (!newIncome.source || !newIncome.amount) {
            toast.error("Please fill in source and amount");
            return;
        }

        addIncome({
            date: newIncome.date || new Date().toISOString(),
            source: newIncome.source,
            amount: Number(newIncome.amount),
            categoryId: newIncome.categoryId || expenseCategories[0]?.id || '1',
            paymentMethod: newIncome.paymentMethod,
            notes: newIncome.notes
        });

        toast.success("Income added successfully");
        setIsAddIncomeModalOpen(false);
        setNewIncome({
            date: new Date().toISOString().split('T')[0],
            source: '',
            amount: 0,
            categoryId: expenseCategories[0]?.id || '',
            paymentMethod: 'Cash',
            notes: ''
        });
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

    const filteredSales = sales.filter((sale: Sale) => filterByDate(sale.date));
    const filteredIncomes = incomes.filter((inc: Income) => filterByDate(inc.date));

    // Financial calculations (Use ID-agnostic, Date-filtered data)
    const salesRevenue = filteredSales.reduce((acc: number, sale: Sale) => acc + sale.total, 0);
    const manualIncomeParams = filteredIncomes.reduce((acc: number, inc: Income) => acc + inc.amount, 0);
    const totalRevenue = salesRevenue + manualIncomeParams;

    const totalExpenses = expensesByDate.reduce((acc: number, exp: Expense) => acc + exp.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    const expensesByCategory = expensesByDate.reduce((acc: Record<string, number>, exp: Expense) => {
        const catName = getCategoryName(exp.categoryId);
        acc[catName] = (acc[catName] || 0) + exp.amount;
        return acc;
    }, {} as Record<string, number>);

    // Chart Data Preparation
    const getDaysArray = (start: string, end: string) => {
        const arr = [];
        for (let dt = new Date(start); dt <= new Date(end); dt.setDate(dt.getDate() + 1)) {
            arr.push(new Date(dt).toISOString().split('T')[0]);
        }
        return arr;
    };

    const chartData = getDaysArray(dateRange.start, dateRange.end).map(date => {
        const daysSales = filteredSales.filter((s: Sale) => s.date.startsWith(date)).reduce((sum: number, s: Sale) => sum + s.total, 0);
        const daysIncome = filteredIncomes.filter((i: Income) => i.date.startsWith(date)).reduce((sum: number, i: Income) => sum + i.amount, 0);
        const totalDayIncome = daysSales + daysIncome;

        const daysExpenses = expensesByDate.filter((e: Expense) => e.date === date).reduce((sum: number, e: Expense) => sum + e.amount, 0);
        return {
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            income: totalDayIncome,
            expense: daysExpenses,
            net: totalDayIncome - daysExpenses
        };
    });

    const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }));
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    // Sort logic for top expenses
    const topExpenses = (Object.entries(expensesByCategory) as [string, number][])
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    // Combine for List View
    const allTransactions = [
        ...filteredExpenses.map(e => ({ ...e, type: 'expense' as const })),
        ...filteredIncomes.map(i => ({ ...i, description: i.source, type: 'income' as const })),
        ...filteredSales.map(s => ({
            id: s.id,
            date: s.date,
            description: `Sale #${s.id} - ${s.items.length} items`,
            amount: s.total,
            categoryId: 'Sales',
            type: 'sale' as const,
            paymentMethod: s.paymentMethod
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <AnimatedPage className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between hide-print">
                <div>
                    <h1 className="text-3xl font-semibold">Expense Management</h1>
                    <p className="mt-1 text-muted-foreground">Track and manage business expenses</p>
                </div>
                <div className="flex items-center gap-3">




                    {activeTab === 'categories' ? (
                        <button
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-white shadow-md hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="size-5" />
                            Add Category
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsAddIncomeModalOpen(true)}
                                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white shadow-md hover:bg-green-700 transition-colors"
                            >
                                <Plus className="size-5" />
                                Add Income
                            </button>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white shadow-md hover:bg-red-700 transition-colors"
                            >
                                <Plus className="size-5" />
                                Add Expense
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto rounded-xl border border-border bg-white p-1">
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
                            className={`flex min-w-[140px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <Icon className="size-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            <div className="space-y-6">
                {activeTab === 'list' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-white p-4 shadow-sm">
                            <Search className="size-4 text-muted-foreground ml-2" />
                            <input
                                type="text"
                                placeholder="Search expenses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                            />
                            <div className="h-4 w-px bg-border mx-2" />

                            {/* Date Filter in List */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground font-medium">Date:</span>
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange((prev: any) => ({ ...prev, start: e.target.value }))}
                                    className="text-xs border border-border rounded px-2 py-1"
                                />
                                <span className="text-muted-foreground text-xs">-</span>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange((prev: any) => ({ ...prev, end: e.target.value }))}
                                    className="text-xs border border-border rounded px-2 py-1"
                                />
                            </div>

                            <div className="h-4 w-px bg-border mx-2" />

                            <button onClick={handleExportCSV} className="p-1.5 border border-border rounded hover:bg-muted text-muted-foreground transition-colors" title="Export CSV">
                                <Download className="size-4" />
                            </button>
                            <button onClick={handlePrint} className="p-1.5 border border-border rounded hover:bg-muted text-muted-foreground transition-colors" title="Print Report">
                                <Printer className="size-4" />
                            </button>

                            <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                                <Filter className="size-4" />
                                Filter
                            </button>
                        </div>

                        {/* Table */}
                        <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-muted/30 border-b border-border">
                                    <tr>
                                        <th className="text-left py-3 px-6 font-medium text-sm text-muted-foreground">Date</th>
                                        <th className="text-left py-3 px-6 font-medium text-sm text-muted-foreground">Description</th>
                                        <th className="text-left py-3 px-6 font-medium text-sm text-muted-foreground">Category</th>
                                        <th className="text-left py-3 px-6 font-medium text-sm text-muted-foreground">Amount</th>
                                        <th className="text-right py-3 px-6 font-medium text-sm text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {allTransactions.length > 0 ? (
                                        allTransactions.map((item: any) => (
                                            <tr key={`${item.type}-${item.id}`} className="hover:bg-muted/50 transition-colors group">
                                                <td className="py-4 px-6 text-sm text-muted-foreground">
                                                    {new Date(item.date).toLocaleDateString()}
                                                </td>
                                                <td className="py-4 px-6 font-medium">
                                                    {item.description}
                                                    {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                                                    {item.type === 'sale' && <p className="text-xs text-muted-foreground mt-0.5">Automated Enty</p>}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${item.type === 'expense'
                                                        ? 'bg-gray-100 text-gray-800 border-gray-200'
                                                        : 'bg-green-100 text-green-800 border-green-200'
                                                        }`}>
                                                        {getCategoryName(item.categoryId)}
                                                    </span>
                                                </td>
                                                <td className={`py-4 px-6 font-medium ${item.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                                                    {item.type === 'expense' ? '-' : '+'}${item.amount.toFixed(2)}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {item.type !== 'sale' && (
                                                            <>
                                                                <button className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-primary transition-colors">
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
                                            <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <div className="p-3 bg-muted rounded-full">
                                                        <DollarSign className="size-6 opacity-40" />
                                                    </div>
                                                    <p>No transactions found</p>
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
                        <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
                            <table className="w-full">
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
                                            <td className="py-4 px-6 font-medium">{cat.name}</td>
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
                        <div className="flex justify-end">
                            <div className="flex items-center gap-2 bg-white border border-border rounded-lg p-1.5 shadow-sm">
                                <Calendar className="size-4 text-muted-foreground ml-2" />
                                <input
                                    type="date"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange((prev: any) => ({ ...prev, start: e.target.value }))}
                                    className="text-sm border-none outline-none bg-transparent w-32"
                                />
                                <span className="text-muted-foreground text-sm">-</span>
                                <input
                                    type="date"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange((prev: any) => ({ ...prev, end: e.target.value }))}
                                    className="text-sm border-none outline-none bg-transparent w-32"
                                />
                            </div>
                            <div className="flex gap-2 ml-4">
                                <button onClick={handleExportCSV} className="p-2 border border-border rounded-lg hover:bg-muted text-muted-foreground transition-colors" title="Export CSV">
                                    <Download className="size-5" />
                                </button>
                                <button onClick={handlePrint} className="p-2 border border-border rounded-lg hover:bg-muted text-muted-foreground transition-colors" title="Print Report">
                                    <Printer className="size-5" />
                                </button>
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

                        {/* Charts Area */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Expense Category Breakdown Pie Chart */}
                            <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                                <h3 className="mb-6 font-semibold flex items-center gap-2">
                                    <PieChart className="size-5 text-primary" />
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
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                                            <Legend />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 space-y-2">
                                    {topExpenses.map(([name, amount]: [string, number], i: number) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="font-medium flex items-center gap-2">
                                                <div className="size-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                {name}
                                            </span>
                                            <span className="text-muted-foreground">${amount.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cash Flow Area Chart */}
                            <div className="rounded-xl border border-border bg-white p-6 shadow-sm flex flex-col">
                                <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                                    <TrendingDown className="size-5 text-primary" />
                                    Cash Flow Analysis
                                </h3>
                                <div className="flex-1 min-h-[300px]">
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
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `$${val}`} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                            <Area type="monotone" dataKey="income" name="Income" stroke="#16a34a" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                                            <Area type="monotone" dataKey="expense" name="Expenses" stroke="#dc2626" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'reports' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
                            <div className="bg-muted/30 border-b border-border px-6 py-4 flex justify-between items-center">
                                <h3 className="font-semibold text-lg">Profit & Loss Statement</h3>
                                {/* Date Filter in Reports */}
                                <div className="flex items-center gap-2 bg-white border border-border rounded-lg p-1 shadow-sm">
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange((prev: any) => ({ ...prev, start: e.target.value }))}
                                        className="text-xs border-none outline-none bg-transparent w-28 px-1"
                                    />
                                    <span className="text-muted-foreground text-xs">-</span>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange((prev: any) => ({ ...prev, end: e.target.value }))}
                                        className="text-xs border-none outline-none bg-transparent w-28 px-1"
                                    />
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button onClick={handlePrint} className="p-1.5 border border-border rounded hover:bg-muted text-muted-foreground transition-colors" title="Print Report">
                                        <Printer className="size-4" />
                                    </button>
                                    <button onClick={handleExportCSV} className="p-1.5 border border-border rounded hover:bg-muted text-muted-foreground transition-colors" title="Export CSV">
                                        <Download className="size-4" />
                                    </button>
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
                                <div className="pt-4">
                                    <div className={`flex justify-between py-4 border-t-2 border-border font-bold text-lg ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        <span>Net Profit / (Loss)</span>
                                        <span>${netProfit.toFixed(2)}</span>
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
                            <select
                                value={newExpense.categoryId}
                                onChange={(e) => setNewExpense({ ...newExpense, categoryId: e.target.value })}
                                className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                {expenseCategories.filter((c: ExpenseCategory) => c.isActive).map((cat: ExpenseCategory) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
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
                            <select
                                value={newIncome.categoryId || ''}
                                onChange={(e) => setNewIncome({ ...newIncome, categoryId: e.target.value })}
                                className="w-full h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="" disabled>Select Category</option>
                                {expenseCategories.filter((c: ExpenseCategory) => c.isActive).map((cat: ExpenseCategory) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
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
        </AnimatedPage>
    );
}
