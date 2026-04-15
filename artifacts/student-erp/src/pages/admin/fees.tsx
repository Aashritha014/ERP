import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListFees, getListFeesQueryKey, useCreateFeeRecord, useUpdateFeeRecord, ListFeesStatus, useListStudents } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, CheckCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const feeSchema = z.object({
  studentId: z.coerce.number().min(1, "Student ID is required"),
  feeType: z.enum(["tuition", "hostel", "exam", "library", "other"]),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  dueDate: z.string().min(1, "Due date is required"),
  semester: z.string().min(1, "Semester is required"),
  academicYear: z.string().min(1, "Academic year is required")
});

export default function AdminFees() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ListFeesStatus | "all">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const queryParams = statusFilter !== "all" ? { status: statusFilter } : {};
  
  const { data: fees, isLoading } = useListFees(queryParams, {
    query: { queryKey: getListFeesQueryKey(queryParams) }
  });

  const createMutation = useCreateFeeRecord();
  const updateMutation = useUpdateFeeRecord();

  const form = useForm<z.infer<typeof feeSchema>>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      studentId: 0,
      feeType: "tuition",
      amount: 0,
      dueDate: "",
      semester: "Semester 1",
      academicYear: new Date().getFullYear().toString()
    }
  });

  const filteredFees = fees?.filter(f => 
    search === "" || 
    f.studentName.toLowerCase().includes(search.toLowerCase()) || 
    f.studentUid.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = async (values: z.infer<typeof feeSchema>) => {
    try {
      await createMutation.mutateAsync({ data: values });
      toast.success("Fee record created successfully");
      queryClient.invalidateQueries({ queryKey: getListFeesQueryKey() });
      setIsAddDialogOpen(false);
      form.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create fee record");
    }
  };

  const markAsPaid = async (feeId: number) => {
    try {
      await updateMutation.mutateAsync({
        id: feeId,
        data: { status: "paid" }
      });
      toast.success("Payment recorded successfully");
      queryClient.invalidateQueries({ queryKey: getListFeesQueryKey() });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update payment");
    }
  };

  return (
    <Layout title="Fee Management">
      <div className="space-y-6">
        
        <div className="flex justify-between items-center gap-4">
          <div className="flex gap-4 flex-1">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search student..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Fee Record
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
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Sem / Year</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!filteredFees || filteredFees.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No fee records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFees.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell>
                          <div className="font-medium">{fee.studentName}</div>
                          <div className="text-xs text-muted-foreground">{fee.studentUid}</div>
                        </TableCell>
                        <TableCell className="capitalize">{fee.feeType}</TableCell>
                        <TableCell>{fee.semester} ({fee.academicYear})</TableCell>
                        <TableCell className="font-bold">${fee.amount}</TableCell>
                        <TableCell>{new Date(fee.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={fee.status === 'paid' ? 'default' : fee.status === 'overdue' ? 'destructive' : 'secondary'}>
                            {fee.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {fee.status !== 'paid' && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                              onClick={() => markAsPaid(fee.id)}
                              disabled={updateMutation.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Mark Paid
                            </Button>
                          )}
                          {fee.status === 'paid' && (
                            <span className="text-xs text-muted-foreground">{new Date(fee.paidDate!).toLocaleDateString()}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Fee Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New Fee Record</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField control={form.control} name="studentId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID (Database ID)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="feeType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="tuition">Tuition</SelectItem>
                          <SelectItem value="hostel">Hostel</SelectItem>
                          <SelectItem value="exam">Exam</SelectItem>
                          <SelectItem value="library">Library</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="semester" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="academicYear" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                </div>
                <FormField control={form.control} name="dueDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Generating..." : "Generate Bill"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
