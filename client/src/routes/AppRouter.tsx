import ClinicDetails from "@/components/shared/clinic-details";
import ReservationsPage from "@/pages/dashboard/commun/reservations-page";
import NotificationDetails from "@/pages/notifications-details-page";
import NotificationsPage from "@/pages/notifications-page";
import ReservationSteps from "@/pages/reservationSteps";
import SearchResults from "@/pages/search-results";
import { StethoscopeIcon } from "lucide-react";
import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Lazy-loaded components
const OwnerLayout = lazy(() => import("@/layouts/OwnerLayout"));
const AdminDashboard = lazy(() => import("@/pages/dashboard/admin-dashboard"));
const DoctorsManagement = lazy(() => import("@/pages/dashboard/admin/doctors-management"));
const AppointmentsManagement = lazy(() => import("@/pages/dashboard/admin/meetings"));
const AdminOverview = lazy(() => import("@/pages/dashboard/admin/overview-page"));
const AdminPatientsManagement = lazy(() => import("@/pages/dashboard/admin/patients-management"));
const AdminReports = lazy(() => import("@/pages/dashboard/admin/reports"));
const AdminSettings = lazy(() => import("@/pages/dashboard/admin/settings"));
const SpecialtiesManagement = lazy(() => import("@/pages/dashboard/admin/specialties"));
const DoctorDashboard = lazy(() => import("@/pages/dashboard/doctor-dashboard"));
const Calendar = lazy(() => import("@/pages/dashboard/doctor/Calendar"));
const ConsultationsPage = lazy(() => import("@/pages/dashboard/doctor/consultations-page"));
const PatientsManagement = lazy(() => import("@/pages/dashboard/doctor/management-patient"));
const DoctorOverView = lazy(() => import("@/pages/dashboard/doctor/overview-page"));
const ReportsPage = lazy(() => import("@/pages/dashboard/doctor/reports-page"));
const Settings = lazy(() => import("@/pages/dashboard/doctor/settings"));
const WaitingRoom = lazy(() => import("@/pages/dashboard/doctor/waiting-room"));
const OwnerDashboard = lazy(() => import("@/pages/dashboard/owner-dashboard"));
const CabinetSettings = lazy(() => import("@/pages/dashboard/owner/cabinet-settings"));
const OwnerOverView = lazy(() => import("@/pages/dashboard/owner/over-views"));
const OwnerPatientsManagement = lazy(() => import("@/pages/dashboard/owner/owner-patients"));
const OwnerPlanning = lazy(() => import("@/pages/dashboard/owner/owner-planning"));
const OwnerReports = lazy(() => import("@/pages/dashboard/owner/owner-reports"));
const OwnerSpecialitiesMagement = lazy(() => import("@/pages/dashboard/owner/owner-specialities"));
const OwnerStaffList = lazy(() => import("@/pages/dashboard/owner/staffList"));
const App = lazy(() => import("@/App"));
const LoginForm = lazy(() => import("@/components/forms/login-form"));
const SignupDoctorForm = lazy(() => import("@/components/forms/signupDoctor-form"));
const DefaultLayout = lazy(() => import("@/layouts/DefaultLayout"));
const ResetPasswordForm = lazy(() => import("@/components/forms/resetPwd-form"));
const NotFound = lazy(() => import("@/pages/not-found"));
const PatientProfile = lazy(() => import("@/pages/patient-profile"));
const AdminLayout = lazy(() => import("@/layouts/AdminLayout"));
const MultiStepRegisterForm = lazy(() => import("@/components/forms/signup-form"));
const EmailVerificationModal = lazy(() => import("@/components/forms/email-verification"));
const StaffList = lazy(() => import("@/pages/dashboard/doctor/staff-list"));
const OurServices = lazy(() => import("@/pages/our-services"));
// Custom Loading component
const Loading = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="relative">
        {/* Medical logo with loading animation */}
        <div className="relative w-20 h-20">
          {/* Rotating ring around logo */}
          <div className="absolute inset-0 border-4 border-transparent rounded-full border-t-blue-400 animate-spin"></div>

          {/* Medical logo in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <StethoscopeIcon className="w-10 h-10 text-primary animate-pulse" />
          </div>
        </div>
      </div>
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
      {path:"/services",element:<OurServices/>},
     {path:"/doctors/speciality/:id",element:<h1>doctor speciality</h1>},
     {path:"/search",element:<SearchResults/>},
     {path:"cabinets/:id",element:<ClinicDetails/>},
     {path:'/reservations/:id',element:<ReservationSteps/>},
     {path:"/notifications" , element:<NotificationsPage/>},
     {path:"/notifications/:id" , element:<NotificationDetails/>}
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
          { path: "planning", element: <OwnerPlanning /> },
          {path:"reservations",element:<ReservationsPage/>},
          { path: "consultations", element: <ConsultationsPage /> },
          { path: "waiting_room", element: <WaitingRoom/> },
          { path: "staff_list", element: <StaffList /> },
          { path: "calendar", element: <Calendar/> },
          { path: "reports", element: <ReportsPage/> },
          { path: "settings", element: <Settings /> },
           {path:"notifications" , element:<NotificationsPage/>},
          {path:"notifications/:id" , element:<NotificationDetails/>}

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
          {path:"reservations",element:<ReservationsPage/>},
          { path: "appointments", element: <AppointmentsManagement /> },
          { path: "specialties", element: <SpecialtiesManagement/> },
          { path: "reports", element: <AdminReports/> },
          { path: "settings", element: <AdminSettings /> },
          {path:"notifications" , element:<NotificationsPage/>},
          {path:"notifications/:id" , element:<NotificationDetails/>}
        ],
      },
    ],
  },
  {
    path: "/owner",
    element: (
      // <ProtectedRoute>
        <Suspense fallback={<Loading />}>
          <OwnerLayout />
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
             <OwnerDashboard /> 
          </Suspense>
        ),
        children: [
          { index: true, element: <OwnerOverView /> },
          { path: "patients", element:<OwnerPatientsManagement/> },
          { path: "planning", element: <OwnerPlanning /> },
          {path:"reservations",element:<ReservationsPage/>},
          { path: "staff_list", element: <OwnerStaffList /> },
          { path: "specialties", element: <OwnerSpecialitiesMagement/> },
          { path: "reports", element: <OwnerReports/> },
          { path: "settings", element: <CabinetSettings /> },
           {path:"notifications" , element:<NotificationsPage/>},
           {path:"notifications/:id" , element:<NotificationDetails/>}
        ],
      },
    ],
  }


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