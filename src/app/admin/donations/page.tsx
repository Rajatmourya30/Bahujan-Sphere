'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QrCode, CreditCard, Plus, Edit, Trash2, Eye, Copy, TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';
import Image from 'next/image';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'qr_code' | 'payment_gateway' | 'bank_transfer' | 'upi';
  description?: string;
  qrCodeUrl?: string;
  qrCodeStoragePath?: string;
  gatewayConfig?: {
    apiKey?: string;
    merchantId?: string;
    webhookUrl?: string;
    publicKey?: string;
  };
  bankDetails?: {
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
    upiId?: string;
  };
  upiDetails?: {
    upiId: string;
    merchantName?: string;
    merchantCode?: string;
  };
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

interface Donation {
  id: string;
  donorName?: string;
  donorEmail?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  message?: string;
  createdAt: any;
  updatedAt: any;
}

export default function ManageDonationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [deleteMethodId, setDeleteMethodId] = useState<string | null>(null);
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'qr_code' as PaymentMethod['type'],
    description: '',
    gatewayConfig: {
      apiKey: '',
      merchantId: '',
      webhookUrl: '',
      publicKey: ''
    },
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      upiId: ''
    },
    upiDetails: {
      upiId: '',
      merchantName: '',
      merchantCode: ''
    }
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.replace('/admin/login');
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    // Fetch payment methods
    const methodsQuery = query(collection(db, 'paymentMethods'), orderBy('createdAt', 'desc'));
    const unsubscribeMethods = onSnapshot(methodsQuery, (snapshot) => {
      const methods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentMethod));
      setPaymentMethods(methods);
      setIsLoading(false);
    });

    // Fetch donations
    const donationsQuery = query(collection(db, 'donations'), orderBy('createdAt', 'desc'));
    const unsubscribeDonations = onSnapshot(donationsQuery, (snapshot) => {
      const donationsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation));
      setDonations(donationsList);
    });

    return () => {
      unsubscribeMethods();
      unsubscribeDonations();
    };
  }, [user]);

  const handleOpenDialog = (method: PaymentMethod | null = null) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        type: method.type,
        description: method.description || '',
        gatewayConfig: method.gatewayConfig || {
          apiKey: '',
          merchantId: '',
          webhookUrl: '',
          publicKey: ''
        },
        bankDetails: method.bankDetails || {
          accountName: '',
          accountNumber: '',
          bankName: '',
          ifscCode: '',
          upiId: ''
        },
        upiDetails: method.upiDetails || {
          upiId: '',
          merchantName: '',
          merchantCode: ''
        }
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: '',
        type: 'qr_code',
        description: '',
        gatewayConfig: {
          apiKey: '',
          merchantId: '',
          webhookUrl: '',
          publicKey: ''
        },
        bankDetails: {
          accountName: '',
          accountNumber: '',
          bankName: '',
          ifscCode: '',
          upiId: ''
        },
        upiDetails: {
          upiId: '',
          merchantName: '',
          merchantCode: ''
        }
      });
    }
    setQrCodeFile(null);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Payment method name is required', variant: 'destructive' });
      return;
    }

    try {
      let qrCodeUrl = '';
      let qrCodeStoragePath = '';

      // Upload QR code if provided
      if (qrCodeFile) {
        const qrCodeRef = ref(storage, `qr-codes/${Date.now()}-${qrCodeFile.name}`);
        await uploadBytes(qrCodeRef, qrCodeFile);
        qrCodeUrl = await getDownloadURL(qrCodeRef);
        qrCodeStoragePath = qrCodeRef.fullPath;
      }

      const methodData = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        isActive: true,
        updatedAt: Timestamp.now(),
        ...(formData.type === 'qr_code' && qrCodeUrl && {
          qrCodeUrl,
          qrCodeStoragePath
        }),
        ...(formData.type === 'payment_gateway' && {
          gatewayConfig: formData.gatewayConfig
        }),
        ...(formData.type === 'bank_transfer' && {
          bankDetails: formData.bankDetails
        }),
        ...(formData.type === 'upi' && {
          upiDetails: formData.upiDetails
        })
      };

      if (editingMethod) {
        // Update existing method
        await updateDoc(doc(db, 'paymentMethods', editingMethod.id), methodData);
        toast({ title: 'Success', description: 'Payment method updated successfully' });
      } else {
        // Create new method
        await addDoc(collection(db, 'paymentMethods'), {
          ...methodData,
          createdAt: Timestamp.now()
        });
        toast({ title: 'Success', description: 'Payment method created successfully' });
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving payment method:', error);
      toast({ title: 'Error', description: 'Failed to save payment method', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteMethodId) return;

    try {
      const method = paymentMethods.find(m => m.id === deleteMethodId);
      
      // Delete QR code from storage if exists
      if (method?.qrCodeStoragePath) {
        await deleteObject(ref(storage, method.qrCodeStoragePath));
      }

      await deleteDoc(doc(db, 'paymentMethods', deleteMethodId));
      toast({ title: 'Success', description: 'Payment method deleted successfully' });
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast({ title: 'Error', description: 'Failed to delete payment method', variant: 'destructive' });
    } finally {
      setDeleteMethodId(null);
    }
  };

  const toggleMethodStatus = async (methodId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'paymentMethods', methodId), {
        isActive: !currentStatus,
        updatedAt: Timestamp.now()
      });
      toast({ title: 'Success', description: 'Payment method status updated' });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Copied to clipboard' });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      completed: 'default',
      failed: 'destructive',
      refunded: 'outline'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  // Calculate donation statistics
  const getDonationStats = () => {
    const totalDonations = donations.length;
    const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
    const completedDonations = donations.filter(d => d.status === 'completed').length;
    const pendingDonations = donations.filter(d => d.status === 'pending').length;
    const failedDonations = donations.filter(d => d.status === 'failed').length;
    
    // This month's donations
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthDonations = donations.filter(donation => {
      const donationDate = donation.createdAt?.toDate?.();
      return donationDate && 
             donationDate.getMonth() === currentMonth && 
             donationDate.getFullYear() === currentYear;
    });
    const thisMonthAmount = thisMonthDonations.reduce((sum, donation) => sum + donation.amount, 0);
    
    // Average donation amount
    const averageAmount = totalDonations > 0 ? totalAmount / totalDonations : 0;
    
    // Unique donors
    const uniqueDonors = new Set(donations.map(d => d.donorEmail || d.donorName).filter(Boolean)).size;
    
    return {
      totalDonations,
      totalAmount,
      completedDonations,
      pendingDonations,
      failedDonations,
      thisMonthAmount,
      averageAmount,
      uniqueDonors
    };
  };

  const stats = getDonationStats();

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-3xl font-bold">Manage Donations</h1>
        <p className="text-muted-foreground">Configure payment methods and track donations</p>
      </header>

      {/* Donation Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalDonations} donations received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.thisMonthAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Current month donations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Math.round(stats.averageAmount).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Per donation average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Donors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueDonors}</div>
            <p className="text-xs text-muted-foreground">
              Individual contributors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedDonations}</div>
            <p className="text-xs text-muted-foreground">Successfully processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingDonations}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedDonations}</div>
            <p className="text-xs text-muted-foreground">Payment failed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="methods">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="donations">Donations History</TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Payment Methods</h2>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          </div>

          <div className="grid gap-4">
            {paymentMethods.map((method) => (
              <Card key={method.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {method.type === 'qr_code' && <QrCode className="h-5 w-5" />}
                        {method.type === 'payment_gateway' && <CreditCard className="h-5 w-5" />}
                        {method.name}
                        <Badge variant={method.isActive ? 'default' : 'secondary'}>
                          {method.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{method.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleMethodStatus(method.id, method.isActive)}
                      >
                        {method.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(method)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeleteMethodId(method.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {method.type === 'qr_code' && method.qrCodeUrl && (
                    <div className="flex items-center gap-4">
                      <Image
                        src={method.qrCodeUrl}
                        alt="QR Code"
                        width={100}
                        height={100}
                        className="border rounded"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(method.qrCodeUrl!)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy QR URL
                      </Button>
                    </div>
                  )}
                  {method.type === 'bank_transfer' && method.bankDetails && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Account Name:</strong> {method.bankDetails.accountName}
                      </div>
                      <div>
                        <strong>Account Number:</strong> {method.bankDetails.accountNumber}
                      </div>
                      <div>
                        <strong>Bank Name:</strong> {method.bankDetails.bankName}
                      </div>
                      <div>
                        <strong>IFSC Code:</strong> {method.bankDetails.ifscCode}
                      </div>
                      {method.bankDetails.upiId && (
                        <div>
                          <strong>UPI ID:</strong> {method.bankDetails.upiId}
                        </div>
                      )}
                    </div>
                  )}
                  {method.type === 'upi' && method.upiDetails && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="col-span-2">
                        <strong>UPI ID:</strong> {method.upiDetails.upiId}
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          onClick={() => copyToClipboard(method.upiDetails!.upiId)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      {method.upiDetails.merchantName && (
                        <div>
                          <strong>Merchant Name:</strong> {method.upiDetails.merchantName}
                        </div>
                      )}
                      {method.upiDetails.merchantCode && (
                        <div>
                          <strong>Merchant Code:</strong> {method.upiDetails.merchantCode}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="donations" className="space-y-6">
          <h2 className="text-2xl font-bold">Donations History</h2>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{donation.donorName || 'Anonymous'}</div>
                          {donation.donorEmail && (
                            <div className="text-sm text-muted-foreground">{donation.donorEmail}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {donation.currency} {donation.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{donation.paymentMethod}</TableCell>
                      <TableCell>{getStatusBadge(donation.status)}</TableCell>
                      <TableCell>
                        {donation.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {donations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No donations found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Payment Method Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </DialogTitle>
            <DialogDescription>
              Configure a new payment method for accepting donations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Method Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., UPI Payment, Bank Transfer"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: PaymentMethod['type']) => 
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qr_code">QR Code</SelectItem>
                    <SelectItem value="payment_gateway">Payment Gateway</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description for this payment method"
              />
            </div>

            {formData.type === 'qr_code' && (
              <div>
                <Label htmlFor="qrCode">QR Code Image</Label>
                <Input
                  id="qrCode"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setQrCodeFile(e.target.files?.[0] || null)}
                />
                {editingMethod?.qrCodeUrl && !qrCodeFile && (
                  <div className="mt-2">
                    <Image
                      src={editingMethod.qrCodeUrl}
                      alt="Current QR Code"
                      width={100}
                      height={100}
                      className="border rounded"
                    />
                  </div>
                )}
              </div>
            )}

            {formData.type === 'payment_gateway' && (
              <div className="space-y-4">
                <h4 className="font-medium">Gateway Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={formData.gatewayConfig.apiKey}
                      onChange={(e) => setFormData({
                        ...formData,
                        gatewayConfig: { ...formData.gatewayConfig, apiKey: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="merchantId">Merchant ID</Label>
                    <Input
                      id="merchantId"
                      value={formData.gatewayConfig.merchantId}
                      onChange={(e) => setFormData({
                        ...formData,
                        gatewayConfig: { ...formData.gatewayConfig, merchantId: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      value={formData.gatewayConfig.webhookUrl}
                      onChange={(e) => setFormData({
                        ...formData,
                        gatewayConfig: { ...formData.gatewayConfig, webhookUrl: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="publicKey">Public Key</Label>
                    <Input
                      id="publicKey"
                      value={formData.gatewayConfig.publicKey}
                      onChange={(e) => setFormData({
                        ...formData,
                        gatewayConfig: { ...formData.gatewayConfig, publicKey: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.type === 'bank_transfer' && (
              <div className="space-y-4">
                <h4 className="font-medium">Bank Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      value={formData.bankDetails.accountName}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, accountName: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={formData.bankDetails.accountNumber}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={formData.bankDetails.bankName}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input
                      id="ifscCode"
                      value={formData.bankDetails.ifscCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, ifscCode: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankUpiId">UPI ID (Optional)</Label>
                    <Input
                      id="bankUpiId"
                      value={formData.bankDetails.upiId}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, upiId: e.target.value }
                      })}
                      placeholder="e.g., account@bank"
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.type === 'upi' && (
              <div className="space-y-4">
                <h4 className="font-medium">UPI Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input
                      id="upiId"
                      value={formData.upiDetails.upiId}
                      onChange={(e) => setFormData({
                        ...formData,
                        upiDetails: { ...formData.upiDetails, upiId: e.target.value }
                      })}
                      placeholder="e.g., yourname@paytm"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="merchantName">Merchant Name (Optional)</Label>
                    <Input
                      id="merchantName"
                      value={formData.upiDetails.merchantName}
                      onChange={(e) => setFormData({
                        ...formData,
                        upiDetails: { ...formData.upiDetails, merchantName: e.target.value }
                      })}
                      placeholder="e.g., Your Organization"
                    />
                  </div>
                  <div>
                    <Label htmlFor="merchantCode">Merchant Code (Optional)</Label>
                    <Input
                      id="merchantCode"
                      value={formData.upiDetails.merchantCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        upiDetails: { ...formData.upiDetails, merchantCode: e.target.value }
                      })}
                      placeholder="e.g., MERCHANT123"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingMethod ? 'Update' : 'Create'} Payment Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteMethodId} onOpenChange={() => setDeleteMethodId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment method? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
