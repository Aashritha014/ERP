import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useGetStudentDashboard, getGetStudentDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { FileText, CreditCard, Building, GraduationCap, AlertCircle, Calendar } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function StudentDashboard() {
  const { user } = useAuth();
  
  const { data: dashboard, isLoading, isError } = useGetStudentDashboard(user?.studentId || 0, {
    query: {
      enabled: !!user?.studentId,
      queryKey: getGetStudentDashboardQueryKey(user?.studentId || 0)
    }
  });

  if (!user?.studentId) {
    return (
      <Layout title="Student Dashboard">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profile Incomplete</AlertTitle>
          <AlertDescription>
            Your account is not linked to a student profile yet. Please contact the administration.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout title="Dashboard">
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      </Layout>
    );
  }

  if (isError || !dashboard) {
    return (
      <Layout title="Dashboard">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load dashboard data.</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const { student, admission, fees, hostelAllocation, examResults, cgpa } = dashboard;
  
  // Get pending fees
  const pendingFees = fees.filter(f => f.status === 'pending' || f.status === 'overdue');
  
  // Get latest exams
  const recentExams = [...examResults].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 3);

  return (
    <Layout title="Dashboard">
      <div className="space-y-6">
        
        {/* Welcome Card */}
        <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
            <GraduationCap className="h-64 w-64" />
          </div>
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Welcome back, {student.name}!</h2>
                <p className="text-primary-foreground/80 max-w-lg">
                  {student.course} in {student.department}, Semester {student.semester}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none">
                    UID: {student.studentUid}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none">
                    Roll No: {student.rollNumber}
                  </Badge>
                  {cgpa !== null && cgpa !== undefined && (
                    <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none font-bold">
                      CGPA: {cgpa.toFixed(2)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Alerts */}
        {pendingFees.length > 0 && (
          <Alert className="bg-orange-50 border-orange-200 text-orange-800">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800 font-semibold">Pending Fees</AlertTitle>
            <AlertDescription className="text-orange-700">
              You have {pendingFees.length} pending fee record(s). Please clear them soon.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Admission Status */}
          {admission && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Admission Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">App #{admission.id}</span>
                  <Badge 
                    variant={admission.status === 'approved' ? 'default' : admission.status === 'rejected' ? 'destructive' : 'secondary'}
                  >
                    {admission.status}
                  </Badge>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Applied on {new Date(admission.createdAt).toLocaleDateString()}
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                  <Link href="/student/admission">View Details</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Hostel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building className="h-4 w-4" />
                Hostel Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hostelAllocation ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">Room {hostelAllocation.roomNumber}</span>
                    <Badge variant={hostelAllocation.active ? "default" : "secondary"}>
                      {hostelAllocation.active ? "Active" : "Vacated"}
                    </Badge>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground flex flex-col gap-1">
                    <span>Block: {hostelAllocation.block} | Floor: {hostelAllocation.floor}</span>
                    <span>Allocated: {new Date(hostelAllocation.allocatedDate).toLocaleDateString()}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-4" asChild>
                    <Link href="/student/hostel">View Details</Link>
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <p className="text-sm text-muted-foreground mb-4">No active hostel allocation.</p>
                  <Button variant="outline" size="sm" className="w-full" disabled>Apply for Hostel</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fees Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Recent Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fees.length > 0 ? (
                <div className="space-y-4">
                  {fees.slice(0, 2).map(fee => (
                    <div key={fee.id} className="flex justify-between items-center pb-2 border-b border-border last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium capitalize">{fee.feeType} Fee</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Due {new Date(fee.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">${fee.amount}</p>
                        <Badge 
                          variant={fee.status === 'paid' ? 'default' : fee.status === 'overdue' ? 'destructive' : 'secondary'}
                          className="text-[10px] px-1 py-0 h-4"
                        >
                          {fee.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/student/fees">View All Fees</Link>
                  </Button>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-muted-foreground">No fee records found.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
        </div>

        {/* Recent Exams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Recent Exam Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentExams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentExams.map(exam => (
                  <div key={exam.id} className="p-4 rounded-lg border border-border bg-card">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold">{exam.subjectCode}</div>
                      <Badge variant={exam.result === 'pass' ? 'default' : 'destructive'}>{exam.result}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-4 line-clamp-1" title={exam.subject}>{exam.subject}</div>
                    
                    <div className="flex justify-between items-end mt-auto">
                      <div>
                        <div className="text-xs text-muted-foreground">Total Marks</div>
                        <div className="font-bold text-lg">{exam.totalMarks} <span className="text-sm font-normal text-muted-foreground">/ {exam.maxMarks}</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Grade</div>
                        <div className="font-bold text-lg text-primary">{exam.grade}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No exam results available yet.</p>
              </div>
            )}
            
            {examResults.length > 0 && (
              <div className="mt-4 flex justify-end">
                <Button variant="link" asChild>
                  <Link href="/student/exams">View complete academic record &rarr;</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
