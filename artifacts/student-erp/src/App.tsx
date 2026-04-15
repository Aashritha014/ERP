import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, ProtectedRoute } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";

// Public Pages
import Login from "@/pages/login";
import Apply from "@/pages/apply";

// Student Pages
import StudentDashboard from "@/pages/student/dashboard";
import StudentAdmission from "@/pages/student/admission";
import StudentFees from "@/pages/student/fees";
import StudentFeeDetail from "@/pages/student/fee-detail";
import StudentHostel from "@/pages/student/hostel";
import StudentExams from "@/pages/student/exams";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminAdmissions from "@/pages/admin/admissions";
import AdminStudents from "@/pages/admin/students";
import AdminStudentDetail from "@/pages/admin/student-detail";
import AdminFees from "@/pages/admin/fees";
import AdminHostel from "@/pages/admin/hostel";
import AdminExams from "@/pages/admin/exams";

// Faculty Pages
import FacultyDashboard from "@/pages/faculty/dashboard";
import FacultyStudents from "@/pages/faculty/students";
import FacultyResults from "@/pages/faculty/results";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login" component={Login} />
      <Route path="/apply" component={Apply} />
      <Route path="/">
        <Redirect to="/login" />
      </Route>

      {/* Student Routes */}
      <Route path="/student/dashboard">
        <ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>
      </Route>
      <Route path="/student/admission">
        <ProtectedRoute allowedRoles={['student']}><StudentAdmission /></ProtectedRoute>
      </Route>
      <Route path="/student/fees">
        <ProtectedRoute allowedRoles={['student']}><StudentFees /></ProtectedRoute>
      </Route>
      <Route path="/student/fees/:id">
        <ProtectedRoute allowedRoles={['student']}><StudentFeeDetail /></ProtectedRoute>
      </Route>
      <Route path="/student/hostel">
        <ProtectedRoute allowedRoles={['student']}><StudentHostel /></ProtectedRoute>
      </Route>
      <Route path="/student/exams">
        <ProtectedRoute allowedRoles={['student']}><StudentExams /></ProtectedRoute>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/dashboard">
        <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
      </Route>
      <Route path="/admin/admissions">
        <ProtectedRoute allowedRoles={['admin']}><AdminAdmissions /></ProtectedRoute>
      </Route>
      <Route path="/admin/students">
        <ProtectedRoute allowedRoles={['admin']}><AdminStudents /></ProtectedRoute>
      </Route>
      <Route path="/admin/students/:id">
        <ProtectedRoute allowedRoles={['admin']}><AdminStudentDetail /></ProtectedRoute>
      </Route>
      <Route path="/admin/fees">
        <ProtectedRoute allowedRoles={['admin']}><AdminFees /></ProtectedRoute>
      </Route>
      <Route path="/admin/hostel">
        <ProtectedRoute allowedRoles={['admin']}><AdminHostel /></ProtectedRoute>
      </Route>
      <Route path="/admin/exams">
        <ProtectedRoute allowedRoles={['admin']}><AdminExams /></ProtectedRoute>
      </Route>

      {/* Faculty Routes */}
      <Route path="/faculty/dashboard">
        <ProtectedRoute allowedRoles={['faculty']}><FacultyDashboard /></ProtectedRoute>
      </Route>
      <Route path="/faculty/students">
        <ProtectedRoute allowedRoles={['faculty']}><FacultyStudents /></ProtectedRoute>
      </Route>
      <Route path="/faculty/results">
        <ProtectedRoute allowedRoles={['faculty']}><FacultyResults /></ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
