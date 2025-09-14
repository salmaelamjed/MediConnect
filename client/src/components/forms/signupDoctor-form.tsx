import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch } from "@/store/hooks";
import { actAuthRegister } from "@/store/auth/authSlice";
import { doctorRegisterSchema, type TFormInputs } from "@/validations/DoctorRegisterSchema";
import { Check } from "lucide-react";

const SignupDoctorForm = ({ className, ...props }: React.ComponentProps<"div">) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    setValue,
  } = useForm<TFormInputs>({
    mode: "onBlur",
    resolver: zodResolver(doctorRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      role: "doctor" as const,
      cabinet_name: "",
      cabinet_city: "",
      cabinet_postal_code: "",
      cabinet_address: "",
      license_number: "",
      bio: "",
      specialite: "",
      heure_ouverture: "",
      heure_fermeture: "",
      jours_travail: [],
      consultation_fees: "",
    },
  });

  // Watch password and jours_travail fields for real-time validation
  const password = watch("password");
  const joursTravail = watch("jours_travail");

  // Get current step fields for validation
  const getCurrentStepFields = (): (keyof TFormInputs)[] => {
    switch (step) {
      case 1:
        return ["name", "email", "password", "password_confirmation"];
      case 2:
        return ["cabinet_name", "cabinet_city", "cabinet_postal_code", "cabinet_address", "heure_ouverture", "heure_fermeture"];
      case 3:
        return ["license_number", "specialite", "jours_travail", "consultation_fees", "bio"];
      default:
        return [];
    }
  };

  // Handle final registration submission
  const onSubmit: SubmitHandler<TFormInputs> = async (data: TFormInputs) => {
    try {
      setLoading(true);
      // Dispatch the registration action
      await dispatch(actAuthRegister(data)).unwrap();
      toast.success("Registration successful! Please verify your email.");
      navigate("/email_verification");
    } catch (error: any) {
      console.error("Registration failed:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const currentFields = getCurrentStepFields();
    const isCurrentStepValid = await trigger(currentFields);

    if (isCurrentStepValid) {
      setStep(step + 1);
      // Scroll to top on step change for better UX
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const stepTitles = ["Account Details", "Cabinet Information", "Professional Information"];
  const stepDescriptions = [
    "Create your MediConnect Doctor Account",
    "Provide your cabinet details",
    "Complete your professional information",
  ];

  // Available days for jours_travail
  const availableDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className={cn("min-h-screen w-full flex items-center justify-center p-4 sm:p-6", className)} {...props}>
      <Card className="w-full max-w-lg overflow-hidden border-0 shadow-xl sm:max-w-xl md:max-w-2xl lg:max-w-4xl rounded-2xl">
        <CardContent className="grid min-h-[600px] p-0 md:grid-cols-2">
          <div className="relative hidden overflow-hidden md:block bg-muted rounded-l-2xl">
            <img
              src="https://i.pinimg.com/736x/92/eb/b8/92ebb8868a7d96bb48184758f0a76e9f.jpg"
              alt="Medical professionals"
              className="absolute inset-0 object-cover w-full h-full"
            />
            <div className="absolute inset-0 flex flex-col justify-between p-8 bg-gradient-to-b from-blue-900/80 to-blue-800/60">
              <div>
                <h1 className="mb-2 text-3xl font-bold text-white">MediConnect</h1>
                <p className="text-blue-100">For Healthcare Professionals</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 mr-4 bg-blue-500 rounded-full">
                    <span className="font-semibold text-white">1</span>
                  </div>
                  <p className="text-white">Create your doctor account</p>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 mr-4 bg-blue-400 rounded-full">
                    <span className="font-semibold text-white">2</span>
                  </div>
                  <p className="text-white">Cabinet information</p>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 mr-4 bg-blue-300 rounded-full">
                    <span className="font-semibold text-white">3</span>
                  </div>
                  <p className="text-white">Professional details</p>
                </div>
              </div>

              <div className="text-sm text-blue-200">
                <p>✓ Connect with patients</p>
                <p>✓ Manage your schedule</p>
                <p>✓ Access medical records securely</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center p-6 bg-white sm:p-8 rounded-r-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col gap-6">
                {/* Step Indicator */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs font-semibold tracking-wide text-blue-600 uppercase">Step {step} of 3</h2>
                    <div className="flex space-x-1">
                      {[1, 2, 3].map((i) => (
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
                        <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          {...register("name")}
                          placeholder="Enter your full name"
                          className={cn(errors.name ? "border-red-500 focus:ring-red-500" : "")}
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          placeholder="example@test.com"
                          className={cn(errors.email ? "border-red-500 focus:ring-red-500" : "")}
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                          Password
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          className={cn(errors.password ? "border-red-500 focus:ring-red-500" : "")}
                          {...register("password")}
                        />
                        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                        {password && password.length >= 8 && (
                          <p className="mt-1 text-xs text-green-600">✓ Strong password</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700">
                          Confirm Password
                        </Label>
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
                        {password &&
                          watch("password_confirmation") &&
                          password === watch("password_confirmation") && (
                            <p className="mt-1 text-xs text-green-600">✓ Passwords match</p>
                          )}
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="cabinet_name" className="text-sm font-medium text-gray-700">
                          Cabinet Name
                        </Label>
                        <Input
                          id="cabinet_name"
                          {...register("cabinet_name")}
                          placeholder="Enter your cabinet name"
                          className={cn(errors.cabinet_name ? "border-red-500 focus:ring-red-500" : "")}
                        />
                        {errors.cabinet_name && (
                          <p className="mt-1 text-xs text-red-600">{errors.cabinet_name.message}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="cabinet_city" className="text-sm font-medium text-gray-700">
                            City
                          </Label>
                          <Input
                            id="cabinet_city"
                            {...register("cabinet_city")}
                            placeholder="Enter your city"
                            className={cn(errors.cabinet_city ? "border-red-500 focus:ring-red-500" : "")}
                          />
                          {errors.cabinet_city && (
                            <p className="mt-1 text-xs text-red-600">{errors.cabinet_city.message}</p>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="cabinet_postal_code" className="text-sm font-medium text-gray-700">
                            Postal Code
                          </Label>
                          <Input
                            id="cabinet_postal_code"
                            {...register("cabinet_postal_code")}
                            placeholder="Enter postal code"
                            className={cn(errors.cabinet_postal_code ? "border-red-500 focus:ring-red-500" : "")}
                          />
                          {errors.cabinet_postal_code && (
                            <p className="mt-1 text-xs text-red-600">{errors.cabinet_postal_code.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cabinet_address" className="text-sm font-medium text-gray-700">
                          Address
                        </Label>
                        <Input
                          id="cabinet_address"
                          {...register("cabinet_address")}
                          placeholder="Enter your cabinet address"
                          className={cn(errors.cabinet_address ? "border-red-500 focus:ring-red-500" : "")}
                        />
                        {errors.cabinet_address && (
                          <p className="mt-1 text-xs text-red-600">{errors.cabinet_address.message}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="heure_ouverture" className="text-sm font-medium text-gray-700">
                            Opening Time
                          </Label>
                          <Input
                            id="heure_ouverture"
                            type="time"
                            {...register("heure_ouverture")}
                            className={cn(errors.heure_ouverture ? "border-red-500 focus:ring-red-500" : "")}
                          />
                          {errors.heure_ouverture && (
                            <p className="mt-1 text-xs text-red-600">{errors.heure_ouverture.message}</p>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="heure_fermeture" className="text-sm font-medium text-gray-700">
                            Closing Time
                          </Label>
                          <Input
                            id="heure_fermeture"
                            type="time"
                            {...register("heure_fermeture")}
                            className={cn(errors.heure_fermeture ? "border-red-500 " : "")}
                          />
                          {errors.heure_fermeture && (
                            <p className="mt-1 text-xs text-red-600">{errors.heure_fermeture.message}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="specialite" className="text-sm font-medium text-gray-700">
                          Specialty
                        </Label>
                        <Input
                          id="specialite"
                          {...register("specialite")}
                          placeholder="Enter your specialty"
                          className={cn(errors.specialite ? "border-red-500 focus:ring-red-500" : "")}
                        />
                        {errors.specialite && (
                          <p className="mt-1 text-xs text-red-600">{errors.specialite.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="jours_travail" className="text-sm font-medium text-gray-700">
                          Working Days
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {availableDays.map((day) => {
                            const isSelected = joursTravail?.includes(day) || false;
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  const currentDays = joursTravail || [];
                                  if (isSelected) {
                                    setValue("jours_travail", currentDays.filter((d) => d !== day));
                                  } else {
                                    setValue("jours_travail", [...currentDays, day]);
                                  }
                                }}
                                className={cn(
                                  "flex items-center gap-2 px-2 py-2 rounded-full border text-sm font-medium transition-colors",
                                  "hover:shadow-sm focus:outline-none  focus:ring-primary focus:ring-offset-1",
                                  isSelected
                                    ? "bg-green-100 border-green-400 text-green-800 gap-2 px-3 py-2"
                                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                )}
                                aria-pressed={isSelected}
                              >
                                {isSelected ? <Check className="w-4 h-4" /> : day}
                                
                              </button>
                            );
                          })}
                        </div>
                        {joursTravail && joursTravail.length > 0 && (
                          <p className="mt-1 text-xs text-green-600">Selected: {joursTravail.join(", ")}</p>
                        )}
                        {errors.jours_travail && (
                          <p className="mt-1 text-xs text-red-600">{errors.jours_travail.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="license_number" className="text-sm font-medium text-gray-700">
                          License Number
                        </Label>
                        <Input
                          id="license_number"
                          {...register("license_number")}
                          placeholder="Enter your license number"
                          className={cn(errors.license_number ? "border-red-500 focus:ring-red-500" : "")}
                        />
                        {errors.license_number && (
                          <p className="mt-1 text-xs text-red-600">{errors.license_number.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="consultation_fees" className="text-sm font-medium text-gray-700">
                          Consultation Fees
                        </Label>
                        <Input
                          id="consultation_fees"
                          type="text"
                          {...register("consultation_fees")}
                          placeholder="Enter consultation fees"
                          className={cn(errors.consultation_fees ? "border-red-500 focus:ring-red-500" : "")}
                        />
                        {errors.consultation_fees && (
                          <p className="mt-1 text-xs text-red-600">{errors.consultation_fees.message}</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
                          Bio
                        </Label>
                        <Textarea
                          id="bio"
                          {...register("bio")}
                          placeholder="Tell us about your professional background and experience"
                          rows={4}
                          className={cn(errors.bio ? "border-red-500 focus:ring-red-500" : "")}
                        />
                        {errors.bio && <p className="mt-1 text-xs text-red-600">{errors.bio.message}</p>}
                      </div>
                    </>
                  )}
                </div>

                <div className={cn("flex gap-3", step === 1 ? "justify-end" : "justify-between")}>
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={handlePrevious} className="min-w-[100px]">
                      Back
                    </Button>
                  )}
                  {step < 3 ? (
                    <Button type="button" onClick={handleNext} className="min-w-[100px] ml-auto">
                      Continue
                    </Button>
                  ) : (
                    <Button disabled={loading} type="submit" className="min-w-[100px] ml-auto">
                      {loading ? (
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

                {step === 1 && (
                  <div className="pt-4 text-center border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      Already have an account?{" "}
                      <Link to="/login" className="font-medium text-blue-600 hover:underline">
                        Sign in
                      </Link>
                    </p>
                    <p className="mt-2 text-sm text-gray-600">
                      Are you a patient?{" "}
                      <Link to="/register" className="font-medium text-blue-600 hover:underline">
                        Register as a Patient
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

export default SignupDoctorForm;