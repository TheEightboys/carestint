
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Building, Mail, Phone, MapPin, Calendar, Users, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

export function FacilityProfile({ employer }: FacilityProfileProps) {
  const { toast } = useToast();

  const handleRequestUpdate = () => {
    toast({
      title: "Profile Update Requested",
      description: "A CareStint admin will contact you to verify and update your profile.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Facility Profile</CardTitle>
        <CardDescription>
          This is your facility's information as it appears on CareStint.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem icon={<Building className="text-accent" />} label="Facility Name" value={employer.facilityName || 'Not provided'} />
          <InfoItem icon={<User className="text-accent" />} label="Contact Person" value={employer.contactPerson || 'Not provided'} />
          <InfoItem icon={<Mail className="text-accent" />} label="Contact Email" value={employer.email || 'Not provided'} />
          <InfoItem icon={<Phone className="text-accent" />} label="Contact Phone" value={employer.phone || 'Not provided'} />
          <InfoItem icon={<MapPin className="text-accent" />} label="City" value={employer.city || 'Not provided'} />
          <InfoItem icon={<Users className="text-accent" />} label="Staff Size" value={employer.staffSize || 'Not provided'} />
        </div>
        <div className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem icon={<FileText className="text-accent" />} label="License Number" value={employer.licenseNumber || 'Not provided'} />
          <InfoItem
            icon={<Calendar className="text-accent" />}
            label="License Expiry"
            value={employer.licenseExpiryDate ? new Date(employer.licenseExpiryDate).toLocaleDateString() : 'Not provided'}
          />
          <InfoItem icon={<Mail className="text-accent" />} label="Billing Email" value={employer.billingEmail || employer.email || 'Not provided'} />
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleRequestUpdate}>Request Profile Update</Button>
        </div>
      </CardContent>
    </Card>
  );
}


interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1">{icon}</div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  )
}
