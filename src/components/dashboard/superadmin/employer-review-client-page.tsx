
"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { updateEmployerStatus } from '@/lib/firebase/firestore';
import { Loader2, Check, X, Building, Mail, Phone, MapPin, Calendar, Users, FileDigit, Image as ImageIcon } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" } = {
  active: "default",
  pending_validation: "secondary",
  rejected: "destructive",
};

const getStatusClass = (status: string) => {
    switch (status) {
        case 'active':
            return "bg-green-500/20 text-green-500 border-green-500/30";
        case 'pending_validation':
            return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
        case 'rejected':
            return "bg-destructive/20 text-destructive border-destructive/30";
        default:
            return "bg-gray-500/20 text-gray-500 border-gray-500/30";
    }
}

export function EmployerReviewClientPage({ employers: initialEmployers }: { employers: any[] }) {
  const searchParams = useSearchParams();
  const reviewId = searchParams.get('reviewId');
  
  const [employers, setEmployers] = useState(initialEmployers);
  const [selectedEmployer, setSelectedEmployer] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (reviewId) {
      const employer = employers.find(e => e.id === reviewId);
      if(employer) {
        setSelectedEmployer(employer);
      }
    } else if (employers.length > 0) {
      // select first pending employer or first employer
      const pending = employers.find(e => e.status === 'pending_validation');
      setSelectedEmployer(pending || employers[0]);
    } else {
      setSelectedEmployer(null);
    }
  }, [reviewId, employers]);

  const handleStatusUpdate = async (id: string, status: 'active' | 'rejected') => {
    setIsLoading(true);
    const success = await updateEmployerStatus(id, status);
    if(success) {
        const updatedEmployers = employers.map(e => e.id === id ? {...e, status} : e);
        setEmployers(updatedEmployers);
        setSelectedEmployer(updatedEmployers.find(e => e.id === id));
        toast({
            title: `Employer ${status === 'active' ? 'Approved' : 'Rejected'}`,
            description: "The employer's status has been updated.",
        });
    } else {
         toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update the employer's status. Please try again.",
        });
    }
    setIsLoading(false);
  };

  const getFilteredEmployers = (status: string) => {
    if (status === 'all') return employers;
    return employers.filter(e => e.status === status);
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_350px]">
      <div>
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending_validation">Pending</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Facility Name</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {employers.map((employer) => (
                        <TableRow 
                            key={employer.id} 
                            onClick={() => setSelectedEmployer(employer)}
                            className={`cursor-pointer ${selectedEmployer?.id === employer.id ? 'bg-muted/50' : ''}`}
                        >
                            <TableCell className="font-medium">{employer.facilityName}</TableCell>
                            <TableCell>{employer.city}</TableCell>
                            <TableCell>
                            <Badge variant={statusVariantMap[employer.status] || "secondary"} className={getStatusClass(employer.status)}>
                                {employer.status.replace(/_/g, ' ')}
                            </Badge>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </Tabs>
      </div>

      <div>
        {selectedEmployer ? (
          <Card className="sticky top-16">
            <CardHeader>
              <CardTitle className="font-headline">{selectedEmployer.facilityName}</CardTitle>
              <CardDescription>{selectedEmployer.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <h4 className="font-semibold">Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <InfoItem icon={<Building size={16} />} label="Facility" value={selectedEmployer.facilityName} />
                        <InfoItem icon={<Users size={16} />} label="Contact" value={selectedEmployer.contactPerson} />
                        <InfoItem icon={<Phone size={16} />} label="Phone" value={selectedEmployer.phone} />
                        <InfoItem icon={<MapPin size={16} />} label="City" value={selectedEmployer.city} />
                        <InfoItem icon={<Calendar size={16} />} label="Operating Days" value={selectedEmployer.operatingDays} />
                        <InfoItem icon={<FileDigit size={16} />} label="License No." value={selectedEmployer.licenseNumber} />
                    </div>
                </div>

                {selectedEmployer.licenseDocument && (
                    <div className="space-y-2">
                        <h4 className="font-semibold">License Document</h4>
                        <div className="relative w-full aspect-video rounded-md border bg-secondary overflow-hidden">
                           <Image src={selectedEmployer.licenseDocument} alt="License document" fill className="object-contain" />
                        </div>
                    </div>
                )}
              
                {selectedEmployer.status === 'pending_validation' && (
                    <div className="flex gap-2">
                        <Button onClick={() => handleStatusUpdate(selectedEmployer.id, 'active')} disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="animate-spin" /> : <Check className="mr-2" />} Approve
                        </Button>
                        <Button onClick={() => handleStatusUpdate(selectedEmployer.id, 'rejected')} disabled={isLoading} variant="destructive" className="w-full">
                            {isLoading ? <Loader2 className="animate-spin" /> : <X className="mr-2" />} Reject
                        </Button>
                    </div>
                )}
            </CardContent>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-96 border-dashed">
            <p className="text-muted-foreground">Select an employer to view details</p>
          </Card>
        )}
      </div>
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
