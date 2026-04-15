import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListExamResults, getListExamResultsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function AdminExams() {
  const [search, setSearch] = useState("");
  
  const { data: results, isLoading } = useListExamResults({}, {
    query: { queryKey: getListExamResultsQueryKey({}) }
  });

  const filteredResults = results?.filter(r => 
    search === "" || 
    r.studentName.toLowerCase().includes(search.toLowerCase()) || 
    r.studentUid.toLowerCase().includes(search.toLowerCase()) ||
    r.subjectCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Exam Records">
      <div className="space-y-6">
        
        <Card>
          <CardContent className="p-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by student, UID, or subject code..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Spinner className="h-8 w-8 text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Semester / Year</TableHead>
                    <TableHead className="text-right">Internal</TableHead>
                    <TableHead className="text-right">External</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Grade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!filteredResults || filteredResults.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No exam records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          <div className="font-medium">{result.studentName}</div>
                          <div className="text-xs text-muted-foreground">{result.studentUid}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{result.subjectCode}</div>
                          <div className="text-xs text-muted-foreground">{result.subject}</div>
                        </TableCell>
                        <TableCell>{result.semester} ({result.academicYear})</TableCell>
                        <TableCell className="text-right">{result.internalMarks}</TableCell>
                        <TableCell className="text-right">{result.externalMarks}</TableCell>
                        <TableCell className="text-right font-bold">{result.totalMarks} / {result.maxMarks}</TableCell>
                        <TableCell className="text-center font-bold text-primary">{result.grade}</TableCell>
                        <TableCell>
                          <Badge variant={result.result === 'pass' ? 'default' : 'destructive'} className="uppercase text-[10px]">
                            {result.result}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
