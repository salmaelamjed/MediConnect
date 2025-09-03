import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useNavigate } from "react-router-dom"
import logo from '@/assets/logo.svg'
import { useAppDispatch  } from "@/store/hooks"
import loginSchema,{ type LoginInputs } from "@/validations/LoginSchema";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { actAuthLogin } from "@/store/auth/authSlice"

// Define the expected error type
interface AuthError {
  payload?: string;
}

const LoginForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<LoginInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInputs) => {
    try {
      const response = await dispatch(actAuthLogin(data)).unwrap();
      const { token,role  } = response;

      if (token) {
        localStorage.setItem("accessToken", token);
      }

      toast.success("Login successful!");

      // Role-based redirection
      if (role === "admin") navigate("/admin/dashboard");
      else if (role === "doctor") navigate("/doctor/dashboard");
      else navigate("/");

      reset();
    } catch (err: unknown) {
      // Type narrowing to safely access payload
      const errorMessage =
        err && typeof err === "object" && "payload" in err && typeof (err as AuthError).payload === "string"
          ? (err as AuthError).payload
          : "Invalid email or password.";
      setError("email", { message: errorMessage });
      setError("password", { message: errorMessage });
    }
  };

  return (
    <div className={cn("min-h-screen w-full  flex items-center justify-center p-4 sm:p-6", className)} {...props}>
      <Card className="w-full max-w-lg overflow-hidden border-0 shadow-xl sm:max-w-xl md:max-w-2xl lg:max-w-4xl rounded-2xl">
        <CardContent className="grid min-h-[500px] p-0 md:grid-cols-2">
          <div className="relative hidden overflow-hidden md:block bg-muted rounded-l-2xl">
            <img
              src="https://i.pinimg.com/1200x/b2/57/54/b2575406a7581145bbe062ca158ee1a1.jpg"
              alt="Medical professionals"
              className="absolute inset-0 object-cover w-full h-full"
            />
            <div className="absolute inset-0 flex flex-col justify-between p-8 bg-gradient-to-b from-blue-900/80 to-blue-800/60">
              <div>
                <h1 className="mb-2 text-3xl font-bold text-white">MediConnect</h1>
                <p className="text-blue-100">Your health, connected.</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 mr-4 bg-blue-500 rounded-full">
                    <span className="font-semibold text-white">✓</span>
                  </div>
                  <p className="text-white">Secure patient data management</p>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 mr-4 bg-blue-500 rounded-full">
                    <span className="font-semibold text-white">✓</span>
                  </div>
                  <p className="text-white">Instant access to medical records</p>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 mr-4 bg-blue-500 rounded-full">
                    <span className="font-semibold text-white">✓</span>
                  </div>
                  <p className="text-white">Connect with healthcare providers</p>
                </div>
              </div>
              
              <div className="text-sm text-blue-200">
                <p>✓ HIPAA compliant security</p>
                <p>✓ 24/7 access to your health information</p>
                <p>✓ Easy appointment scheduling</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col justify-center p-6 bg-white sm:p-8 rounded-r-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <img src={logo} alt="logo" className="h-20 mb-4 w-38"/>
                  <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
                  <p className="mt-1 text-gray-500">
                    Sign in to your MediConnect account
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@test.com"
                      {...register("email")}
                      className={cn(
                        "text-sm transition-all duration-200 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500",
                        errors.email && "border-red-500 focus:ring-red-500"
                      )}
                      aria-invalid={!!errors.email}
                      required
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                      <Link
                        to="/reset_password"
                        className="ml-auto text-sm text-indigo-600 transition-colors duration-200 hover:text-indigo-800"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      {...register("password")}
                      className={cn(
                        "text-sm transition-all duration-200 border-gray-300 focus:ring-indigo-500 focus:border-indigo-500",
                        errors.password && "border-red-500 focus:ring-red-500"
                      )}
                      aria-invalid={!!errors.password}
                      required
                    />
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit"
                  className="w-full text-white bg-primary hover:bg-secondary transition-all duration-200 py-2.5"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </span>
                  ) : "Login"}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 text-gray-500 bg-white">New to MediConnect?</span>
                  </div>
                </div>

                <div className="text-center">
                  <Link 
                    to="/register" 
                    className="inline-block w-full py-2.5 text-sm font-medium text-primary bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors duration-200"
                  >
                    Create an account
                  </Link>
                </div>

                <div className="text-xs text-center text-gray-500">
                  By continuing, you agree to our{" "}
                  <Link to="/terms" className="text-primary hover:text-secondary">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary hover:text-secondary">
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginForm