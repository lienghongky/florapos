import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { 
  Users, 
  Store, 
  UserCheck, 
  UserMinus, 
  Plus, 
  Search, 
  Activity,
  UserPlus,
  ArrowUpRight,
  Edit,
  Repeat,
  DollarSign,
  Calendar,
  CreditCard,
  AlertCircle,
  Key,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';

export function DashboardMasterPage() {
  const { 
    masterStats, 
    owners, 
    toggleUserActive, 
    deleteGlobalUser,
    resetOwnerPassword,
    inviteOwner,
    createStoreForOwner, 
    getOwnerStaff,
    globalStores,
    refreshGlobalStores,
    updateGlobalStore,
    transferStoreOwnership,
    globalStaff,
    refreshGlobalStaff,
    saasPayments,
    refreshSaaSPayments,
    recordSaaSPayment,
    refreshMasterData
  } = useApp();

  const [activeTab, setActiveTab] = useState<'owners' | 'stores' | 'staff' | 'payments'>('owners');
  const [searchTerm, setSearchTerm] = useState('');
  const [storeSearchTerm, setStoreSearchTerm] = useState('');
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('');
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  // Invite Owner State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');

  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCurrency, setNewStoreCurrency] = useState('USD');
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [ownerStaff, setOwnerStaff] = useState<any[]>([]);

  // Edit Store State
  const [isEditStoreModalOpen, setIsEditStoreModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [editStoreName, setEditStoreName] = useState('');
  const [editStoreCurrency, setEditStoreCurrency] = useState('USD');
  const [editStoreAddress, setEditStoreAddress] = useState('');
  const [editStorePhone, setEditStorePhone] = useState('');
  const [editStoreTaxRate, setEditStoreTaxRate] = useState(0);
  const [editStoreTaxId, setEditStoreTaxId] = useState('');
  const [editStoreWebsite, setEditStoreWebsite] = useState('');

  // Transfer Ownership State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetOwnerId, setTransferTargetOwnerId] = useState('');

  // Payment Tracking State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentOwnerId, setPaymentOwnerId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('USD');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStart, setPaymentStart] = useState('');
  const [paymentEnd, setPaymentEnd] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [ownerPaymentHistory, setOwnerPaymentHistory] = useState<any[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const filteredOwners = owners.filter(o => 
    o.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStores = globalStores.filter(s => 
    s.name?.toLowerCase().includes(storeSearchTerm.toLowerCase()) ||
    s.id?.toLowerCase().includes(storeSearchTerm.toLowerCase())
  );

  const filteredPayments = saasPayments.filter(p => 
    p.owner?.full_name?.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
    p.owner?.email?.toLowerCase().includes(paymentSearchTerm.toLowerCase())
  );

  const filteredStaff = globalStaff.filter(s => 
    s.full_name?.toLowerCase().includes(staffSearchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(staffSearchTerm.toLowerCase())
  );

  const handleToggleActive = async (id: string) => {
    try {
      await toggleUserActive(id);
      toast.success('User status updated');
    } catch (e) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) return;
    try {
      await deleteGlobalUser(id);
      toast.success('User deleted successfully');
      refreshMasterData();
      refreshGlobalStaff();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete user');
    }
  };

  const handleCreateStore = async () => {
    if (!newStoreName) return toast.error('Store name is required');
    try {
      await createStoreForOwner(selectedOwner.id, { name: newStoreName, currency: newStoreCurrency });
      toast.success('Store created successfully');
      setIsStoreModalOpen(false);
      setNewStoreName('');
      setSelectedOwner(null);
    } catch (e) {
      toast.error('Failed to create store');
    }
  };

  const handleViewStaff = async (owner: any) => {
    setSelectedOwner(owner);
    try {
      const staff = await getOwnerStaff(owner.id);
      setOwnerStaff(staff);
      setIsStaffModalOpen(true);
    } catch (e) {
      toast.error('Failed to fetch staff');
    }
  };

  const handleInviteOwner = async () => {
    if (!inviteEmail || !invitePassword || !inviteName) return toast.error('All fields are required');
    try {
      await inviteOwner({ email: inviteEmail, full_name: inviteName, password: invitePassword });
      toast.success('Owner invited successfully');
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInvitePassword('');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to invite owner');
    }
  };

  const handleEditStore = async () => {
    if (!editStoreName) return toast.error('Store name is required');
    try {
      await updateGlobalStore(selectedStore.id, { 
        name: editStoreName, 
        currency: editStoreCurrency,
        address: editStoreAddress,
        phone_number: editStorePhone,
        tax_rate: Number(editStoreTaxRate),
        tax_id: editStoreTaxId,
        website: editStoreWebsite
      });
      toast.success('Store updated successfully');
      setIsEditStoreModalOpen(false);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update store');
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferTargetOwnerId) return toast.error('Please select a new owner');
    try {
      await transferStoreOwnership(selectedStore.id, transferTargetOwnerId);
      toast.success('Ownership transferred successfully');
      setIsTransferModalOpen(false);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to transfer ownership');
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentOwnerId || !paymentAmount || !paymentDate || !paymentStart || !paymentEnd) {
      return toast.error('Please fill in all required fields');
    }
    try {
      await recordSaaSPayment({
        owner_id: paymentOwnerId,
        amount: Number(paymentAmount),
        currency: paymentCurrency,
        payment_date: paymentDate,
        coverage_start_date: paymentStart,
        coverage_end_date: paymentEnd,
        notes: paymentNotes
      });
      toast.success('Payment recorded successfully');
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      setPaymentNotes('');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to record payment');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    try {
      await resetOwnerPassword(selectedOwner.id, newPassword);
      setIsPasswordModalOpen(false);
      setNewPassword('');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to reset password');
    }
  };

  const openPaymentModalForOwner = (ownerId: string, latestPayment?: any) => {
    setPaymentOwnerId(ownerId);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    
    if (latestPayment) {
      // Prepopulate based on the latest payment
      const nextStart = new Date(latestPayment.coverage_end_date);
      nextStart.setDate(nextStart.getDate() + 1); // Start next day
      
      const nextEnd = new Date(nextStart);
      nextEnd.setMonth(nextEnd.getMonth() + 1); // Add 1 month

      setPaymentStart(nextStart.toISOString().split('T')[0]);
      setPaymentEnd(nextEnd.toISOString().split('T')[0]);
      setPaymentAmount(latestPayment.amount?.toString() || '');
      setPaymentCurrency(latestPayment.currency || 'USD');
    } else {
      // Default to a 1 month period starting today
      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 1);
      setPaymentStart(start.toISOString().split('T')[0]);
      setPaymentEnd(end.toISOString().split('T')[0]);
      setPaymentAmount('');
    }
    setIsPaymentModalOpen(true);
  };

  React.useEffect(() => {
    refreshMasterData();
    refreshGlobalStores();
    refreshSaaSPayments();
    refreshGlobalStaff();
  }, []);

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SaaS Master Control</h1>
          <p className="text-muted-foreground mt-1">Manage your platform owners, stores, and monitor global growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => { refreshMasterData(); refreshGlobalStores(); refreshGlobalStaff(); }}>
            <Activity className="size-4 mr-2" />
            Sync Platform
          </Button>
          <Button 
            className="bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg shadow-brand-primary/25"
            onClick={() => setIsInviteModalOpen(true)}
          >
            <UserPlus className="size-4 mr-2" />
            Invite Owner
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-slate-50 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="size-24" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-medium">Total Shop Owners</CardDescription>
            <CardTitle className="text-4xl font-bold">{masterStats?.totalOwners || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-green-600 font-medium bg-green-50 w-fit px-2 py-1 rounded-full">
              <ArrowUpRight className="size-3 mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-slate-50 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Store className="size-24" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-medium">Active Stores</CardDescription>
            <CardTitle className="text-4xl font-bold">{masterStats?.totalStores || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-green-600 font-medium bg-green-50 w-fit px-2 py-1 rounded-full">
              <ArrowUpRight className="size-3 mr-1" />
              +5 new this week
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-white to-slate-50 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="size-24" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="font-medium">Total Staff Members</CardDescription>
            <CardTitle className="text-4xl font-bold">{masterStats?.totalStaff || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-slate-600 font-medium bg-slate-100 w-fit px-2 py-1 rounded-full">
              <Activity className="size-3 mr-1" />
              Platform-wide capacity
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b">
        <button
          onClick={() => setActiveTab('owners')}
          className={`pb-3 font-medium transition-colors relative ${activeTab === 'owners' ? 'text-brand-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Shop Owners
          {activeTab === 'owners' && <motion.div layoutId="master-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />}
        </button>
        <button
          onClick={() => setActiveTab('stores')}
          className={`pb-3 font-medium transition-colors relative ${activeTab === 'stores' ? 'text-brand-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          All Stores
          {activeTab === 'stores' && <motion.div layoutId="master-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />}
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`pb-3 font-medium transition-colors relative ${activeTab === 'staff' ? 'text-brand-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Staff Management
          {activeTab === 'staff' && <motion.div layoutId="master-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />}
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 font-medium transition-colors relative ${activeTab === 'payments' ? 'text-brand-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Payments
          {activeTab === 'payments' && <motion.div layoutId="master-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />}
        </button>
      </div>

      {/* Content */}
      <Card className="border-none shadow-sm overflow-hidden">
        {activeTab === 'owners' && (
          <>
            <CardHeader className="border-b bg-slate-50/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Shop Owners</CardTitle>
                  <CardDescription>Manage owner accounts and provision new stores.</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search owners..." 
                    className="pl-9 h-9 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Stores</th>
                  <th className="px-6 py-4">Subscription</th>
                  <th className="px-6 py-4">Registered</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOwners.map((owner) => {
                  const ownerPayments = saasPayments.filter(p => p.owner_id === owner.id);
                  ownerPayments.sort((a, b) => new Date(b.coverage_end_date).getTime() - new Date(a.coverage_end_date).getTime());
                  const latestPayment = ownerPayments[0];

                  let daysLeftText = "No Subscription";
                  let isExpired = false;
                  let daysLeft = 0;

                  if (latestPayment) {
                    const end = new Date(latestPayment.coverage_end_date);
                    const today = new Date();
                    // Reset time to strictly compare dates
                    today.setHours(0, 0, 0, 0);
                    end.setHours(0, 0, 0, 0);
                    
                    const diffTime = end.getTime() - today.getTime();
                    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (daysLeft < 0) {
                      isExpired = true;
                      daysLeftText = `Expired ${Math.abs(daysLeft)} days ago`;
                    } else {
                      daysLeftText = `${daysLeft} days left`;
                    }
                  }

                  return (
                  <motion.tr 
                    key={owner.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm">
                          {owner.full_name?.[0] || owner.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{owner.full_name || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{owner.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {owner.is_active ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0.5 rounded-full font-medium">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none px-2 py-0.5 rounded-full font-medium">
                          Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {owner.store_roles?.map((sr: any) => (
                          <Badge key={sr.id} variant="outline" className="text-[10px] py-0 px-1.5 h-4 font-normal border-slate-200">
                            {sr.store?.name || 'Unknown'}
                          </Badge>
                        ))}
                        {(!owner.store_roles || owner.store_roles.length === 0) && (
                          <span className="text-xs text-muted-foreground italic">No stores</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {daysLeftText === 'No Subscription' ? (
                        <span className="text-xs text-muted-foreground italic">None</span>
                      ) : (
                        <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full w-fit ${isExpired ? 'bg-red-100 text-red-700' : daysLeft <= 7 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          {isExpired || daysLeft <= 7 ? <AlertCircle className="size-3" /> : <UserCheck className="size-3" />}
                          {daysLeftText}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(owner.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewStaff(owner)}
                          title="View Staff"
                        >
                          <Users className="size-4 text-muted-foreground" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setSelectedOwner(owner);
                            setIsStoreModalOpen(true);
                          }}
                          title="Create Store"
                        >
                          <Plus className="size-4 text-muted-foreground" />
                        </Button>
                        <Button 
                          variant={isExpired ? "default" : "ghost"} 
                          size="sm" 
                          className={isExpired ? "h-8 px-2 bg-red-600 hover:bg-red-700 text-white text-xs" : "h-8 w-8 p-0 text-green-600"}
                          onClick={() => openPaymentModalForOwner(owner.id, latestPayment)}
                          title={isExpired ? "Renew Subscription" : "Record Payment"}
                        >
                          {isExpired ? "Renew" : <DollarSign className="size-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-slate-500"
                          onClick={() => {
                            setSelectedOwner(owner);
                            setIsPasswordModalOpen(true);
                          }}
                          title="Reset Password"
                        >
                          <Key className="size-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-8 w-8 p-0 ${owner.is_active ? 'text-orange-600' : 'text-green-600'}`}
                          onClick={() => handleToggleActive(owner.id)}
                          title={owner.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {owner.is_active ? <UserMinus className="size-4" /> : <UserCheck className="size-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500"
                          onClick={() => handleDeleteUser(owner.id, owner.full_name || owner.email)}
                          title="Delete Owner"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
        </>
        )}
        {activeTab === 'stores' && (
          <>
            <CardHeader className="border-b bg-slate-50/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">All Stores</CardTitle>
                  <CardDescription>Manage stores and transfer ownership globally.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search stores..." 
                      className="pl-9 h-9 bg-white"
                      value={storeSearchTerm}
                      onChange={(e) => setStoreSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="bg-brand-primary hover:bg-brand-primary/90 text-white"
                    onClick={() => {
                      setSelectedOwner(null); // Clear selected owner to allow selection in modal if needed, or just open for the first owner
                      setIsStoreModalOpen(true);
                    }}
                  >
                    <Plus className="size-4 mr-2" />
                    Provision Store
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Store Details</th>
                      <th className="px-6 py-4">Currency</th>
                      <th className="px-6 py-4">Current Owner</th>
                      <th className="px-6 py-4">Created Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStores.map((store) => {
                      const ownerRel = store.users?.find((u: any) => u.role === 'OWNER');
                      const currentOwner = ownerRel?.user;

                      return (
                        <motion.tr 
                          key={store.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm">
                                <Store className="size-4" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{store.name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono truncate w-32">{store.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="secondary" className="font-mono text-xs">{store.currency || 'USD'}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            {currentOwner ? (
                              <div className="flex items-center gap-2">
                                <div className="size-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                                  {currentOwner.full_name?.[0] || currentOwner.email[0].toUpperCase()}
                                </div>
                                <span className="text-sm">{currentOwner.full_name || currentOwner.email}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-red-500 italic">Orphaned (No Owner)</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {new Date(store.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedStore(store);
                                  setEditStoreName(store.name);
                                  setEditStoreCurrency(store.currency || 'USD');
                                  setEditStoreAddress(store.address || '');
                                  setEditStorePhone(store.phone_number || '');
                                  setEditStoreTaxRate(store.tax_rate || 0);
                                  setEditStoreTaxId(store.tax_id || '');
                                  setEditStoreWebsite(store.website || '');
                                  setIsEditStoreModalOpen(true);
                                }}
                                title="Edit Store"
                              >
                                <Edit className="size-4 text-muted-foreground" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-orange-600"
                                onClick={() => {
                                  setSelectedStore(store);
                                  setTransferTargetOwnerId(currentOwner?.id || '');
                                  setIsTransferModalOpen(true);
                                }}
                                title="Transfer Ownership"
                              >
                                <Repeat className="size-4" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </>
        )}
        {activeTab === 'staff' && (
          <>
            <CardHeader className="border-b bg-slate-50/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Global Staff Management</CardTitle>
                  <CardDescription>Monitor and manage all staff accounts across the platform.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search staff..." 
                      className="pl-9 h-9 bg-white"
                      value={staffSearchTerm}
                      onChange={(e) => setStaffSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Staff Member</th>
                      <th className="px-6 py-4">Assigned Store</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStaff.map((staff) => {
                      const storeRel = staff.store_roles?.[0];
                      const store = storeRel?.store;

                      return (
                        <motion.tr 
                          key={staff.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-sm text-foreground">{staff.full_name}</p>
                              <p className="text-xs text-muted-foreground font-mono">{staff.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {store ? (
                              <div className="flex items-center gap-2">
                                <Store className="size-3.5 text-brand-primary" />
                                <span className="text-sm font-medium">{store.name}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No store assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={staff.is_active ? 'success' : 'secondary'} className="text-[10px] uppercase tracking-wider">
                              {staff.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {new Date(staff.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-slate-500"
                                onClick={() => {
                                  setSelectedOwner(staff); 
                                  setIsPasswordModalOpen(true);
                                }}
                                title="Reset Password"
                              >
                                <Key className="size-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className={`h-8 w-8 p-0 ${staff.is_active ? 'text-orange-600' : 'text-green-600'}`}
                                onClick={async () => {
                                  await toggleUserActive(staff.id);
                                  refreshGlobalStaff();
                                }}
                                title={staff.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {staff.is_active ? <UserMinus className="size-4" /> : <UserCheck className="size-4" />}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-500"
                                onClick={() => handleDeleteUser(staff.id, staff.full_name || staff.email)}
                                title="Delete Staff"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                    {filteredStaff.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                          No staff members found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </>
        )}
        {activeTab === 'payments' && (
          <>
            <CardHeader className="border-b bg-slate-50/50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Payment History</CardTitle>
                  <CardDescription>Track subscription payments from platform owners.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search owners..." 
                      className="pl-9 h-9 bg-white"
                      value={paymentSearchTerm}
                      onChange={(e) => setPaymentSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="bg-brand-primary hover:bg-brand-primary/90 text-white"
                    onClick={() => {
                      setPaymentOwnerId('');
                      setPaymentAmount('');
                      setPaymentDate(new Date().toISOString().split('T')[0]);
                      setIsPaymentModalOpen(true);
                    }}
                  >
                    <Plus className="size-4 mr-2" />
                    Record Payment
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Owner</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Coverage Period</th>
                      <th className="px-6 py-4">Payment Date</th>
                      <th className="px-6 py-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredPayments.map((payment) => (
                      <motion.tr 
                        key={payment.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                              {payment.owner?.full_name?.[0] || payment.owner?.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{payment.owner?.full_name || 'N/A'}</p>
                              <p className="text-[11px] text-muted-foreground">{payment.owner?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary" className="font-mono bg-green-100 text-green-800 hover:bg-green-100">
                            {payment.amount} {payment.currency}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Calendar className="size-3 text-muted-foreground" />
                            {new Date(payment.coverage_start_date).toLocaleDateString()} - {new Date(payment.coverage_end_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground truncate max-w-[200px]" title={payment.notes}>
                          {payment.notes || '-'}
                        </td>
                      </motion.tr>
                    ))}
                    {filteredPayments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                          No payment records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      {/* Modals (Native backdrop for simplicity) */}
      {isStoreModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Provision New Store</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Creating store for <span className="font-semibold text-foreground">{selectedOwner?.full_name || selectedOwner?.email}</span>
              </p>
            </div>
            <div className="p-6 space-y-4">
              {!selectedOwner && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Owner</label>
                  <select 
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={selectedOwner?.id || ''}
                    onChange={(e) => setSelectedOwner(owners.find(o => o.id === e.target.value))}
                  >
                    <option value="">Select an owner...</option>
                    {owners.map(owner => (
                      <option key={owner.id} value={owner.id}>
                        {owner.full_name} ({owner.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Store Name</label>
                <Input 
                  placeholder="e.g. Garden Heights" 
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={newStoreCurrency}
                  onChange={(e) => setNewStoreCurrency(e.target.value)}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="KHR">KHR - Cambodian Riel</option>
                  <option value="THB">THB - Thai Baht</option>
                </select>
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsStoreModalOpen(false)}>Cancel</Button>
              <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white" onClick={handleCreateStore}>
                Create Store
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Invite New Owner</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create a new shop owner account.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input 
                  placeholder="e.g. John Doe" 
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input 
                  type="email"
                  placeholder="e.g. owner@example.com" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Temporary Password</label>
                <Input 
                  type="password"
                  placeholder="Minimum 6 characters" 
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
              <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white" onClick={handleInviteOwner}>
                Create Account
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {isStaffModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Owner Staff Directory</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Viewing staff managed by <span className="font-semibold text-foreground">{selectedOwner?.full_name}</span>
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsStaffModalOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
            <div className="p-0 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold text-muted-foreground uppercase sticky top-0">
                  <tr>
                    <th className="px-6 py-3">Staff Name</th>
                    <th className="px-6 py-3">Assigned Store</th>
                    <th className="px-6 py-3">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {ownerStaff.length > 0 ? ownerStaff.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-brand-secondary/10 text-brand-primary flex items-center justify-center text-xs font-bold">
                            {entry.user?.full_name?.[0] || entry.user?.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{entry.user?.full_name || 'N/A'}</p>
                            <p className="text-[11px] text-muted-foreground">{entry.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="text-[10px] py-0 px-2 h-5 font-normal">
                          {entry.store?.name}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 capitalize text-xs">
                        {entry.role.toLowerCase()}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground italic">
                        No staff members found for this owner.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 flex justify-end border-t">
              <Button variant="outline" size="sm" onClick={() => setIsStaffModalOpen(false)}>Close Directory</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Store Modal */}
      {isEditStoreModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden"
          >
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Edit Store Details</h3>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Store Name</label>
                  <Input 
                    value={editStoreName}
                    onChange={(e) => setEditStoreName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Currency</label>
                  <select 
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={editStoreCurrency}
                    onChange={(e) => setEditStoreCurrency(e.target.value)}
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="KHR">KHR - Cambodian Riel</option>
                    <option value="THB">THB - Thai Baht</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tax Rate (%)</label>
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="0.00" 
                    value={editStoreTaxRate}
                    onChange={(e) => setEditStoreTaxRate(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tax ID / VAT</label>
                  <Input 
                    placeholder="VAT-123..." 
                    value={editStoreTaxId}
                    onChange={(e) => setEditStoreTaxId(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Physical Address</label>
                  <Input 
                    placeholder="123 Main St..." 
                    value={editStoreAddress}
                    onChange={(e) => setEditStoreAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input 
                    placeholder="+1..." 
                    value={editStorePhone}
                    onChange={(e) => setEditStorePhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Website</label>
                  <Input 
                    placeholder="https://..." 
                    value={editStoreWebsite}
                    onChange={(e) => setEditStoreWebsite(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsEditStoreModalOpen(false)}>Cancel</Button>
              <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white" onClick={handleEditStore}>
                Save Changes
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-orange-100 bg-orange-50/50">
              <h3 className="text-xl font-bold text-orange-800">Transfer Ownership</h3>
              <p className="text-sm text-orange-600/80 mt-1">
                Transferring <span className="font-semibold">{selectedStore?.name}</span> to a new owner.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select New Owner</label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={transferTargetOwnerId}
                  onChange={(e) => setTransferTargetOwnerId(e.target.value)}
                >
                  <option value="" disabled>Select an owner...</option>
                  {owners.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.full_name || o.email} ({o.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm p-4 rounded-lg">
                <strong>Warning:</strong> The current owner will be downgraded to <code>STAFF</code> for this store and the new owner will be granted full <code>OWNER</code> access.
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={handleTransferOwnership}>
                Confirm Transfer
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-8 relative"
          >
            <div className="p-6 border-b flex items-center gap-3">
              <div className="size-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <CreditCard className="size-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Record SaaS Payment</h3>
                <p className="text-sm text-muted-foreground">Log a subscription payment from an owner.</p>
              </div>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Owner</label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={paymentOwnerId}
                  onChange={(e) => setPaymentOwnerId(e.target.value)}
                >
                  <option value="" disabled>Select an owner...</option>
                  {owners.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.full_name || o.email} ({o.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input 
                    type="number"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Currency</label>
                  <select 
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    value={paymentCurrency}
                    onChange={(e) => setPaymentCurrency(e.target.value)}
                  >
                    <option value="USD">USD</option>
                    <option value="KHR">KHR</option>
                    <option value="THB">THB</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date Paid</label>
                <Input 
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-primary">Coverage Start</label>
                  <Input 
                    type="date"
                    value={paymentStart}
                    onChange={(e) => setPaymentStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-brand-primary">Coverage End</label>
                  <Input 
                    type="date"
                    value={paymentEnd}
                    onChange={(e) => setPaymentEnd(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium">Notes (Optional)</label>
                <Input 
                  placeholder="e.g. Bank Transfer Ref: 123456"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 flex items-center justify-end gap-3 border-t">
              <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
              <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white" onClick={handleRecordPayment}>
                Record Payment
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Reset Password</h3>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsPasswordModalOpen(false)}>
                  <X className="size-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Setting new password for <span className="font-semibold text-foreground">{selectedOwner?.full_name || selectedOwner?.email}</span>
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input 
                  type="password"
                  placeholder="Minimum 6 characters" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                Notice: The user will be able to log in with this new password immediately.
              </p>
            </div>
            <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
              <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white" onClick={handleResetPassword}>
                Update Password
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
