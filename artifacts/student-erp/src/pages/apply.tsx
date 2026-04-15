import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateAdmission, CreateAdmissionBodyGender } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap, ArrowLeft, CheckCircle2, Copy, Check, Lock, Mail, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

const applySchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"]),
  address: z.string().min(5, "Address is required"),
  course: z.string().min(2, "Course is required"),
  department: z.string().min(2, "Department is required"),
  previousSchool: z.string().min(2, "Previous school is required"),
  previousMarks: z.coerce.number().min(0).max(100),
});

interface Credentials {
  email: string;
  temporaryPassword: string;
  note: string;
  applicationId: number;
}

function CredentialRow({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
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
        title="Copy to clipboard"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export default function Apply() {
  const [, setLocation] = useLocation();
  const createAdmissionMutation = useCreateAdmission();
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  const form = useForm<z.infer<typeof applySchema>>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      gender: "other",
      address: "",
      course: "",
      department: "",
      previousSchool: "",
      previousMarks: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof applySchema>) => {
    try {
      const res = await createAdmissionMutation.mutateAsync({
        data: {
          ...values,
          gender: values.gender as CreateAdmissionBodyGender,
        },
      });
      setCredentials({
        email: res.credentials.email,
        temporaryPassword: res.credentials.temporaryPassword,
        note: res.credentials.note,
        applicationId: res.admission.id,
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  if (credentials) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md space-y-4">
          {/* Success Header */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-sidebar px-6 pt-8 pb-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/15 mb-4">
                <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Application Submitted!</h2>
              <p className="text-sidebar-foreground/70 mt-1 text-sm">
                Application ID: <span className="font-bold text-white">#{credentials.applicationId}</span>
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">Your Temporary Login Credentials</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Use these to log in and track your application status in real time.
                  Save them now — the password will not be shown again.
                </p>
              </div>

              <div className="space-y-2">
                <CredentialRow label="Email" value={credentials.email} icon={Mail} />
                <CredentialRow label="Temporary Password" value={credentials.temporaryPassword} icon={Lock} />
              </div>

              {/* Warning box */}
              <div className="flex gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-amber-500 text-base flex-shrink-0 mt-0.5">⚠</span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {credentials.note}
                </p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <Card className="border-slate-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">What happens next</p>
              <div className="space-y-3">
                {[
                  { step: "1", text: "Log in using the credentials above" },
                  { step: "2", text: "Track your application status in real time" },
                  { step: "3", text: "If approved, your full student account will be activated" },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {step}
                    </div>
                    <p className="text-sm text-slate-700">{text}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={() => setLocation("/login")}
            className="w-full"
            size="lg"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="bg-sidebar p-6 text-center relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            onClick={() => setLocation("/login")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admission Application</h1>
          <p className="text-sidebar-foreground/80 mt-1 text-sm">Join EduCore University</p>
        </div>

        <div className="p-8">
          {createAdmissionMutation.isError && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>
                Failed to submit application. Please check your inputs and try again.
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 98765 43210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="course"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <FormControl>
                        <Input placeholder="B.Tech" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="Computer Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="previousSchool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous School / College</FormLabel>
                      <FormControl>
                        <Input placeholder="High School Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="previousMarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous Marks (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, City, State, PIN" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={createAdmissionMutation.isPending}
                  size="lg"
                >
                  {createAdmissionMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
