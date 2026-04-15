import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useGetFeeRecord, getGetFeeRecordQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams, Link } from "wouter";
import { ArrowLeft, Printer, Download, Receipt } from "lucide-react";

export default function StudentFeeDetail() {
  const { id } = useParams<{ id: string }>();
  const feeId = parseInt(id || "0", 10);
  
  const { data: fee, isLoading, isError } = useGetFeeRecord(feeId, {
    query: {
      enabled: !!feeId,
      queryKey: getGetFeeRecordQueryKey(feeId)
    }
  });

  if (isLoading) {
    return <Layout title="Fee Receipt"><div className="flex justify-center"><Spinner className="h-8 w-8 text-primary" /></div></Layout>;
  }

  if (isError || !fee) {
    return <Layout title="Fee Receipt"><div>Failed to load fee detail.</div></Layout>;
  }

  return (
    <Layout title="Fee Receipt">
      <div className="mb-6">
        <Button variant="ghost" asChild className="pl-0 hover:bg-transparent">
          <Link href="/student/fees" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Fees
          </Link>
        </Button>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex justify-end gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>

        {/* Receipt printable area */}
        <Card className="print:shadow-none print:border-none">
          <div className="bg-sidebar p-8 text-white flex justify-between items-center print:bg-gray-100 print:text-black print:border-b">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg print:bg-gray-200">
                <Receipt className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">EduCore University</h2>
                <p className="text-white/80 text-sm print:text-gray-600">Official Fee Receipt</p>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-semibold tracking-wider opacity-80 print:text-black">RECEIPT</h3>
              <p className="text-sm opacity-60">#{fee.receiptNumber || `TEMP-${fee.id}`}</p>
            </div>
          </div>

          <CardContent className="p-8">
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Billed To</h4>
                <p className="font-medium text-lg">{fee.studentName}</p>
                <p className="text-muted-foreground">UID: {fee.studentUid}</p>
              </div>
              <div className="text-right">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Details</h4>
                <p className="text-sm"><span className="text-muted-foreground mr-2">Date Issued:</span> {new Date(fee.createdAt).toLocaleDateString()}</p>
                <p className="text-sm"><span className="text-muted-foreground mr-2">Due Date:</span> {new Date(fee.dueDate).toLocaleDateString()}</p>
                {fee.paidDate && (
                  <p className="text-sm"><span className="text-muted-foreground mr-2">Paid Date:</span> {new Date(fee.paidDate).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden mb-8">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Description</th>
                    <th className="px-4 py-3 text-center font-medium">Semester / Year</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-4 capitalize font-medium">{fee.feeType} Fee</td>
                    <td className="px-4 py-4 text-center text-muted-foreground">{fee.semester} ({fee.academicYear})</td>
                    <td className="px-4 py-4 text-right font-bold">${fee.amount.toFixed(2)}</td>
                  </tr>
                </tbody>
                <tfoot className="bg-muted/50 font-bold border-t-2 border-border">
                  <tr>
                    <td colSpan={2} className="px-4 py-4 text-right">Total Amount</td>
                    <td className="px-4 py-4 text-right text-lg text-primary">${fee.amount.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-between items-center border-t border-border pt-8 mt-8">
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Payment Status</h4>
                <Badge 
                  variant={fee.status === 'paid' ? 'default' : fee.status === 'overdue' ? 'destructive' : 'secondary'}
                  className="text-sm px-4 py-1"
                >
                  {fee.status.toUpperCase()}
                </Badge>
              </div>
              <div className="text-center opacity-50">
                <p className="text-sm italic">Computer generated document</p>
                <p className="text-xs mt-1">Requires no physical signature</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
