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
  User, Mail, Phone, MapPin, Calendar, Star, Briefcase,
  BadgeDollarSign, ShieldCheck, Lock, AlertCircle, CheckCircle,
  Send
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

interface ProfessionalData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  primaryRole?: string;
  locations?: string;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  experience?: string;
  averageRating?: number;
  status: string;
  verifiedAt?: string;
}

interface ProfessionalProfileProps {
  professional: ProfessionalData;
}

const LOCKED_FIELDS = ['fullName', 'licenseNumber', 'primaryRole', 'email'];

export function ProfessionalProfile({ professional }: ProfessionalProfileProps) {
  const { toast } = useToast();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<string>('');
  const [requestReason, setRequestReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isVerified = professional.status === 'active' || professional.status === 'approved';
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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Change Request Submitted",
      description: "A CareStint admin will review your request and contact you within 24-48 hours.",
    });

    setRequestDialogOpen(false);
    setSelectedField('');
    setRequestReason('');
    setIsSubmitting(false);
  };

  const getRoleLabel = (role?: string) => {
    const labels: Record<string, string> = {
      'dentist': 'Dentist',
      'rn': 'Registered Nurse (RN)',
      'clinical-officer': 'Clinical Officer',
      'lab-tech': 'Lab Technician',
      'pharmacist': 'Pharmacist',
      'radiographer': 'Radiographer',
      'physiotherapist': 'Physiotherapist',
      'midwife': 'Midwife',
    };
    return labels[role || ''] || role || 'Not specified';
  };

  const getStatusBadge = () => {
    switch (professional.status) {
      case 'active':
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'pending_validation':
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pending Verification</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{professional.status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-headline">My Professional Profile</CardTitle>
            <CardDescription>
              This is your information as it appears to employers on CareStint.
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

        {/* Personal Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personal Information</h3>
          <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              icon={<User className="text-accent" />}
              label="Full Name"
              value={professional.fullName || 'Not provided'}
              locked={isFieldLocked('fullName')}
            />
            <InfoItem
              icon={<Mail className="text-accent" />}
              label="Contact Email"
              value={professional.email || 'Not provided'}
              locked={isFieldLocked('email')}
            />
            <InfoItem
              icon={<Phone className="text-accent" />}
              label="Contact Phone"
              value={professional.phone || 'Not provided'}
              locked={isFieldLocked('phone')}
            />
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Professional Details</h3>
          <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              icon={<Briefcase className="text-accent" />}
              label="Primary Role"
              value={getRoleLabel(professional.primaryRole)}
              locked={isFieldLocked('primaryRole')}
            />
            <InfoItem
              icon={<Star className="text-accent" />}
              label="Years of Experience"
              value={professional.experience ? `${professional.experience} Years` : 'Not provided'}
            />
            <InfoItem
              icon={<MapPin className="text-accent" />}
              label="Preferred Locations"
              value={professional.locations || 'Not provided'}
            />
          </div>
        </div>

        {/* License & Credentials */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">License & Credentials</h3>
          <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              icon={<ShieldCheck className="text-accent" />}
              label="License Number"
              value={professional.licenseNumber || 'Not provided'}
              locked={isFieldLocked('licenseNumber')}
            />
            <InfoItem
              icon={<Calendar className="text-accent" />}
              label="License Expiry"
              value={professional.licenseExpiryDate ? new Date(professional.licenseExpiryDate).toLocaleDateString() : 'Not provided'}
            />
            <InfoItem
              icon={<BadgeDollarSign className="text-accent" />}
              label="Overall Rating"
              value={professional.averageRating ? `${professional.averageRating.toFixed(1)} / 5.0` : 'No ratings yet'}
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
                  Submit a request to update your verified information. A CareStint admin will review and process your request.
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
                      <SelectItem value="fullName">Full Name</SelectItem>
                      <SelectItem value="email">Email Address</SelectItem>
                      <SelectItem value="phone">Phone Number</SelectItem>
                      <SelectItem value="primaryRole">Primary Role</SelectItem>
                      <SelectItem value="licenseNumber">License Number</SelectItem>
                      <SelectItem value="licenseExpiryDate">License Expiry Date</SelectItem>
                      <SelectItem value="locations">Preferred Locations</SelectItem>
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
