import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useGetAdminDashboard, getGetAdminDashboardQueryKey,
  useListStudents, getListStudentsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users, FileText, DollarSign, Building, TrendingUp,
  Search, GraduationCap, ExternalLink,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

export default function AdminDashboard() {
  const [search, setSearch] = useState("");

  const { data: dashboard, isLoading, isError } = useGetAdminDashboard({
    query: { queryKey: getGetAdminDashboardQueryKey() },
  });

  const { data: allStudents, isLoading: studentsLoading } = useListStudents(
    {},
    { query: { queryKey: getListStudentsQueryKey({}) } }
  );

  const filtered = (allStudents ?? []).filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.studentUid.toLowerCase().includes(q) ||
      s.rollNumber.toLowerCase().includes(q) ||
      s.department.toLowerCase().includes(q) ||
      s.course.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <Layout title="Admin Dashboard">
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8 text-primary" />
        </div>
      </Layout>
    );
  }

  if (isError || !dashboard) {
    return (
      <Layout title="Admin Dashboard">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load dashboard data.</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#ca8a04", "#9333ea", "#0891b2"];

  const feeData = [
    { name: "Paid", value: dashboard.feeStatusBreakdown.paid },
    { name: "Pending", value: dashboard.feeStatusBreakdown.pending },
    { name: "Overdue", value: dashboard.feeStatusBreakdown.overdue },
  ];

  return (
    <Layout title="Admin Dashboard">
      <div className="space-y-6">

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Students</p>
                  <h3 className="text-3xl font-bold">{dashboard.totalStudents}</h3>
                </div>
                <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" /> Active
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending Admissions</p>
                  <h3 className="text-3xl font-bold">{dashboard.pendingAdmissions}</h3>
                </div>
                <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <Button variant="link" className="p-0 h-auto text-sm" asChild>
                  <Link href="/admin/admissions">Review now &rarr;</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                  <h3 className="text-3xl font-bold">${dashboard.totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="p-3 bg-green-100 text-green-700 rounded-lg">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-amber-600">{dashboard.pendingFees} pending fees</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Hostel Occupancy</p>
                  <h3 className="text-3xl font-bold">
                    {dashboard.hostelOccupancy}{" "}
                    <span className="text-lg text-muted-foreground font-normal">/ {dashboard.hostelCapacity}</span>
                  </h3>
                </div>
                <div className="p-3 bg-purple-100 text-purple-700 rounded-lg">
                  <Building className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${(dashboard.hostelOccupancy / Math.max(dashboard.hostelCapacity, 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Students by Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard.departmentStudentCounts}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" /> Fee Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={feeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {feeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Students */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Enrolled Students</CardTitle>
                {!studentsLoading && (
                  <Badge variant="secondary" className="ml-1">
                    {allStudents?.length ?? 0}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, ID, dept..."
                    className="pl-9 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/students">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    View All
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {studentsLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner className="h-6 w-6 text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Course / Department</TableHead>
                    <TableHead>Roll No.</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        {search ? "No students match your search." : "No enrolled students yet."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-mono text-xs font-medium text-primary">
                          {student.studentUid}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-xs text-muted-foreground">{student.email}</div>
                        </TableCell>
                        <TableCell>
                          <div>{student.course}</div>
                          <div className="text-xs text-muted-foreground">{student.department}</div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{student.rollNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">Sem {student.semester}</Badge>
                        </TableCell>
                        <TableCell>{student.enrollmentYear}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/students/${student.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Admissions */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Recent Admissions</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/admissions">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Course</th>
                    <th className="px-4 py-3 text-left font-medium">Department</th>
                    <th className="px-4 py-3 text-left font-medium">Applied Date</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {dashboard.recentAdmissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted-foreground">
                        No recent admissions.
                      </td>
                    </tr>
                  ) : (
                    dashboard.recentAdmissions.map((admission) => (
                      <tr key={admission.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{admission.name}</td>
                        <td className="px-4 py-3">{admission.course}</td>
                        <td className="px-4 py-3">{admission.department}</td>
                        <td className="px-4 py-3">{new Date(admission.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              admission.status === "approved"
                                ? "default"
                                : admission.status === "rejected"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {admission.status}
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
