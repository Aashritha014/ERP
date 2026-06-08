import { useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetStudentDashboard,
  getGetStudentDashboardQueryKey,
  useUpdateStudent,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  AlertCircle,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  BookOpen,
  Hash,
  IdCard,
  Pencil,
  Save,
  X,
} from "lucide-react";

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5 break-words">
          {value ?? <span className="text-muted-foreground italic">Not provided</span>}
        </p>
      </div>
    </div>
  );
}

export default function StudentProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const { data: dashboard, isLoading, isError } = useGetStudentDashboard(
    user?.studentId || 0,
    {
      query: {
        enabled: !!user?.studentId,
        queryKey: getGetStudentDashboardQueryKey(user?.studentId || 0),
      },
    }
  );

  const updateMutation = useUpdateStudent({
    mutation: {
      onSuccess: () => {
        toast.success("Contact info updated successfully!");
        queryClient.invalidateQueries({
          queryKey: getGetStudentDashboardQueryKey(user?.studentId || 0),
        });
        setIsEditing(false);
      },
      onError: () => {
        toast.error("Failed to update contact info. Please try again.");
      },
    },
  });

  const handleEditStart = () => {
    setPhone(dashboard?.student.phone ?? "");
    setAddress(dashboard?.student.address ?? "");
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!user?.studentId) return;
    updateMutation.mutate({
      id: user.studentId,
      data: { phone: phone.trim(), address: address.trim() },
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (!user?.studentId) {
    return (
      <Layout title="My Profile">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profile Unavailable</AlertTitle>
          <AlertDescription>
            Your account is not linked to a student profile yet. Contact administration.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout title="My Profile">
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      </Layout>
    );
  }

  if (isError || !dashboard) {
    return (
      <Layout title="My Profile">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load your profile. Please try again.</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const { student } = dashboard;

  const semesterLabel = student.semester ? `Semester ${student.semester}` : null;

  return (
    <Layout title="My Profile">
      <div className="space-y-6 max-w-4xl">

        {/* Header banner */}
        <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
            <User className="h-56 w-56" />
          </div>
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 flex-shrink-0">
                <User className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{student.name}</h2>
                <p className="text-primary-foreground/80 text-sm mt-1">{student.email}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">
                    <IdCard className="h-3 w-3 mr-1" />
                    {student.studentUid}
                  </Badge>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">
                    <Hash className="h-3 w-3 mr-1" />
                    Roll {student.rollNumber}
                  </Badge>
                  {semesterLabel && (
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none">
                      {semesterLabel}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Personal Details */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Personal Details
              </CardTitle>
              <CardDescription>Your registered personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <InfoRow icon={User} label="Full Name" value={student.name} />
              <InfoRow icon={Mail} label="Official Email" value={student.email} />
              <InfoRow
                icon={Calendar}
                label="Date of Birth"
                value={
                  student.dateOfBirth
                    ? new Date(student.dateOfBirth).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : null
                }
              />
              <InfoRow
                icon={User}
                label="Gender"
                value={
                  student.gender
                    ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1)
                    : null
                }
              />
            </CardContent>
          </Card>

          {/* Academic Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Academic Information
              </CardTitle>
              <CardDescription>Your current enrollment details</CardDescription>
            </CardHeader>
            <CardContent>
              <InfoRow icon={BookOpen} label="Course" value={student.course} />
              <InfoRow icon={BookOpen} label="Department" value={student.department} />
              <InfoRow icon={GraduationCap} label="Semester" value={semesterLabel} />
              <InfoRow icon={Hash} label="Roll Number" value={student.rollNumber} />
              <InfoRow
                icon={Calendar}
                label="Enrollment Year"
                value={student.enrollmentYear ? String(student.enrollmentYear) : null}
              />
            </CardContent>
          </Card>

        </div>

        {/* Contact Information */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  Contact Information
                </CardTitle>
                <CardDescription>Phone number and address — you can update these</CardDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={handleEditStart}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your full address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="flex-1"
                  >
                    {updateMutation.isPending ? (
                      <Spinner className="h-4 w-4 mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancel} disabled={updateMutation.isPending}>
                    <X className="h-4 w-4 mr-1.5" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <InfoRow icon={Phone} label="Phone Number" value={student.phone} />
                <InfoRow icon={MapPin} label="Address" value={student.address} />
              </>
            )}
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
