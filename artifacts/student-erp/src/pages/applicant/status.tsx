import { useAuth } from "@/hooks/use-auth";
import { useGetAdmission, useLogout } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  LogOut,
  User,
  BookOpen,
  Calendar,
  Phone,
  Mail,
  MapPin,
  School,
  BarChart2,
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1 text-sm font-medium">
        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
        Approved
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-200 px-3 py-1 text-sm font-medium">
        <XCircle className="h-3.5 w-3.5 mr-1.5" />
        Rejected
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1 text-sm font-medium">
      <Clock className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
      Under Review
    </Badge>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function ApplicantStatus() {
  const { user, logoutClient } = useAuth();
  const [, setLocation] = useLocation();
  const logoutMutation = useLogout();

  const admissionId = user?.admissionId ?? null;

  const { data: admission, isLoading } = useGetAdmission(admissionId!, {
    query: { enabled: !!admissionId },
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logoutClient();
  };

  const statusMessages: Record<string, { title: string; description: string; icon: any; colorClass: string }> = {
    pending: {
      title: "Your application is being reviewed",
      description:
        "Our admissions team is carefully reviewing your application. This process typically takes 5–10 business days. You will be notified of any updates.",
      icon: Clock,
      colorClass: "text-amber-600 bg-amber-50 border-amber-200",
    },
    approved: {
      title: "Congratulations! Your application has been approved",
      description:
        "Welcome to EduCore University! Your student account has been created. Please log out and log back in with your new student credentials to access your full student portal.",
      icon: CheckCircle2,
      colorClass: "text-green-700 bg-green-50 border-green-200",
    },
    rejected: {
      title: "Your application was not successful",
      description:
        admission?.remarks
          ? `Reason: ${admission.remarks}. You may contact the admissions office for further information or reapply next cycle.`
          : "Unfortunately, your application did not meet the admission criteria. Please contact the admissions office for more information.",
      icon: XCircle,
      colorClass: "text-red-700 bg-red-50 border-red-200",
    },
  };

  const statusInfo = admission ? statusMessages[admission.status] ?? statusMessages.pending : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-sidebar border-b border-sidebar-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">EduCore University</p>
              <p className="text-xs text-sidebar-foreground/70">Applicant Portal</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-sidebar-foreground/80 hover:text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Welcome, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track the status of your admission application below.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-7 w-7 text-primary" />
          </div>
        )}

        {!isLoading && !admissionId && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <p className="text-sm text-amber-800">No admission application found linked to your account. Please contact the admissions office.</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && admission && statusInfo && (
          <>
            {/* Status Card */}
            <Card className={`border ${statusInfo.colorClass.split(" ").slice(-1)[0]}`}>
              <CardContent className="pt-6">
                <div className={`flex items-start gap-4 p-4 rounded-lg border ${statusInfo.colorClass}`}>
                  <statusInfo.icon className="h-6 w-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">{statusInfo.title}</p>
                    <p className="text-sm mt-1 leading-relaxed opacity-90">{statusInfo.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Summary */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Application Details</CardTitle>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono">#{admission.id}</span>
                    <StatusBadge status={admission.status} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Personal Information</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoItem icon={User} label="Full Name" value={admission.name} />
                    <InfoItem icon={Mail} label="Email Address" value={admission.email} />
                    <InfoItem icon={Phone} label="Phone" value={admission.phone} />
                    <InfoItem icon={Calendar} label="Date of Birth" value={admission.dateOfBirth} />
                    <InfoItem icon={User} label="Gender" value={admission.gender.charAt(0).toUpperCase() + admission.gender.slice(1)} />
                  </div>
                  <div className="mt-4">
                    <InfoItem icon={MapPin} label="Address" value={admission.address} />
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Academic Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoItem icon={BookOpen} label="Course Applied For" value={admission.course} />
                    <InfoItem icon={GraduationCap} label="Department" value={admission.department} />
                    <InfoItem icon={School} label="Previous Institution" value={admission.previousSchool} />
                    <InfoItem icon={BarChart2} label="Previous Marks" value={`${admission.previousMarks}%`} />
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Timeline</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoItem
                      icon={Calendar}
                      label="Application Submitted"
                      value={new Date(admission.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    />
                    <InfoItem
                      icon={Calendar}
                      label="Last Updated"
                      value={new Date(admission.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    />
                  </div>
                </div>

                {admission.remarks && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Remarks from Admissions</p>
                      <p className="text-sm text-foreground bg-muted/50 rounded-lg px-4 py-3 border">
                        {admission.remarks}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Help */}
            <Card className="bg-slate-100 border-slate-200">
              <CardContent className="pt-5 pb-5">
                <p className="text-xs text-slate-600 text-center">
                  Need help? Contact the Admissions Office at{" "}
                  <a href="mailto:admissions@educore.edu" className="font-medium underline text-primary">
                    admissions@educore.edu
                  </a>{" "}
                  or call{" "}
                  <a href="tel:+911800000000" className="font-medium underline text-primary">
                    1800-000-0000
                  </a>{" "}
                  (Mon–Fri, 9am–5pm).
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
