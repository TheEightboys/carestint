
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateProfessionalStatus } from '@/lib/firebase/firestore';
import { Loader2, Check, X, User, Mail, Phone, MapPin, Star, Briefcase, BadgeDollarSign, ShieldCheck, Image as ImageIcon, ArrowLeft, Ban, ShieldOff } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { SuspensionModal } from './suspension-modal';

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" } = {
  active: "default",
  pending_validation: "secondary",
  rejected: "destructive",
  suspended: "destructive",
};

const getStatusClass = (status: string) => {
  switch (status) {
    case 'active':
      return "bg-green-500/20 text-green-500 border-green-500/30";
    case 'pending_validation':
      return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
    case 'rejected':
      return "bg-destructive/20 text-destructive border-destructive/30";
    case 'suspended':
    case 'suspended_due_to_expiry':
      return "bg-orange-500/20 text-orange-500 border-orange-500/30";
    default:
      return "bg-gray-500/20 text-gray-500 border-gray-500/30";
  }
}

export function ProfessionalReviewClientPage({ professionals: initialProfessionals }: { professionals: any[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reviewId = searchParams.get('reviewId');

  const [professionals, setProfessionals] = useState(initialProfessionals);
  const [selectedProfessional, setSelectedProfessional] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (reviewId) {
      const professional = professionals.find(p => p.id === reviewId);
      if (professional) {
        setSelectedProfessional(professional);
      }
    } else if (professionals.length > 0) {
      const pending = professionals.find(p => p.status === 'pending_validation');
      setSelectedProfessional(pending || professionals[0]);
    } else {
      setSelectedProfessional(null);
    }
  }, [reviewId, professionals]);

  const handleStatusUpdate = async (id: string, status: 'active' | 'rejected') => {
    setIsLoading(true);
    const success = await updateProfessionalStatus(id, status);
    if (success) {
      const updatedProfessionals = professionals.map(p => p.id === id ? { ...p, status } : p);
      setProfessionals(updatedProfessionals);
      setSelectedProfessional(updatedProfessionals.find(p => p.id === id));
      toast({
        title: `Professional ${status === 'active' ? 'Approved' : 'Rejected'}`,
        description: "The professional's status has been updated.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update the professional's status. Please try again.",
      });
    }
    setIsLoading(false);
  };

  const handleSuspend = async (days: number | null, reason: string) => {
    if (!selectedProfessional) return;
    setIsLoading(true);

    const suspensionData: any = {
      status: 'suspended',
      suspensionReason: reason,
      suspendedAt: new Date(),
    };

    if (days !== null) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      suspensionData.suspensionDays = days;
      suspensionData.suspensionEndDate = endDate;
    } else {
      suspensionData.suspensionDays = null;
      suspensionData.suspensionEndDate = null;
    }

    const success = await updateProfessionalStatus(selectedProfessional.id, 'suspended', suspensionData);
    if (success) {
      const updatedProfessionals = professionals.map(p =>
        p.id === selectedProfessional.id ? { ...p, ...suspensionData } : p
      );
      setProfessionals(updatedProfessionals);
      setSelectedProfessional(updatedProfessionals.find(p => p.id === selectedProfessional.id));
      toast({
        title: 'Professional Suspended',
        description: days ? `Suspended for ${days} days.` : 'Permanently suspended.',
      });
    } else {
      toast({
        variant: "destructive",
        title: "Suspension Failed",
        description: "Could not suspend the professional. Please try again.",
      });
    }
    setIsLoading(false);
    setShowSuspensionModal(false);
  };

  const handleUnsuspend = async () => {
    if (!selectedProfessional) return;
    setIsLoading(true);

    const success = await updateProfessionalStatus(selectedProfessional.id, 'active', {
      suspensionDays: null,
      suspensionEndDate: null,
      suspensionReason: null,
    });

    if (success) {
      const updatedProfessionals = professionals.map(p =>
        p.id === selectedProfessional.id ? {
          ...p,
          status: 'active',
          suspensionDays: null,
          suspensionEndDate: null,
          suspensionReason: null,
        } : p
      );
      setProfessionals(updatedProfessionals);
      setSelectedProfessional(updatedProfessionals.find(p => p.id === selectedProfessional.id));
      toast({
        title: 'Professional Unsuspended',
        description: 'The professional account has been reactivated.',
      });
    } else {
      toast({
        variant: "destructive",
        title: "Unsuspend Failed",
        description: "Could not unsuspend the professional. Please try again.",
      });
    }
    setIsLoading(false);
  };

  const getRoleDisplayName = (roleKey: string) => {
    const roles: { [key: string]: string } = {
      'dentist': 'Dentist',
      'rn': 'Registered Nurse (RN)',
      'clinical-officer': 'Clinical Officer',
      'lab-tech': 'Lab Technician',
      'pharmacist': 'Pharmacist',
      'radiographer': 'Radiographer',
      'physiotherapist': 'Physiotherapist',
      'midwife': 'Midwife',
    };
    return roles[roleKey] || roleKey;
  }

  const getFilteredProfessionals = (status: string) => {
    if (status === 'all') return professionals;
    if (status === 'suspended') return professionals.filter(p => p.status === 'suspended' || p.status === 'suspended_due_to_expiry');
    return professionals.filter(p => p.status === status);
  }

  const renderTable = (filteredProfessionals: any[]) => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfessionals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No professionals found in this category
                </TableCell>
              </TableRow>
            ) : (
              filteredProfessionals.map((pro) => (
                <TableRow
                  key={pro.id}
                  onClick={() => setSelectedProfessional(pro)}
                  className={`cursor-pointer ${selectedProfessional?.id === pro.id ? 'bg-muted/50' : ''}`}
                >
                  <TableCell className="font-medium">{pro.fullName}</TableCell>
                  <TableCell>{getRoleDisplayName(pro.primaryRole)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariantMap[pro.status] || "secondary"} className={getStatusClass(pro.status)}>
                      {pro.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/dashboard/superadmin')}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="grid gap-4 md:grid-cols-[1fr_350px]">
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({professionals.length})</TabsTrigger>
              <TabsTrigger value="pending_validation">Pending ({getFilteredProfessionals('pending_validation').length})</TabsTrigger>
              <TabsTrigger value="active">Active ({getFilteredProfessionals('active').length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({getFilteredProfessionals('rejected').length})</TabsTrigger>
              <TabsTrigger value="suspended">Suspended ({getFilteredProfessionals('suspended').length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">{renderTable(getFilteredProfessionals('all'))}</TabsContent>
            <TabsContent value="pending_validation">{renderTable(getFilteredProfessionals('pending_validation'))}</TabsContent>
            <TabsContent value="active">{renderTable(getFilteredProfessionals('active'))}</TabsContent>
            <TabsContent value="rejected">{renderTable(getFilteredProfessionals('rejected'))}</TabsContent>
            <TabsContent value="suspended">{renderTable(getFilteredProfessionals('suspended'))}</TabsContent>
          </Tabs>
        </div>

        <div>
          {selectedProfessional ? (
            <Card className="sticky top-16">
              <CardHeader>
                <CardTitle className="font-headline">{selectedProfessional.fullName}</CardTitle>
                <CardDescription>{selectedProfessional.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <InfoItem icon={<User size={16} />} label="Full Name" value={selectedProfessional.fullName} />
                    <InfoItem icon={<Mail size={16} />} label="Email" value={selectedProfessional.email} />
                    <InfoItem icon={<Phone size={16} />} label="Phone" value={selectedProfessional.phone} />
                    <InfoItem icon={<MapPin size={16} />} label="Locations" value={selectedProfessional.locations} />
                    <InfoItem icon={<Briefcase size={16} />} label="Primary Role" value={getRoleDisplayName(selectedProfessional.primaryRole)} />
                    <InfoItem icon={<Star size={16} />} label="Experience" value={`${selectedProfessional.experience} years`} />
                    <InfoItem icon={<ShieldCheck size={16} />} label="License No." value={selectedProfessional.licenseNumber} />
                    <InfoItem icon={<BadgeDollarSign size={16} />} label="Daily Rate" value={`${selectedProfessional.currency || 'KSh'} ${selectedProfessional.dailyRate}`} />
                  </div>
                </div>

                {/* Suspension Info */}
                {(selectedProfessional.status === 'suspended' || selectedProfessional.status === 'suspended_due_to_expiry') && (
                  <div className="rounded-lg bg-orange-500/10 border border-orange-500/30 p-3 space-y-2">
                    <h4 className="font-semibold text-orange-500 flex items-center gap-2">
                      <Ban className="h-4 w-4" />
                      Suspension Details
                    </h4>
                    <div className="text-sm space-y-1">
                      {selectedProfessional.suspensionReason && (
                        <p><span className="text-muted-foreground">Reason:</span> {selectedProfessional.suspensionReason}</p>
                      )}
                      {selectedProfessional.suspensionDays ? (
                        <p><span className="text-muted-foreground">Duration:</span> {selectedProfessional.suspensionDays} days</p>
                      ) : (
                        <p><span className="text-muted-foreground">Duration:</span> Permanent</p>
                      )}
                      {selectedProfessional.suspensionEndDate && (
                        <p><span className="text-muted-foreground">Ends:</span> {new Date(selectedProfessional.suspensionEndDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {selectedProfessional.licenseDocument && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">License Document</h4>
                      <div className="relative w-full aspect-video rounded-md border bg-secondary overflow-hidden">
                        <Image src={selectedProfessional.licenseDocument} alt="License document" fill className="object-contain" />
                      </div>
                    </div>
                  )}
                  {selectedProfessional.idDocument && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">ID Document</h4>
                      <div className="relative w-full aspect-video rounded-md border bg-secondary overflow-hidden">
                        <Image src={selectedProfessional.idDocument} alt="ID document" fill className="object-contain" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {selectedProfessional.status === 'pending_validation' && (
                  <div className="flex gap-2">
                    <Button onClick={() => handleStatusUpdate(selectedProfessional.id, 'active')} disabled={isLoading} className="w-full">
                      {isLoading ? <Loader2 className="animate-spin" /> : <Check className="mr-2" />} Approve
                    </Button>
                    <Button onClick={() => handleStatusUpdate(selectedProfessional.id, 'rejected')} disabled={isLoading} variant="destructive" className="w-full">
                      {isLoading ? <Loader2 className="animate-spin" /> : <X className="mr-2" />} Reject
                    </Button>
                  </div>
                )}

                {selectedProfessional.status === 'active' && (
                  <Button
                    onClick={() => setShowSuspensionModal(true)}
                    disabled={isLoading}
                    variant="destructive"
                    className="w-full"
                  >
                    <Ban className="mr-2 h-4 w-4" /> Suspend Account
                  </Button>
                )}

                {(selectedProfessional.status === 'suspended' || selectedProfessional.status === 'suspended_due_to_expiry') && (
                  <Button
                    onClick={handleUnsuspend}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <ShieldOff className="mr-2 h-4 w-4" />}
                    Unsuspend Account
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-96 border-dashed">
              <p className="text-muted-foreground">Select a professional to view details</p>
            </Card>
          )}
        </div>
      </div>

      {/* Suspension Modal */}
      <SuspensionModal
        open={showSuspensionModal}
        onClose={() => setShowSuspensionModal(false)}
        onConfirm={handleSuspend}
        entityType="professional"
        entityName={selectedProfessional?.fullName || ''}
        isLoading={isLoading}
      />
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  )
}
