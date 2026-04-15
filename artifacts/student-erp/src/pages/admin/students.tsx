import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListStudents, getListStudentsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Search, Eye } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce"; // We need to create this or use a simple timer

function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  import("react").then((React) => {
    React.useEffect(() => {
      const timer = setTimeout(() => setDebouncedValue(value), delay);
      return () => clearTimeout(timer);
    }, [value, delay]);
  });
  
  return debouncedValue;
}

export default function AdminStudents() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceValue(search, 500);
  const [department, setDepartment] = useState("");

  const queryParams = { 
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(department ? { department } : {})
  };

  const { data: students, isLoading } = useListStudents(queryParams, {
    query: { queryKey: getListStudentsQueryKey(queryParams) }
  });

  return (
    <Layout title="Student Directory">
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name, UID, or roll number..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Input 
              placeholder="Filter by Department..." 
              className="w-64"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
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
                    <TableHead>UID / Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Course Details</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!students || students.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No students found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="font-bold">{student.studentUid}</div>
                          <div className="text-xs text-muted-foreground">{student.rollNumber}</div>
                        </TableCell>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>
                          <div>{student.course} ({student.semester})</div>
                          <div className="text-xs text-muted-foreground">{student.department}</div>
                        </TableCell>
                        <TableCell>
                          <div>{student.email}</div>
                          <div className="text-xs text-muted-foreground">{student.phone}</div>
                        </TableCell>
                        <TableCell>{student.enrollmentYear}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/students/${student.id}`}>
                              <Eye className="h-4 w-4 mr-2" /> View
                            </Link>
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
      </div>
    </Layout>
  );
}
