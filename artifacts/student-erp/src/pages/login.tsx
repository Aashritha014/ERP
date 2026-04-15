import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { GraduationCap, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const loginMutation = useLogin();
  const [errorMsg, setErrorMsg] = useState("");

  // Redirect if already logged in
  if (user) {
    if (user.role === 'admin') setLocation("/admin/dashboard");
    else if (user.role === 'student') setLocation("/student/dashboard");
    else if (user.role === 'faculty') setLocation("/faculty/dashboard");
    else if (user.role === 'applicant') setLocation("/applicant/status");
  }

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      setErrorMsg("");
      const res = await loginMutation.mutateAsync({ data: values });
      if (res.user.role === 'admin') setLocation("/admin/dashboard");
      else if (res.user.role === 'student') setLocation("/student/dashboard");
      else if (res.user.role === 'faculty') setLocation("/faculty/dashboard");
      else if (res.user.role === 'applicant') setLocation("/applicant/status");
      
      // Reload window to update auth state cleanly
      window.location.reload();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="bg-sidebar p-6 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">EduCore System</h1>
          <p className="text-sidebar-foreground/80 mt-1 text-sm">Institutional Management Portal</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>

          {errorMsg && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@erp.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Demo Accounts</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p><span className="font-semibold">Admin:</span> admin@erp.edu / admin123</p>
                <p><span className="font-semibold">Faculty:</span> faculty@erp.edu / faculty123</p>
                <p><span className="font-semibold">Student:</span> student@erp.edu / student123</p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                New student?{" "}
                <Link href="/apply" className="font-medium text-primary hover:text-primary/80 transition-colors">
                  Apply for Admission
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
