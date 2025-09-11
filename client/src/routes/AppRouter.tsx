import AdminDashboard from "@/pages/dashboard/admin-dashboard";
import DoctorsManagement from "@/pages/dashboard/admin/doctors-management";
import AppointmentsManagement from "@/pages/dashboard/admin/meetings";
import AdminOverview from "@/pages/dashboard/admin/overview-page";
import AdminPatientsManagement from "@/pages/dashboard/admin/patients-management";
import AdminReports from "@/pages/dashboard/admin/reports";
import AdminSettings from "@/pages/dashboard/admin/settings";
import SpecialtiesManagement from "@/pages/dashboard/admin/specialties";
import DoctorDashboard from "@/pages/dashboard/doctor-dashboard";
import Calendar from "@/pages/dashboard/doctor/Calendar";
import ConsultationsPage from "@/pages/dashboard/doctor/consultations-page";
import PatientsManagement from "@/pages/dashboard/doctor/management-patient";
import DoctorOverView from "@/pages/dashboard/doctor/overview-page";
import PlanningPage from "@/pages/dashboard/doctor/planning-page";
import ReportsPage from "@/pages/dashboard/doctor/reports-page";
import Settings from "@/pages/dashboard/doctor/settings";
import WaitingRoom from "@/pages/dashboard/doctor/waiting-room";
import { lazy, Suspense } from "react";
import {  createBrowserRouter, RouterProvider } from "react-router-dom";

const App = lazy(() => import("@/App"));
const LoginForm = lazy(() => import("@/components/forms/login-form"));
const SignupDoctorForm = lazy(() => import("@/components/forms/signupDoctor-form"));
const DefaultLayout = lazy(() => import("@/layouts/DefaultLayout"));
const ResetPasswordForm=lazy(()=>import("@/components/forms/resetPwd-form"))
const NotFound = lazy(() => import("@/pages/not-found"));
const PatientProfile=lazy(()=>import("@/pages/patient-profile"));
const AdminLayout=lazy(()=>import("@/layouts/AdminLayout"));
const MultiStepRegisterForm=lazy(()=>import("@/components/forms/signup-form"));
const EmailVerificationModal=lazy(()=>import("@/components/forms/email-verification"))
// Custom Loading component
const Loading = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="w-16 h-16 border-t-4 border-blue-500 rounded-full animate-spin"></div>
  </div>
);

const router = createBrowserRouter([
  // Public routes (DefaultLayout)
  {
    path: "/",
    element: (
      <Suspense fallback={<Loading />}>
        <DefaultLayout />
      </Suspense>
    ),
    errorElement: (
      <Suspense fallback={<Loading />}>
        <NotFound />
      </Suspense>
    ),
    children: [
      { index: true, element: <App /> },
      {path:"login",element:<LoginForm/>},
      {path:"register",element:<MultiStepRegisterForm/>},
      {path:"/register_doctor",element:<SignupDoctorForm/>},
      {path:"/verify_otp",element:<EmailVerificationModal/>},
      {path:"/reset_password",element:<ResetPasswordForm/>},
      {path:"/email_verification",element:<EmailVerificationModal/>},
      {path:"/profile",element:<PatientProfile/>},
    ],
  },
  // Doctor routes 
  {
    path: "/doctor",
    element: (
      // <ProtectedRoute>
        <Suspense fallback={<Loading />}>
          <AdminLayout />
        </Suspense>
      //</ProtectedRoute>
    ),
    errorElement: (
      <Suspense fallback={<Loading />}>
        <NotFound />
      </Suspense>
    ),
    children: [
      {
        path: "",
        element: (
          <Suspense fallback={<Loading />}>
             <DoctorDashboard /> 
          </Suspense>
        ),
        children: [
          { index: true, element: <DoctorOverView /> },
          { path: "patients", element:<PatientsManagement/> },
          { path: "planning", element: <PlanningPage /> },
          { path: "consultations", element: <ConsultationsPage /> },
          { path: "waiting_room", element: <WaitingRoom/> },
          { path: "calendar", element: <Calendar/> },
          { path: "reports", element: <ReportsPage/> },
          { path: "settings", element: <Settings /> },
        ],
      },
    ],
  },
  //Admin routes
   {
    path: "/admin",
    element: (
      // <ProtectedRoute>
        <Suspense fallback={<Loading />}>
          <AdminLayout />
        </Suspense>
      //</ProtectedRoute>
    ),
    errorElement: (
      <Suspense fallback={<Loading />}>
        <NotFound />
      </Suspense>
    ),
    children: [
      {
        path: "",
        element: (
          <Suspense fallback={<Loading />}>
             <AdminDashboard /> 
          </Suspense>
        ),
        children: [
          { index: true, element: <AdminOverview /> },
          { path: "patients", element:<AdminPatientsManagement/> },
          { path: "doctors", element: <DoctorsManagement /> },
          { path: "appointments", element: <AppointmentsManagement /> },
          { path: "specialties", element: <SpecialtiesManagement/> },
          { path: "reports", element: <AdminReports/> },
          { path: "settings", element: <AdminSettings /> },
        ],
      },
    ],
  },


  // Unauthorized page
//   {
//     path: "/unauthorized",
//     element: (
//       <Suspense fallback={<Loading />}>
//         <Unauthorized />
//       </Suspense>
//     ),
//   },
]);

const AppRouter = () => {
  return (
    <Suspense fallback={<Loading />}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export { AppRouter, Loading };