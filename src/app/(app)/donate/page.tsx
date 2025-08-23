'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Heart, QrCode, CreditCard, Building, Copy, Check } from 'lucide-react';
import Image from 'next/image';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'qr_code' | 'payment_gateway' | 'bank_transfer' | 'upi';
  description?: string;
  qrCodeUrl?: string;
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
}

const PRESET_AMOUNTS = [100, 500, 1000, 2000, 5000];

export default function DonatePage() {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    customAmount: '',
    donorName: '',
    donorEmail: '',
    message: '',
    currency: 'INR'
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const methodsQuery = query(
        collection(db, 'paymentMethods'),
        where('isActive', '==', true)
      );
      const snapshot = await getDocs(methodsQuery);
      const methods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentMethod));
      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({ title: 'Error', description: 'Failed to load payment methods', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountSelect = (amount: number) => {
    setFormData({ ...formData, amount: amount.toString(), customAmount: '' });
  };

  const handleCustomAmountChange = (value: string) => {
    setFormData({ ...formData, customAmount: value, amount: '' });
  };

  const getSelectedAmount = () => {
    return formData.customAmount ? parseFloat(formData.customAmount) : parseFloat(formData.amount);
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    const amount = getSelectedAmount();
    if (!amount || amount <= 0) {
      toast({ title: 'Error', description: 'Please select or enter a donation amount', variant: 'destructive' });
      return;
    }

    setSelectedMethod(method);
    setIsDialogOpen(true);
  };

  const handleDonationSubmit = async () => {
    const amount = getSelectedAmount();
    if (!selectedMethod || !amount) return;

    try {
      // Create donation record
      await addDoc(collection(db, 'donations'), {
        donorName: formData.donorName || 'Anonymous',
        donorEmail: formData.donorEmail || null,
        amount: amount,
        currency: formData.currency,
        paymentMethod: selectedMethod.name,
        status: 'pending',
        message: formData.message || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      toast({ 
        title: 'Thank you!', 
        description: 'Your donation has been recorded. Please complete the payment using the provided details.' 
      });

      // Reset form
      setFormData({
        amount: '',
        customAmount: '',
        donorName: '',
        donorEmail: '',
        message: '',
        currency: 'INR'
      });
    } catch (error) {
      console.error('Error recording donation:', error);
      toast({ title: 'Error', description: 'Failed to record donation', variant: 'destructive' });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      toast({ title: 'Copied', description: 'Copied to clipboard' });
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'qr_code':
        return <QrCode className="h-5 w-5" />;
      case 'payment_gateway':
        return <CreditCard className="h-5 w-5" />;
      case 'bank_transfer':
        return <Building className="h-5 w-5" />;
      default:
        return <Heart className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Heart className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Support Our Cause</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your generous donation helps us continue our mission to serve the community and create positive change.
          </p>
        </div>

        {/* Donation Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Make a Donation</CardTitle>
            <CardDescription>Choose an amount and provide your details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amount Selection */}
            <div>
              <Label className="text-base font-medium">Donation Amount</Label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mt-2 mb-4">
                {PRESET_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    variant={formData.amount === amount.toString() ? 'default' : 'outline'}
                    onClick={() => handleAmountSelect(amount)}
                    className="h-12"
                  >
                    ₹{amount.toLocaleString()}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <Label htmlFor="customAmount">Custom Amount:</Label>
                <Input
                  id="customAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            </div>

            {/* Donor Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="donorName">Name (Optional)</Label>
                <Input
                  id="donorName"
                  value={formData.donorName}
                  onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="donorEmail">Email (Optional)</Label>
                <Input
                  id="donorEmail"
                  type="email"
                  value={formData.donorEmail}
                  onChange={(e) => setFormData({ ...formData, donorEmail: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Leave a message with your donation"
                rows={3}
              />
            </div>

            {/* Selected Amount Display */}
            {(formData.amount || formData.customAmount) && (
              <div className="p-4 bg-primary/5 rounded-lg border">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Donation Amount</p>
                  <p className="text-3xl font-bold text-primary">
                    ₹{getSelectedAmount().toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Choose Payment Method</h2>
          
          {paymentMethods.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No payment methods are currently available.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {paymentMethods.map((method) => (
                <Card key={method.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getMethodIcon(method.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{method.name}</h3>
                          {method.description && (
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                          )}
                          <Badge variant="secondary" className="mt-1">
                            {method.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleMethodSelect(method)}
                        disabled={!getSelectedAmount()}
                      >
                        Donate Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Payment Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Complete Your Donation</DialogTitle>
              <DialogDescription>
                Use the payment details below to complete your donation of ₹{getSelectedAmount()?.toLocaleString()}
              </DialogDescription>
            </DialogHeader>

            {selectedMethod && (
              <div className="space-y-6">
                {/* QR Code Payment */}
                {selectedMethod.type === 'qr_code' && selectedMethod.qrCodeUrl && (
                  <div className="text-center space-y-4">
                    <h3 className="font-semibold">Scan QR Code to Pay</h3>
                    <div className="flex justify-center">
                      <Image
                        src={selectedMethod.qrCodeUrl}
                        alt="Payment QR Code"
                        width={200}
                        height={200}
                        className="border rounded-lg"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Scan this QR code with any UPI app to make your donation
                    </p>
                  </div>
                )}

                {/* Bank Transfer Details */}
                {selectedMethod.type === 'bank_transfer' && selectedMethod.bankDetails && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Bank Transfer Details</h3>
                    <div className="grid gap-3 p-4 bg-gray-50 rounded-lg">
                      {selectedMethod.bankDetails.accountName && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Account Name:</span>
                          <div className="flex items-center gap-2">
                            <span>{selectedMethod.bankDetails.accountName}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(selectedMethod.bankDetails!.accountName!)}
                            >
                              {copiedText === selectedMethod.bankDetails.accountName ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {selectedMethod.bankDetails.accountNumber && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Account Number:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{selectedMethod.bankDetails.accountNumber}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(selectedMethod.bankDetails!.accountNumber!)}
                            >
                              {copiedText === selectedMethod.bankDetails.accountNumber ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedMethod.bankDetails.bankName && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Bank Name:</span>
                          <span>{selectedMethod.bankDetails.bankName}</span>
                        </div>
                      )}

                      {selectedMethod.bankDetails.ifscCode && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">IFSC Code:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{selectedMethod.bankDetails.ifscCode}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(selectedMethod.bankDetails!.ifscCode!)}
                            >
                              {copiedText === selectedMethod.bankDetails.ifscCode ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {selectedMethod.bankDetails.upiId && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">UPI ID:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{selectedMethod.bankDetails.upiId}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(selectedMethod.bankDetails!.upiId!)}
                            >
                              {copiedText === selectedMethod.bankDetails.upiId ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* UPI Payment */}
                {selectedMethod.type === 'upi' && selectedMethod.upiDetails && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">UPI Payment Details</h3>
                    <div className="grid gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">UPI ID:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg">{selectedMethod.upiDetails.upiId}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(selectedMethod.upiDetails!.upiId)}
                          >
                            {copiedText === selectedMethod.upiDetails.upiId ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {selectedMethod.upiDetails.merchantName && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Merchant Name:</span>
                          <span>{selectedMethod.upiDetails.merchantName}</span>
                        </div>
                      )}

                      {selectedMethod.upiDetails.merchantCode && (
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Merchant Code:</span>
                          <span className="font-mono">{selectedMethod.upiDetails.merchantCode}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        Use any UPI app (PhonePe, Google Pay, Paytm, etc.) to send ₹{getSelectedAmount()?.toLocaleString()} to the above UPI ID
                      </p>
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={() => copyToClipboard(selectedMethod.upiDetails!.upiId)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy UPI ID
                      </Button>
                    </div>
                  </div>
                )}

                {/* Payment Gateway */}
                {selectedMethod.type === 'payment_gateway' && (
                  <div className="text-center space-y-4">
                    <h3 className="font-semibold">Online Payment</h3>
                    <p className="text-muted-foreground">
                      You will be redirected to a secure payment gateway to complete your donation.
                    </p>
                    <Button size="lg" className="w-full">
                      Proceed to Payment Gateway
                    </Button>
                  </div>
                )}

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Important:</strong> After making the payment, your donation will be recorded in our system. 
                    If you provided an email, you'll receive a confirmation once we verify the payment.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={handleDonationSubmit}>
                I've Made the Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
