import { useState } from "react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useListExamResults, getListExamResultsQueryKey, useCreateExamResult, useUpdateExamResult } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Search } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const resultSchema = z.object({
  studentId: z.coerce.number().min(1, "Student ID is required"),
  subject: z.string().min(1, "Subject is required"),
  subjectCode: z.string().min(1, "Subject code is required"),
  semester: z.string().min(1, "Semester is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  internalMarks: z.coerce.number().min(0),
  externalMarks: z.coerce.number().min(0),
  maxMarks: z.coerce.number().min(1)
});

const updateSchema = z.object({
  internalMarks: z.coerce.number().min(0),
  externalMarks: z.coerce.number().min(0),
  result: z.enum(["pass", "fail", "absent"])
});

export default function FacultyResults() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  const { data: results, isLoading } = useListExamResults({}, {
    query: { queryKey: getListExamResultsQueryKey({}) }
  });

  const createMutation = useCreateExamResult();
  const updateMutation = useUpdateExamResult();

  const addForm = useForm<z.infer<typeof resultSchema>>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      studentId: 0, subject: "", subjectCode: "", semester: "Semester 1", 
      academicYear: new Date().getFullYear().toString(), internalMarks: 0, externalMarks: 0, maxMarks: 100
    }
  });

  const editForm = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema)
  });

  const filteredResults = results?.filter(r => 
    (search === "" || 
    r.studentName.toLowerCase().includes(search.toLowerCase()) || 
    r.studentUid.toLowerCase().includes(search.toLowerCase()) ||
    r.subjectCode.toLowerCase().includes(search.toLowerCase())) &&
    r.facultyId === user?.facultyId // Only show their results
  );

  const onAddSubmit = async (values: z.infer<typeof resultSchema>) => {
    try {
      await createMutation.mutateAsync({ data: values });
      toast.success("Result published successfully");
      queryClient.invalidateQueries({ queryKey: getListExamResultsQueryKey() });
      setIsAddOpen(false);
      addForm.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to publish result");
    }
  };

  const onEditSubmit = async (values: z.infer<typeof updateSchema>) => {
    if (!selectedResult) return;
    try {
      await updateMutation.mutateAsync({ id: selectedResult.id, data: values });
      toast.success("Result updated successfully");
      queryClient.invalidateQueries({ queryKey: getListExamResultsQueryKey() });
      setIsEditOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update result");
    }
  };

  const openEdit = (result: any) => {
    setSelectedResult(result);
    editForm.reset({
      internalMarks: result.internalMarks,
      externalMarks: result.externalMarks,
      result: result.result
    });
    setIsEditOpen(true);
  };

  return (
    <Layout title="Exam Results Management">
      <div className="space-y-6">
        
        <div className="flex justify-between items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by student or subject code..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Publish Result
          </Button>
        </div>

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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!filteredResults || filteredResults.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No results published yet.
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
                          <div className="text-xs text-muted-foreground line-clamp-1 w-32">{result.subject}</div>
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
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(result)}>
                            <Edit className="h-4 w-4" />
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

        {/* Add Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Publish New Result</DialogTitle>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4 py-2">
                <FormField control={addForm.control} name="studentId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID (Database ID)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={addForm.control} name="subjectCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Code</FormLabel>
                      <FormControl><Input placeholder="CS101" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={addForm.control} name="subject" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Name</FormLabel>
                      <FormControl><Input placeholder="Intro to CS" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={addForm.control} name="semester" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={addForm.control} name="academicYear" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={addForm.control} name="internalMarks" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={addForm.control} name="externalMarks" render={({ field }) => (
                    <FormItem>
                      <FormLabel>External</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={addForm.control} name="maxMarks" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Marks</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>Submit Result</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Result for {selectedResult?.studentName}</DialogTitle>
              <p className="text-sm text-muted-foreground">{selectedResult?.subjectCode} - {selectedResult?.subject}</p>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={editForm.control} name="internalMarks" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Marks</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={editForm.control} name="externalMarks" render={({ field }) => (
                    <FormItem>
                      <FormLabel>External Marks</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                <FormField control={editForm.control} name="result" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Result Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="pass">Pass</SelectItem>
                        <SelectItem value="fail">Fail</SelectItem>
                        <SelectItem value="absent">Absent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={updateMutation.isPending}>Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}
