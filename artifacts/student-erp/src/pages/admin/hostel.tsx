import { useState } from "react";
import { Layout } from "@/components/layout";
import { useListHostelRooms, getListHostelRoomsQueryKey, useListHostelAllocations, getListHostelAllocationsQueryKey, useCreateHostelAllocation, useDeleteHostelAllocation } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Building, Users, Home } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminHostel() {
  const queryClient = useQueryClient();
  const [isAllocDialogOpen, setIsAllocDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [studentIdInput, setStudentIdInput] = useState("");

  const { data: rooms, isLoading: isLoadingRooms } = useListHostelRooms({}, {
    query: { queryKey: getListHostelRoomsQueryKey({}) }
  });

  const { data: allocations, isLoading: isLoadingAllocs } = useListHostelAllocations({}, {
    query: { queryKey: getListHostelAllocationsQueryKey({}) }
  });

  const createMutation = useCreateHostelAllocation();
  const deleteMutation = useDeleteHostelAllocation();

  const handleAllocate = async () => {
    if (!selectedRoom || !studentIdInput) return;
    try {
      await createMutation.mutateAsync({
        data: {
          roomId: selectedRoom.id,
          studentId: parseInt(studentIdInput, 10),
          allocatedDate: new Date().toISOString().split('T')[0]
        }
      });
      toast.success("Room allocated successfully");
      queryClient.invalidateQueries({ queryKey: getListHostelRoomsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListHostelAllocationsQueryKey() });
      setIsAllocDialogOpen(false);
      setStudentIdInput("");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Allocation failed");
    }
  };

  const handleVacate = async (id: number) => {
    if (!confirm("Are you sure you want to mark this allocation as vacated?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Allocation vacated successfully");
      queryClient.invalidateQueries({ queryKey: getListHostelRoomsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListHostelAllocationsQueryKey() });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to vacate room");
    }
  };

  const openAllocDialog = (room: any) => {
    setSelectedRoom(room);
    setIsAllocDialogOpen(true);
  };

  return (
    <Layout title="Hostel Management">
      <Tabs defaultValue="rooms" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rooms" className="flex items-center gap-2"><Building className="h-4 w-4"/> Rooms</TabsTrigger>
          <TabsTrigger value="allocations" className="flex items-center gap-2"><Users className="h-4 w-4"/> Allocations</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          <Card>
            <CardContent className="p-0">
              {isLoadingRooms ? (
                <div className="flex h-64 items-center justify-center">
                  <Spinner className="h-8 w-8 text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room Number</TableHead>
                      <TableHead>Block & Floor</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Occupancy</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!rooms || rooms.length === 0) ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8">No rooms found.</TableCell></TableRow>
                    ) : (
                      rooms.map((room) => (
                        <TableRow key={room.id}>
                          <TableCell className="font-bold">{room.roomNumber}</TableCell>
                          <TableCell>Block {room.block}, Floor {room.floor}</TableCell>
                          <TableCell className="capitalize">{room.type}</TableCell>
                          <TableCell>
                            {room.occupied} / {room.capacity}
                          </TableCell>
                          <TableCell>
                            <Badge variant={room.available ? 'default' : 'destructive'}>
                              {room.available ? 'Available' : 'Full'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" size="sm" 
                              disabled={!room.available}
                              onClick={() => openAllocDialog(room)}
                            >
                              Allocate
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
        </TabsContent>

        <TabsContent value="allocations">
          <Card>
            <CardContent className="p-0">
              {isLoadingAllocs ? (
                <div className="flex h-64 items-center justify-center">
                  <Spinner className="h-8 w-8 text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Allocated Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!allocations || allocations.length === 0) ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8">No allocations found.</TableCell></TableRow>
                    ) : (
                      allocations.map((alloc) => (
                        <TableRow key={alloc.id}>
                          <TableCell>
                            <div className="font-medium">{alloc.studentName}</div>
                            <div className="text-xs text-muted-foreground">{alloc.studentUid}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">Room {alloc.roomNumber}</div>
                            <div className="text-xs text-muted-foreground">Block {alloc.block}</div>
                          </TableCell>
                          <TableCell>{new Date(alloc.allocatedDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={alloc.active ? 'default' : 'secondary'}>
                              {alloc.active ? 'Active' : 'Vacated'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {alloc.active && (
                              <Button variant="destructive" size="sm" onClick={() => handleVacate(alloc.id)} disabled={deleteMutation.isPending}>
                                Vacate
                              </Button>
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
        </TabsContent>
      </Tabs>

      <Dialog open={isAllocDialogOpen} onOpenChange={setIsAllocDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate Room {selectedRoom?.roomNumber}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-muted p-3 rounded-md text-sm">
              <p><strong>Block:</strong> {selectedRoom?.block}</p>
              <p><strong>Capacity:</strong> {selectedRoom?.occupied} / {selectedRoom?.capacity} occupied</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Student ID (Database ID)</label>
              <Input 
                type="number"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                placeholder="e.g. 1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAllocDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAllocate} disabled={createMutation.isPending || !studentIdInput}>
              {createMutation.isPending ? "Allocating..." : "Allocate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Layout>
  );
}
