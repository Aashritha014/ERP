import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useGetStudentDashboard, getGetStudentDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, User, MapPin, BookOpen, GraduationCap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function StudentAdmission() {
  const { user } = useAuth();
  
  const { data: dashboard, isLoading, isError } = useGetStudentDashboard(user?.studentId || 0, {
    query: {
      enabled: !!user?.studentId,
      queryKey: getGetStudentDashboardQueryKey(user?.studentId || 0)
    }
  });

  if (!user?.studentId) {
    return (
      <Layout title="Admission Details">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profile Incomplete</AlertTitle>
          <AlertDescription>
            Your account is not linked to a student profile yet.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout title="Admission Details">
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      </Layout>
    );
  }

  if (isError || !dashboard) {
    return (
      <Layout title="Admission Details">
        <Alert variant="destructive">
          <AlertDescription>Failed to load admission data.</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const { admission } = dashboard;

  if (!admission) {
    return (
      <Layout title="Admission Details">
        <Alert>
          <AlertDescription>No admission record found linked to your profile.</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout title="Admission Details">
      <div className="max-w-3xl mx-auto">
        <Card className="overflow-hidden">
          <div className="bg-sidebar p-6 text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Application #{admission.id}</h2>
              <p className="text-sidebar-foreground/80 mt-1">Submitted on {new Date(admission.createdAt).toLocaleDateString()}</p>
            </div>
            <Badge 
              variant={admission.status === 'approved' ? 'default' : admission.status === 'rejected' ? 'destructive' : 'secondary'}
              className="text-sm px-3 py-1 bg-white text-sidebar font-bold"
            >
              {admission.status.toUpperCase()}
            </Badge>
          </div>
          
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
              
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Personal Info</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {admission.name}</div>
                      <div><span className="font-medium">Email:</span> {admission.email}</div>
                      <div><span className="font-medium">Phone:</span> {admission.phone}</div>
                      <div><span className="font-medium">DOB:</span> {new Date(admission.dateOfBirth).toLocaleDateString()}</div>
                      <div><span className="font-medium capitalize">Gender:</span> {admission.gender}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Address</h3>
                    <div className="text-sm">{admission.address}</div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Course Info</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Course:</span> {admission.course}</div>
                      <div><span className="font-medium">Department:</span> {admission.department}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Academic History</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Previous School:</span> {admission.previousSchool}</div>
                      <div><span className="font-medium">Marks:</span> {admission.previousMarks}%</div>
                    </div>
                  </div>
                </div>
                
                {admission.remarks && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Administration Remarks</h3>
                    <p className="text-sm italic">{admission.remarks}</p>
                  </div>
                )}
              </div>
              
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
