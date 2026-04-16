import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListAdmissions, getListAdmissionsQueryKey, useUpdateAdmissionStatus, ListAdmissionsStatus, StudentCredentials } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Check, X, Eye, Copy, CheckCheck, GraduationCap, IdCard, Hash, Mail, Lock, AtSign } from "lucide-react";
import { toast } from "sonner";

function CopyRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="h-4 w-4 text-slate-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
          <p className="text-sm font-mono font-semibold text-slate-900 truncate mt-0.5">{value}</p>
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="flex-shrink-0 p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
      >
        {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export default function AdminAdmissions() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ListAdmissionsStatus | "all">("all");
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [remarks, setRemarks] = useState("");
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [approvedCredentials, setApprovedCredentials] = useState<StudentCredentials | null>(null);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);

  const queryParams = statusFilter !== "all" ? { status: statusFilter } : {};
  
  const { data: admissions, isLoading } = useListAdmissions(queryParams, {
    query: { queryKey: getListAdmissionsQueryKey(queryParams) }
  });

  const updateMutation = useUpdateAdmissionStatus();

  const handleAction = async () => {
    if (!selectedAdmission || !actionType) return;
    
    try {
      const result = await updateMutation.mutateAsync({
        id: selectedAdmission.id,
        data: {
          status: actionType === "approve" ? "approved" : "rejected",
          remarks: remarks
        }
      });
      
      queryClient.invalidateQueries({ queryKey: getListAdmissionsQueryKey() });
      setIsActionDialogOpen(false);
      setRemarks("");

      if (actionType === "approve" && result.studentCredentials) {
        setApprovedCredentials(result.studentCredentials);
        setIsCredentialsDialogOpen(true);
      } else {
        toast.success("Application rejected successfully");
      }
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
                You are about to {actionType} the application for <strong>{selectedAdmission?.name}</strong>.
                {actionType === 'approve' && ' A student account and login credentials will be generated automatically.'}
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

        {/* Student Credentials Dialog (shown after approval) */}
        <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <GraduationCap className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <DialogTitle className="text-green-800">Application Approved!</DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">Student account has been created</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {approvedCredentials && (
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Share these login credentials with the student. The password is generated once and will not be shown again.
                </p>

                {/* Official email highlight */}
                <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3">
                  <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-0.5">
                    Official University Email
                  </p>
                  <p className="text-base font-bold text-green-900 font-mono">
                    {approvedCredentials.officialEmail}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Auto-generated from the student's name. Share this as their new login email.
                  </p>
                </div>

                <div className="space-y-2">
                  <CopyRow icon={IdCard} label="Student ID" value={approvedCredentials.studentUid} />
                  <CopyRow icon={Hash} label="Roll Number" value={approvedCredentials.rollNumber} />
                  <CopyRow icon={AtSign} label="Official Email (Login)" value={approvedCredentials.officialEmail} />
                  <CopyRow icon={Lock} label="Password" value={approvedCredentials.password} />
                </div>

                <Separator />

                <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-amber-500 text-base flex-shrink-0">⚠</span>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Copy and share these credentials with the student now. The password cannot be recovered later.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setIsCredentialsDialogOpen(false)} className="w-full">
                Done
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
