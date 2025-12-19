"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User, Building, Mail, Phone, MapPin, Calendar, Users, FileText,
  Lock, AlertCircle, CheckCircle, Send
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProfileUpdateRequest } from "@/lib/firebase/firestore";

interface EmployerData {
  id: string;
  facilityName: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  operatingDays?: string;
  staffSize?: string;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  billingEmail?: string;
  status: string;
}

interface FacilityProfileProps {
  employer: EmployerData;
}

const LOCKED_FIELDS = ['facilityName', 'licenseNumber', 'email'];

export function FacilityProfile({ employer }: FacilityProfileProps) {
  const { toast } = useToast();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<string>('');
  const [requestReason, setRequestReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isVerified = employer.status === 'active' || employer.status === 'approved';
  const isFieldLocked = (field: string) => isVerified && LOCKED_FIELDS.includes(field);

  const handleRequestChange = async () => {
    if (!selectedField || !requestReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a field and provide a reason for the change.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current value for the selected field
      const fieldValueMap: Record<string, string> = {
        facilityName: employer.facilityName || '',
        contactPerson: employer.contactPerson || '',
        email: employer.email || '',
        phone: employer.phone || '',
        city: employer.city || '',
        staffSize: employer.staffSize || '',
        licenseNumber: employer.licenseNumber || '',
        licenseExpiryDate: employer.licenseExpiryDate || '',
        billingEmail: employer.billingEmail || '',
        other: '',
      };

      const requestId = await createProfileUpdateRequest({
        requesterType: 'employer',
        requesterId: employer.id,
        requesterName: employer.facilityName || 'Unknown Facility',
        requesterEmail: employer.email || '',
        fieldToUpdate: selectedField,
        currentValue: fieldValueMap[selectedField] || '',
        reason: requestReason.trim(),
      });

      if (requestId) {
        toast({
          title: "Change Request Submitted",
          description: "Your request has been submitted. A CareStint admin will review it and contact you within 24-48 hours.",
        });

        setRequestDialogOpen(false);
        setSelectedField('');
        setRequestReason('');
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      console.error('Error submitting profile update request:', error);
      toast({
        title: "Request Failed",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    switch (employer.status) {
      case 'active':
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'pending_validation':
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pending Verification</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{employer.status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-headline">Facility Profile</CardTitle>
            <CardDescription>
              This is your facility's information as it appears on CareStint.
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Locked Fields Notice */}
        {isVerified && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Profile Verified</p>
              <p className="text-xs text-muted-foreground">
                Some fields are locked for security. To update locked information, use the "Request Change" button below.
              </p>
            </div>
          </div>
        )}

        {/* Facility Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Facility Information</h3>
          <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              icon={<Building className="text-accent" />}
              label="Facility Name"
              value={employer.facilityName || 'Not provided'}
              locked={isFieldLocked('facilityName')}
            />
            <InfoItem
              icon={<User className="text-accent" />}
              label="Contact Person"
              value={employer.contactPerson || 'Not provided'}
            />
            <InfoItem
              icon={<Mail className="text-accent" />}
              label="Contact Email"
              value={employer.email || 'Not provided'}
              locked={isFieldLocked('email')}
            />
            <InfoItem
              icon={<Phone className="text-accent" />}
              label="Contact Phone"
              value={employer.phone || 'Not provided'}
            />
            <InfoItem
              icon={<MapPin className="text-accent" />}
              label="City/Town"
              value={employer.city || 'Not provided'}
            />
            <InfoItem
              icon={<Users className="text-accent" />}
              label="Staff Size"
              value={employer.staffSize || 'Not provided'}
            />
          </div>
        </div>

        {/* License Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">License & Billing</h3>
          <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              icon={<FileText className="text-accent" />}
              label="License Number"
              value={employer.licenseNumber || 'Not provided'}
              locked={isFieldLocked('licenseNumber')}
            />
            <InfoItem
              icon={<Calendar className="text-accent" />}
              label="License Expiry"
              value={employer.licenseExpiryDate ? new Date(employer.licenseExpiryDate).toLocaleDateString() : 'Not provided'}
            />
            <InfoItem
              icon={<Mail className="text-accent" />}
              label="Billing Email"
              value={employer.billingEmail || employer.email || 'Not provided'}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Request Profile Change
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Profile Change</DialogTitle>
                <DialogDescription>
                  Submit a request to update your facility's verified information. A CareStint admin will review and process your request.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Field to Update</Label>
                  <Select value={selectedField} onValueChange={setSelectedField}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field to change" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facilityName">Facility Name</SelectItem>
                      <SelectItem value="contactPerson">Contact Person</SelectItem>
                      <SelectItem value="email">Contact Email</SelectItem>
                      <SelectItem value="phone">Phone Number</SelectItem>
                      <SelectItem value="city">City / Location</SelectItem>
                      <SelectItem value="staffSize">Staff Size</SelectItem>
                      <SelectItem value="licenseNumber">License Number</SelectItem>
                      <SelectItem value="licenseExpiryDate">License Expiry Date</SelectItem>
                      <SelectItem value="billingEmail">Billing Email</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reason for Change</Label>
                  <Textarea
                    placeholder="Please explain what you'd like to change and why..."
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    rows={4}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Note: You may be asked to provide supporting documentation for certain changes (e.g., updated license certificate).
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRequestChange} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}


interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  locked?: boolean;
}

function InfoItem({ icon, label, value, locked }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {locked && (
            <Lock className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  )
}
