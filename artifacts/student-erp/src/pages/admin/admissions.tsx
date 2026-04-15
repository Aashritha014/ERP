import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListAdmissions, getListAdmissionsQueryKey, useUpdateAdmissionStatus, ListAdmissionsStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Eye } from "lucide-react";
import { toast } from "sonner";

export default function AdminAdmissions() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ListAdmissionsStatus | "all">("all");
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [remarks, setRemarks] = useState("");
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const queryParams = statusFilter !== "all" ? { status: statusFilter } : {};
  
  const { data: admissions, isLoading } = useListAdmissions(queryParams, {
    query: { queryKey: getListAdmissionsQueryKey(queryParams) }
  });

  const updateMutation = useUpdateAdmissionStatus();

  const handleAction = async () => {
    if (!selectedAdmission || !actionType) return;
    
    try {
      await updateMutation.mutateAsync({
        id: selectedAdmission.id,
        data: {
          status: actionType === "approve" ? "approved" : "rejected",
          remarks: remarks
        }
      });
      
      toast.success(`Application ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      queryClient.invalidateQueries({ queryKey: getListAdmissionsQueryKey() });
      setIsActionDialogOpen(false);
      setRemarks("");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Action failed");
    }
  };

  const openActionDialog = (admission: any, type: "approve" | "reject") => {
    setSelectedAdmission(admission);
    setActionType(type);
    setRemarks(admission.remarks || "");
    setIsActionDialogOpen(true);
  };

  const openViewDialog = (admission: any) => {
    setSelectedAdmission(admission);
    setIsViewDialogOpen(true);
  };

  return (
    <Layout title="Admissions Management">
      <div className="space-y-6">
        
        <div className="flex justify-between items-center gap-4">
          <div className="w-64">
            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Applications</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                    <TableHead>ID</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Course/Dept</TableHead>
                    <TableHead>Prev. Marks</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!admissions || admissions.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No applications found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    admissions.map((admission) => (
                      <TableRow key={admission.id}>
                        <TableCell className="font-medium">#{admission.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{admission.name}</div>
                          <div className="text-xs text-muted-foreground">{admission.email}</div>
                        </TableCell>
                        <TableCell>
                          <div>{admission.course}</div>
                          <div className="text-xs text-muted-foreground">{admission.department}</div>
                        </TableCell>
                        <TableCell>{admission.previousMarks}%</TableCell>
                        <TableCell>{new Date(admission.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={admission.status === 'approved' ? 'default' : admission.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {admission.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" title="View details" onClick={() => openViewDialog(admission)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {admission.status === 'pending' && (
                              <>
                                <Button variant="outline" size="icon" className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200" onClick={() => openActionDialog(admission, "approve")}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => openActionDialog(admission, "reject")}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Action Dialog */}
        <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{actionType === 'approve' ? 'Approve' : 'Reject'} Application #{selectedAdmission?.id}</DialogTitle>
              <DialogDescription>
                You are about to {actionType} the application for {selectedAdmission?.name}.
                {actionType === 'approve' && ' This will create a new Student record.'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="block text-sm font-medium mb-2">Remarks (Optional)</label>
              <Textarea 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter any remarks..."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>Cancel</Button>
              <Button 
                variant={actionType === 'approve' ? 'default' : 'destructive'} 
                onClick={handleAction}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Processing..." : `Confirm ${actionType}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Application Details #{selectedAdmission?.id}</DialogTitle>
            </DialogHeader>
            {selectedAdmission && (
              <div className="grid grid-cols-2 gap-4 py-4">
                <div><span className="font-semibold text-muted-foreground">Name:</span> {selectedAdmission.name}</div>
                <div><span className="font-semibold text-muted-foreground">Status:</span> <Badge>{selectedAdmission.status}</Badge></div>
                <div><span className="font-semibold text-muted-foreground">Email:</span> {selectedAdmission.email}</div>
                <div><span className="font-semibold text-muted-foreground">Phone:</span> {selectedAdmission.phone}</div>
                <div><span className="font-semibold text-muted-foreground">DOB:</span> {new Date(selectedAdmission.dateOfBirth).toLocaleDateString()}</div>
                <div><span className="font-semibold text-muted-foreground">Gender:</span> {selectedAdmission.gender}</div>
                <div className="col-span-2"><span className="font-semibold text-muted-foreground">Address:</span> {selectedAdmission.address}</div>
                <div><span className="font-semibold text-muted-foreground">Course:</span> {selectedAdmission.course}</div>
                <div><span className="font-semibold text-muted-foreground">Department:</span> {selectedAdmission.department}</div>
                <div><span className="font-semibold text-muted-foreground">Prev School:</span> {selectedAdmission.previousSchool}</div>
                <div><span className="font-semibold text-muted-foreground">Marks:</span> {selectedAdmission.previousMarks}%</div>
                {selectedAdmission.remarks && (
                  <div className="col-span-2 mt-2 pt-2 border-t border-border">
                    <span className="font-semibold text-muted-foreground block mb-1">Remarks:</span>
                    {selectedAdmission.remarks}
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
