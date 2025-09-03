import EmailVerificationModal from "@/components/forms/email-verification";
import MultiStepRegisterForm from "@/components/forms/signup-form";
import { lazy, Suspense } from "react";
import {  createBrowserRouter, RouterProvider } from "react-router-dom";

const App = lazy(() => import("@/App"));
const LoginForm = lazy(() => import("@/components/forms/login-form"));
const OtpForm = lazy(() => import("@/components/forms/otp-form"));
const SignupDoctorForm = lazy(() => import("@/components/forms/signupDoctor-form"));
const DefaultLayout = lazy(() => import("@/layouts/DefaultLayout"));
const ResetPasswordForm=lazy(()=>import("@/components/forms/resetPwd-form"))
const NotFound = lazy(() => import("@/pages/not-found"));


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
      {path:"/verify_otp",element:<OtpForm/>},
      {path:"/reset_password",element:<ResetPasswordForm/>},
      {path:"/email_verification",element:<EmailVerificationModal/>}
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