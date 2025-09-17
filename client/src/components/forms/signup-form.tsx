import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { Calendar, Home, Lock, Mail, User } from "lucide-react"

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

export default function MultiStepRegisterForm() {
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

  const onSubmit = async (data: TFormInputs) => {
    if (step === 3) {
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
        toast.error("Registration failed. Please try again.");
      }
    }
  };

  const handleNext = async () => {
    const currentFields = getCurrentStepFields();
    const isCurrentStepValid = await trigger(currentFields as any);
    if (isCurrentStepValid) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const stepTitles = ["Account Details", "Personal Information", "Medical Information"];
  const stepDescriptions = [
    "Create your MediConnect Account",
    "Complete your personal details",
    "Provide your medical information (required)",
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex items-center justify-center flex-1">
          <div className="w-full max-w-lg space-y-6">
            <div>
              <h2 className="text-xs font-semibold tracking-wide uppercase text-primary">
                Step {step} of 3
              </h2>
              <h1 className="text-2xl font-bold text-gray-900">{stepTitles[step - 1]}</h1>
              <p className="mt-1 text-gray-500">{stepDescriptions[step - 1]}</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
                  <div className="relative">
                    <User className={`absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 ${errors.name && "left-3 top-1/3"}`} />
                      <Input
                      id="name"
                      {...register("name")}
                      placeholder="Enter your full name"
                      className={cn("pl-10",errors.name && "border-red-500 focus:ring-red-500")}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                  </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                    <div className="relative">
                      <Mail className={`absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 ${ errors.email && "left-3 top-1/3"}`}/>
                      <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="example@test.com"
                      className={cn("pl-10",errors.email && "border-red-500 focus:ring-red-500")}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                    <div className="relative">
                      <Lock className={`absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 ${ errors.password && "left-3 top-1/3"}`}/>
                      <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      {...register("password")}
                      className={cn("pl-10",errors.password && "border-red-500 focus:ring-red-500")}
                    />
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                    
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                    <div className="relative">
                      <Lock className={`absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 ${ errors.password_confirmation && "left-3 top-1/3"}`}/>
                      <Input
                      id="password_confirmation"
                      type="password"
                      placeholder="Confirm your password"
                      {...register("password_confirmation")}
                      className={cn("pl-10",errors.password_confirmation && "border-red-500 focus:ring-red-500")}
                    />
                    {errors.password_confirmation && (
                      <p className="mt-1 text-xs text-red-600">{errors.password_confirmation.message}</p>
                    )}
                    </div>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth" className="text-sm font-medium text-gray-700">Date of Birth</Label>
                       <div className="relative">
                      <Calendar className={`absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 ${errors.date_of_birth && "left-3 top-1/3"}`} />
                         <Input
                        id="date_of_birth"
                        type="date"
                        {...register("date_of_birth")}
                        className={cn("pl-10",errors.date_of_birth && "border-red-500 focus:ring-red-500")}
                      />
                      {errors.date_of_birth && <p className="mt-1 text-xs text-red-600">{errors.date_of_birth.message}</p>}
                       </div>
                     
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-sm font-medium text-gray-700">Gender</Label>
                      <Controller
                        name="gender"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className={cn("pl-10",errors.gender && "border-red-500 focus:ring-red-500")}>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium text-gray-700">City</Label>
                      <div className="relative">
                      <Home className={`absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 ${ errors.city && "left-3 top-1/3"}`}/>
                        <Input
                        id="city"
                        {...register("city")}
                        placeholder="Enter your city"
                        className={cn("pl-10",errors.city && "border-red-500 focus:ring-red-500")}
                      />
                      {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code_postal" className="text-sm font-medium text-gray-700">Postal Code</Label>
                      <div className="relative">
                        <Input
                        id="code_postal"
                        {...register("code_postal")}
                        placeholder="Enter postal code"
                        className={cn("pl-10",errors.code_postal && "border-red-500 focus:ring-red-500")}
                      />
                      {errors.code_postal && <p className="mt-1 text-xs text-red-600">{errors.code_postal.message}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">Address</Label>
                   <div className="relative">
                     <Input
                      id="address"
                      {...register("address")}
                      placeholder="Enter your full address"
                      className={cn("pl-10",errors.address && "border-red-500 focus:ring-red-500")}
                    />
                    {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address.message}</p>}
                   </div>
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="allergies" className="text-sm font-medium text-gray-700">
                      Allergies <span className="font-normal text-gray-400">(optional)</span>
                    </Label>
                    <Textarea
                      id="allergies"
                      {...register("allergies")}
                      placeholder="List any allergies you have"
                      rows={3}
                      className={cn(errors.allergies && "border-red-500 focus:ring-red-500")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medical_history" className="text-sm font-medium text-gray-700">
                      Medical History <span className="font-normal text-gray-400">(optional)</span>
                    </Label>
                    <Textarea
                      id="medical_history"
                      {...register("medical_history")}
                      placeholder="Enter any relevant medical history, conditions, or medications"
                      rows={4}
                      className={cn("pl-10",errors.medical_history && "border-red-500 focus:ring-red-500")}
                    />
                  </div>
                </>
              )}
              {step === 1 && (
                <div className="space-y-2 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link to="/login" className="font-medium text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                  <p className="text-sm text-gray-600">
                    Are you a healthcare provider?{" "}
                    <Link to="/register_doctor" className="font-medium text-primary hover:underline">
                      Join as a Doctor
                    </Link>
                  </p>
                </div>
              )}
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
                    {loading === "pending" ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="w-4 h-4 mr-2 -ml-1 text-white animate-spin"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="https://i.pinimg.com/1200x/85/f0/43/85f0431e0eb1040f3046ac32c2ef2dbe.jpg"
          alt="Medical professionals"
          className="absolute inset-0 object-cover w-full h-full rounded-xl"
        />
      </div>
    </div>
  );
}