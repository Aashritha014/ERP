import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useListFees, getListFeesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";

export default function StudentFees() {
  const { user } = useAuth();
  
  const { data: fees, isLoading, isError } = useListFees(
    { studentId: user?.studentId || 0 }, 
    {
      query: {
        enabled: !!user?.studentId,
        queryKey: getListFeesQueryKey({ studentId: user?.studentId || 0 })
      }
    }
  );

  if (!user?.studentId) {
    return <Layout title="My Fees">Not linked to student profile.</Layout>;
  }

  if (isLoading) {
    return <Layout title="My Fees"><div className="flex justify-center"><Spinner className="h-8 w-8 text-primary" /></div></Layout>;
  }

  if (isError || !fees) {
    return <Layout title="My Fees"><div>Failed to load fees data.</div></Layout>;
  }

  return (
    <Layout title="My Fees">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Semester / Year</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No fee records found.
                  </TableCell>
                </TableRow>
              ) : (
                fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium capitalize">{fee.feeType}</TableCell>
                    <TableCell>{fee.semester} ({fee.academicYear})</TableCell>
                    <TableCell className="font-bold text-gray-900">${fee.amount}</TableCell>
                    <TableCell>{new Date(fee.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={fee.status === 'paid' ? 'default' : fee.status === 'overdue' ? 'destructive' : 'secondary'}
                      >
                        {fee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/student/fees/${fee.id}`}>
                          <Receipt className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Layout>
  );
}
