import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLogout } from "@workspace/api-client-react";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Building,
  GraduationCap,
  LogOut,
  BookOpen,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const { user, logoutClient } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logoutClient();
  };

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/admissions", label: "Admissions", icon: FileText },
    { href: "/admin/students", label: "Students", icon: Users },
    { href: "/admin/fees", label: "Fees & Payments", icon: CreditCard },
    { href: "/admin/hostel", label: "Hostel", icon: Building },
    { href: "/admin/exams", label: "Exams & Results", icon: GraduationCap },
  ];

  const studentLinks = [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/student/profile", label: "My Profile", icon: UserCircle },
    { href: "/student/admission", label: "My Admission", icon: FileText },
    { href: "/student/fees", label: "My Fees", icon: CreditCard },
    { href: "/student/hostel", label: "My Hostel", icon: Building },
    { href: "/student/exams", label: "My Exams", icon: GraduationCap },
  ];

  const facultyLinks = [
    { href: "/faculty/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/faculty/students", label: "My Students", icon: Users },
    { href: "/faculty/results", label: "Exam Results", icon: BookOpen },
  ];

  let links: { href: string; label: string; icon: any }[] = [];
  if (user?.role === "admin") links = adminLinks;
  else if (user?.role === "student") links = studentLinks;
  else if (user?.role === "faculty") links = facultyLinks;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-sidebar text-sidebar-foreground flex flex-col flex-shrink-0 border-r border-sidebar-border">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            EduCore ERP
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/50 mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-white truncate">{user?.name}</span>
              <span className="text-xs text-gray-400 capitalize">{user?.role}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-gray-400 hover:text-white hover:bg-sidebar-accent"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 flex-shrink-0 shadow-sm z-10">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        </header>

        <main className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-6xl mx-auto pb-12">{children}</div>
        </main>
      </div>
    </div>
  );
}
