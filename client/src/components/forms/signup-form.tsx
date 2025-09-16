import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Link, useNavigate } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { useState } from "react"
import { actAuthRegister } from "@/store/auth/authSlice"

// Schema for step 1
const step1Schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  password_confirmation: z.string().min(8, "Password confirmation must be at least 8 characters"),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords must match",
  path: ["password_confirmation"],
});

// Schema for step 2
const step2Schema = z.object({
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  city: z.string().min(1, "City is required"),
  code_postal: z.string().min(1, "Postal code is required"),
  address: z.string().min(1, "Address is required"),
  role: z.enum(["admin", "doctor", "patient"], {
    message: "Role must be either 'admin', 'doctor', or 'patient'.",
  }),
});

// Schema for step 3
const step3Schema = z.object({
  allergies: z.string().optional(),
  medical_history: z.string().optional(),
});

// Combined schema for final submission
const registerSchema = step1Schema.merge(step2Schema).merge(step3Schema);

type TFormInputs = z.infer<typeof registerSchema>;

const MultiStepRegisterForm = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading } = useAppSelector((state) => state.auth);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    trigger,
    watch,
  } = useForm<TFormInputs>({
    mode: "onBlur",
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      date_of_birth: "",
      gender: undefined,
      city: "",
      code_postal: "",
      address: "",
      allergies: "",
      medical_history: "",
      role: "patient",
    },
  });

  // Watch password field for real-time validation
  const password = watch("password");

  // Get current step fields for validation
  const getCurrentStepFields = () => {
    switch (step) {
      case 1:
        return ["name", "email", "password", "password_confirmation"];
      case 2:
        return ["date_of_birth", "gender", "city", "code_postal", "address"];
      case 3:
        return ["allergies", "medical_history"];
      default:
        return [];
    }
  };

  // Handle final registration submission
  const onSubmit = async (data: TFormInputs) => {
    // Only submit when on the final step
    if (step === 3) {
      // Validate all fields before submission
      const isFormValid = await trigger();
      if (!isFormValid) {
        toast.error("Please fix the errors before submitting");
        return;
      }

      try {
        await dispatch(actAuthRegister(data)).unwrap();
        toast.success("Registration completed successfully!");
        navigate("/email_verification");
      } catch (error) {
        console.error("Registration failed:", error);
      }
    }
  };

  const handleNext = async () => {
    const currentFields = getCurrentStepFields();
    const isCurrentStepValid = await trigger(currentFields as any);
    
    if (isCurrentStepValid) {
      setStep(step + 1);
      // Scroll to top on step change for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
      // Scroll to top on step change for better UX
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const stepTitles = ["Account Details", "Personal Information", "Medical Information"];
  const stepDescriptions = [
    "Create your MediConnect Account",
    "Complete your personal details",
    "Provide your medical information (required)",
  ];

  return (
    <div className={cn("min-h-screen w-full bg-gradient-to-br  flex items-center justify-center p-4 sm:p-6", className)} {...props}>
      <Card className="w-full max-w-lg overflow-hidden border-0 shadow-xl sm:max-w-xl md:max-w-2xl lg:max-w-4xl rounded-2xl">
        <CardContent className="grid min-h-[600px] p-0 md:grid-cols-2">
          <div className="relative hidden overflow-hidden md:block bg-muted rounded-l-2xl">
            <img
              src="https://i.pinimg.com/1200x/90/93/a7/9093a7c3e38a037331fe5695670ae01b.jpg"
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
                    <span className="font-semibold text-white">1</span>
                  </div>
                  <p className="text-white">Create your account</p>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 mr-4 bg-blue-400 rounded-full">
                    <span className="font-semibold text-white">2</span>
                  </div>
                  <p className="text-white">Complete your profile</p>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 mr-4 bg-blue-300 rounded-full">
                    <span className="font-semibold text-white">3</span>
                  </div>
                  <p className="text-white">Medical information</p>
                </div>
              </div>
              
              <div className="text-sm text-blue-200">
                <p>✓ Secure & encrypted data</p>
                <p>✓ HIPAA compliant</p>
                <p>✓ Connect with healthcare providers</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col justify-center p-6 bg-white sm:p-8 rounded-r-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col gap-6">
                {/* Step Indicator */}
               <div className="sticky top-0 z-10 pt-4 pb-2 bg-white border-b border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-semibold tracking-wide text-blue-600 uppercase">Step {step} of 4</h2>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-300",
                          step >= i ? "bg-blue-600 w-6" : "bg-gray-200 w-2"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{stepTitles[step - 1]}</h1>
                <p className="mt-1 text-gray-500">{stepDescriptions[step - 1]}</p>
              </div>

                {/* Form Fields */}
                <div className="space-y-4 animate-slide-in">
                  {step === 1 && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                        <Input
                          id="name"
                          {...register("name")}
                          placeholder="Enter your full name"
                          className={cn(errors.name ? "border-red-500 focus:ring-red-500" : "")}
                        />
                        {errors.name && (
                          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          placeholder="example@test.com"
                          className={cn(errors.email ? "border-red-500 focus:ring-red-500" : "")}
                        />
                        {errors.email && (
                          <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          className={cn(errors.password ? "border-red-500 focus:ring-red-500" : "")}
                          {...register("password")}
                        />
                        {errors.password && (
                          <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                        )}
                        {password && password.length >= 8 && (
                          <p className="mt-1 text-xs text-green-600">✓ Strong password</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                        <Input
                          id="password_confirmation"
                          type="password"
                          placeholder="Confirm your password"
                          className={cn(errors.password_confirmation ? "border-red-500 focus:ring-red-500" : "")}
                          {...register("password_confirmation")}
                        />
                        {errors.password_confirmation && (
                          <p className="mt-1 text-xs text-red-600">{errors.password_confirmation.message}</p>
                        )}
                        {password && watch("password_confirmation") && password === watch("password_confirmation") && (
                          <p className="mt-1 text-xs text-green-600">✓ Passwords match</p>
                        )}
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="date_of_birth" className="text-sm font-medium text-gray-700">Date of Birth</Label>
                          <Input
                            id="date_of_birth"
                            type="date"
                            {...register("date_of_birth")}
                            className={cn(errors.date_of_birth ? "border-red-500 focus:ring-red-500" : "")}
                          />
                          {errors.date_of_birth && (
                            <p className="mt-1 text-xs text-red-600">{errors.date_of_birth.message}</p>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender</Label>
                          <Controller
                            name="gender"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className={cn(errors.gender ? "border-red-500 focus:ring-red-500" : "")}>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors.gender && (
                            <p className="mt-1 text-xs text-red-600">{errors.gender.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="city" className="text-sm font-medium text-gray-700">City</Label>
                          <Input
                            id="city"
                            {...register("city")}
                            placeholder="Enter your city"
                            className={cn(errors.city ? "border-red-500 focus:ring-red-500" : "")}
                          />
                          {errors.city && (
                            <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="code_postal" className="text-sm font-medium text-gray-700">Postal Code</Label>
                          <Input
                            id="code_postal"
                            {...register("code_postal")}
                            placeholder="Enter postal code"
                            className={cn(errors.code_postal ? "border-red-500 focus:ring-red-500" : "")}
                          />
                          {errors.code_postal && (
                            <p className="mt-1 text-xs text-red-600">{errors.code_postal.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="address" className="text-sm font-medium text-gray-700">Address</Label>
                        <Input
                          id="address"
                          {...register("address")}
                          placeholder="Enter your full address"
                          className={cn(errors.address ? "border-red-500 focus:ring-red-500" : "")}
                        />
                        {errors.address && (
                          <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>
                        )}
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div className="p-4 border border-blue-100 rounded-lg bg-blue-50">
                        <h3 className="mb-2 font-medium text-blue-800">Required informations</h3>
                        <p className="text-sm text-blue-600">This information helps healthcare providers offer you better care.</p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="allergies" className="text-sm font-medium text-gray-700">
                          Allergies <span className="font-normal text-gray-400">(optional)</span>
                        </Label>
                        <Textarea
                          id="allergies"
                          {...register("allergies")}
                          placeholder="List any allergies you have"
                          rows={3}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="medical_history" className="text-sm font-medium text-gray-700">
                          Medical History <span className="font-normal text-gray-400">(optional)</span>
                        </Label>
                        <Textarea
                          id="medical_history"
                          {...register("medical_history")}
                          placeholder="Enter any relevant medical history, conditions, or medications"
                          rows={4}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className={cn("flex gap-3", step === 1 ? "justify-end" : "justify-between")}>
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      className="min-w-[100px]"
                    >
                      Back
                    </Button>
                  )}
                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="min-w-[100px] ml-auto"
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      disabled={loading === "pending"}
                      type="submit"
                      className="min-w-[100px] ml-auto"
                    >
                      {loading === "pending" ? "Processing..." : "Complete Registration"}
                    </Button>
                  )}
                </div>

                {step === 1 && (
                  <div className="pt-4 text-center border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      Already have an account?{" "}
                      <Link to="/login" className="font-medium text-blue-600 hover:underline">
                        Sign in
                      </Link>
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      Are you a healthcare provider?{" "}
                      <Link to="/register_doctor" className="font-medium text-blue-600 hover:underline">
                        Join as a Doctor
                      </Link>
                    </p>
                  </div>
                )}
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MultiStepRegisterForm;