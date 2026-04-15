import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useGetFacultyDashboard, getGetFacultyDashboardQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, GraduationCap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function FacultyDashboard() {
  const { user } = useAuth();
  
  const { data: dashboard, isLoading, isError } = useGetFacultyDashboard(user?.facultyId || 0, {
    query: {
      enabled: !!user?.facultyId,
      queryKey: getGetFacultyDashboardQueryKey(user?.facultyId || 0)
    }
  });

  if (!user?.facultyId) {
    return <Layout title="Faculty Dashboard"><Alert variant="destructive"><AlertDescription>Not linked to a faculty profile.</AlertDescription></Alert></Layout>;
  }

  if (isLoading) {
    return <Layout title="Faculty Dashboard"><div className="flex justify-center h-64 items-center"><Spinner className="h-8 w-8 text-primary" /></div></Layout>;
  }

  if (isError || !dashboard) {
    return <Layout title="Faculty Dashboard"><Alert variant="destructive"><AlertDescription>Failed to load dashboard.</AlertDescription></Alert></Layout>;
  }

  return (
    <Layout title="Faculty Dashboard">
      <div className="space-y-6">
        
        <Card className="bg-sidebar text-white border-none shadow-md overflow-hidden">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-2">Welcome, Prof. {dashboard.faculty.name}</h2>
            <p className="text-sidebar-foreground/80 mb-4">{dashboard.faculty.designation} • {dashboard.faculty.department}</p>
            <div className="flex gap-2 flex-wrap">
              {dashboard.faculty.subjects.map(sub => (
                <Badge key={sub} variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none">{sub}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Students Managed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{dashboard.totalStudentsManaged}</div>
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/faculty/students">View Student List</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Subject Pass Rates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mt-2">
                {dashboard.subjectPassRates.map((stat, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{stat.subject}</span>
                      <span>{stat.passRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${stat.passRate > 80 ? 'bg-green-500' : stat.passRate > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${stat.passRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" /> Recently Published Results
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/faculty/results">Manage Results</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Student</th>
                    <th className="px-4 py-3 text-left font-medium">Subject</th>
                    <th className="px-4 py-3 text-right font-medium">Marks</th>
                    <th className="px-4 py-3 text-center font-medium">Grade</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dashboard.recentResults.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-4">No recent results.</td></tr>
                  ) : (
                    dashboard.recentResults.map((result) => (
                      <tr key={result.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{result.studentName}</td>
                        <td className="px-4 py-3">{result.subjectCode}</td>
                        <td className="px-4 py-3 text-right font-bold">{result.totalMarks}/{result.maxMarks}</td>
                        <td className="px-4 py-3 text-center font-bold text-primary">{result.grade}</td>
                        <td className="px-4 py-3">
                          <Badge variant={result.result === 'pass' ? 'default' : 'destructive'}>
                            {result.result}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
