import { Layout } from "@/components/layout";
import { useGetStudent, getGetStudentQueryKey, useUpdateStudent } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useParams, Link } from "wouter";
import { ArrowLeft, User, MapPin, Mail, Phone, Calendar, BookOpen, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function AdminStudentDetail() {
  const { id } = useParams<{ id: string }>();
  const studentId = parseInt(id || "0", 10);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ phone: "", address: "", semester: "" });

  const { data: student, isLoading, refetch } = useGetStudent(studentId, {
    query: {
      enabled: !!studentId,
      queryKey: getGetStudentQueryKey(studentId)
    }
  });

  const updateMutation = useUpdateStudent();

  useEffect(() => {
    if (student) {
      setEditForm({
        phone: student.phone,
        address: student.address,
        semester: student.semester
      });
    }
  }, [student]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: studentId,
        data: editForm
      });
      toast.success("Student updated successfully");
      setIsEditing(false);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update student");
    }
  };

  if (isLoading) {
    return <Layout title="Student Details"><div className="flex justify-center"><Spinner className="h-8 w-8 text-primary" /></div></Layout>;
  }

  if (!student) {
    return <Layout title="Student Details"><div>Student not found.</div></Layout>;
  }

  return (
    <Layout title={`Student: ${student.name}`}>
      <div className="mb-6">
        <Button variant="ghost" asChild className="pl-0 hover:bg-transparent">
          <Link href="/admin/students" className="flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Directory
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="p-6 text-center">
            <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <User className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-xl font-bold">{student.name}</h2>
            <p className="text-muted-foreground">{student.studentUid}</p>
            
            <div className="mt-6 flex flex-col gap-2 text-left">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{student.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {isEditing ? (
                  <Input 
                    value={editForm.phone} 
                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                    className="h-8 text-sm"
                  />
                ) : (
                  <span>{student.phone}</span>
                )}
              </div>
              <div className="flex items-start gap-2 text-sm mt-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                {isEditing ? (
                  <Input 
                    value={editForm.address} 
                    onChange={e => setEditForm({...editForm, address: e.target.value})}
                    className="h-8 text-sm"
                  />
                ) : (
                  <span>{student.address}</span>
                )}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              {isEditing ? (
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleSave} disabled={updateMutation.isPending}>Save</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Academic Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <p className="text-sm text-muted-foreground">Course</p>
                  <p className="font-medium">{student.course}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{student.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Semester</p>
                  {isEditing ? (
                    <Input 
                      value={editForm.semester} 
                      onChange={e => setEditForm({...editForm, semester: e.target.value})}
                      className="h-8 w-32 mt-1"
                    />
                  ) : (
                    <p className="font-medium">{student.semester}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Roll Number</p>
                  <p className="font-medium">{student.rollNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Enrollment Year</p>
                  <p className="font-medium">{student.enrollmentYear}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{new Date(student.dateOfBirth).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{student.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Created</p>
                  <p className="font-medium">{new Date(student.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admission ID</p>
                  <p className="font-medium">{student.admissionId ? `#${student.admissionId}` : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
