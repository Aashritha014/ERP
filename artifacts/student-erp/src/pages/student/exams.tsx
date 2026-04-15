import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useListExamResults, getListExamResultsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GraduationCap } from "lucide-react";
import { useMemo } from "react";

export default function StudentExams() {
  const { user } = useAuth();
  
  const { data: results, isLoading, isError } = useListExamResults(
    { studentId: user?.studentId || 0 }, 
    {
      query: {
        enabled: !!user?.studentId,
        queryKey: getListExamResultsQueryKey({ studentId: user?.studentId || 0 })
      }
    }
  );

  const groupedResults = useMemo(() => {
    if (!results) return {};
    return results.reduce((acc, result) => {
      const key = `${result.semester} - ${result.academicYear}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(result);
      return acc;
    }, {} as Record<string, typeof results>);
  }, [results]);

  if (!user?.studentId) {
    return <Layout title="Academic Results">Not linked to student profile.</Layout>;
  }

  if (isLoading) {
    return <Layout title="Academic Results"><div className="flex justify-center"><Spinner className="h-8 w-8 text-primary" /></div></Layout>;
  }

  if (isError || !results) {
    return <Layout title="Academic Results"><div>Failed to load exam data.</div></Layout>;
  }

  return (
    <Layout title="Academic Results">
      
      {Object.keys(groupedResults).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-bold">No Exam Records Found</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              Your academic results will appear here once they are published by your faculty.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedResults).map(([semesterKey, exams]) => {
            // Calculate semester stats
            const totalMaxMarks = exams.reduce((sum, e) => sum + e.maxMarks, 0);
            const totalSecuredMarks = exams.reduce((sum, e) => sum + e.totalMarks, 0);
            const percentage = totalMaxMarks > 0 ? (totalSecuredMarks / totalMaxMarks) * 100 : 0;
            const hasFailed = exams.some(e => e.result !== 'pass');

            return (
              <Card key={semesterKey} className="overflow-hidden">
                <div className="bg-sidebar p-4 text-white flex justify-between items-center border-b border-sidebar-border">
                  <h3 className="text-lg font-bold">{semesterKey}</h3>
                  <div className="flex gap-4 items-center">
                    <span className="text-sm opacity-80">Total: {totalSecuredMarks}/{totalMaxMarks} ({percentage.toFixed(1)}%)</span>
                    <Badge variant={hasFailed ? "destructive" : "default"} className="bg-white text-sidebar font-bold">
                      {hasFailed ? "NEEDS IMPROVEMENT" : "CLEAR"}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-right">Internal</TableHead>
                        <TableHead className="text-right">External</TableHead>
                        <TableHead className="text-right font-bold">Total</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead>Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exams.map((exam) => (
                        <TableRow key={exam.id}>
                          <TableCell className="font-medium text-xs bg-muted/30">{exam.subjectCode}</TableCell>
                          <TableCell className="font-semibold">{exam.subject}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{exam.internalMarks}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{exam.externalMarks}</TableCell>
                          <TableCell className="text-right font-bold text-gray-900">
                            {exam.totalMarks} <span className="text-xs font-normal text-muted-foreground">/{exam.maxMarks}</span>
                          </TableCell>
                          <TableCell className="text-center font-bold text-primary">{exam.grade}</TableCell>
                          <TableCell>
                            <Badge variant={exam.result === 'pass' ? 'default' : 'destructive'} className="uppercase text-[10px]">
                              {exam.result}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
