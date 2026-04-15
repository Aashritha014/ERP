import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useListHostelAllocations, getListHostelAllocationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Calendar, CheckCircle2 } from "lucide-react";

export default function StudentHostel() {
  const { user } = useAuth();
  
  const { data: allocations, isLoading, isError } = useListHostelAllocations(
    { studentId: user?.studentId || 0 }, 
    {
      query: {
        enabled: !!user?.studentId,
        queryKey: getListHostelAllocationsQueryKey({ studentId: user?.studentId || 0 })
      }
    }
  );

  if (!user?.studentId) {
    return <Layout title="My Hostel">Not linked to student profile.</Layout>;
  }

  if (isLoading) {
    return <Layout title="My Hostel"><div className="flex justify-center"><Spinner className="h-8 w-8 text-primary" /></div></Layout>;
  }

  if (isError || !allocations) {
    return <Layout title="My Hostel"><div>Failed to load hostel data.</div></Layout>;
  }

  const activeAllocation = allocations.find(a => a.active);
  const pastAllocations = allocations.filter(a => !a.active);

  return (
    <Layout title="My Hostel Allocation">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {activeAllocation ? (
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center text-primary">
                  <Building className="h-5 w-5 mr-2" />
                  Current Room Allocation
                </CardTitle>
                <Badge className="bg-green-600">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-sidebar text-white rounded-lg p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-semibold tracking-wider uppercase opacity-80 mb-1">Room No.</span>
                  <span className="text-4xl font-bold">{activeAllocation.roomNumber}</span>
                </div>
                
                <div className="sm:col-span-2 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Location</p>
                      <p className="font-semibold text-lg">Block {activeAllocation.block}, Floor {activeAllocation.floor}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Allocated On</p>
                      <p className="font-semibold text-lg">{new Date(activeAllocation.allocatedDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <p className="font-semibold text-lg text-green-700">Currently Occupied</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Building className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold">No Active Room</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">You currently do not have a hostel room assigned to you. Contact the administration for allocation.</p>
            </CardContent>
          </Card>
        )}

        {pastAllocations.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-4">Previous Allocations</h3>
            <div className="space-y-4">
              {pastAllocations.map(allocation => (
                <Card key={allocation.id} className="opacity-75 hover:opacity-100 transition-opacity">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="bg-muted px-4 py-2 rounded-md font-bold text-lg">
                        {allocation.roomNumber}
                      </div>
                      <div>
                        <p className="font-medium">Block {allocation.block}, Floor {allocation.floor}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(allocation.allocatedDate).toLocaleDateString()} - 
                          {allocation.vacatedDate ? new Date(allocation.vacatedDate).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">Vacated</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
