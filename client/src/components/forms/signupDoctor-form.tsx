import { Check, User, Mail, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch } from "@/store/hooks"; // Added useAppSelector
import { actAuthRegister } from "@/store/auth/authSlice";
import { doctorRegisterSchema, type TFormInputs } from "@/validations/DoctorRegisterSchema";
import { Combobox } from "../ui/combobox";

const SignupDoctorForm = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formLoading, setFormLoading] = useState(false);
  const [touchedSteps, setTouchedSteps] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields, isSubmitting },
    trigger,
    watch,
    setValue,
    clearErrors,
  } = useForm<TFormInputs>({
    mode: "onBlur",
    resolver: zodResolver(doctorRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      role: "doctor",
      cabinet_option: "new",
      cabinet_name: "",
      cabinet_city: "",
      cabinet_postal_code: "",
      cabinet_address: "",
      cabinet_email: "",
      cabinet_opening_time: "",
      cabinet_closing_time: "",
      cabinet_working_days: [],
      cabinet_id: undefined,
      license_number: "",
      bio: "",
      speciality: "",
      consultation_fees: "",
      start_time: "",
      end_time: "",
      available_days: [],
    },
  });

  const cabinetWorkingDays = watch("cabinet_working_days");
  const availableDays = watch("available_days");

  useEffect(() => {
    if (!touchedSteps.includes(step)) {
      const currentFields = getCurrentStepFields();
      currentFields.forEach((field) => clearErrors(field));
    }
  }, [step, touchedSteps, clearErrors]);

  const getCurrentStepFields = (): (keyof TFormInputs)[] => {
    switch (step) {
      case 1:
        return ["name", "email", "password", "password_confirmation"];
      case 2:
        return [
          "cabinet_name",
          "cabinet_city",
          "cabinet_postal_code",
          "cabinet_address",
          "cabinet_email",
          "cabinet_opening_time",
          "cabinet_closing_time",
          "cabinet_working_days",
        ];
      case 3:
        return [
          "speciality",
          "license_number",
          "consultation_fees",
          "bio",
          "start_time",
          "end_time",
          "available_days",
        ];
      default:
        return [];
    }
  };

  const shouldShowError = (fieldName: keyof TFormInputs) => {
    return errors[fieldName] && (touchedFields[fieldName] || touchedSteps.includes(step));
  };

  const getMaxStep = () => 3;
  const isFinalStep = () => step === 3;

  const onSubmit: SubmitHandler<TFormInputs> = async (data: TFormInputs) => {
    try {
      setFormLoading(true);
      const payload: any = {
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        role: data.role,
        name: data.name,
        speciality_id: parseInt(data.speciality),
        license_number: data.license_number,
        bio: data.bio,
        consultation_fees: parseFloat(data.consultation_fees),
        start_time: data.start_time,
        end_time: data.end_time,
        available_days: data.available_days,
        cabinet_option: data.cabinet_option,
        cabinet_name: data.cabinet_name,
        cabinet_city: data.cabinet_city,
        cabinet_postal_code: data.cabinet_postal_code,
        cabinet_address: data.cabinet_address,
        cabinet_email: data.cabinet_email,
        cabinet_opening_time: data.cabinet_opening_time,
        cabinet_closing_time: data.cabinet_closing_time,
        cabinet_working_days: data.cabinet_working_days,
      };

      await dispatch(actAuthRegister(payload)).unwrap();
      toast.success("Registration successful! Please verify your email.");
      navigate("/email_verification");
    } catch (error: any) {
      console.error("Registration failed:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleNext = async () => {
    setTouchedSteps((prev) => [...new Set([...prev, step])]);
    const currentFields = getCurrentStepFields();
    const isCurrentStepValid = await trigger(currentFields);
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

  const stepTitles = [
    "Account Details",
    "Cabinet Information",
    "Professional Information",
  ];
  const stepDescriptions = [
    "Create your MediConnect Doctor Account",
    "Provide your cabinet details",
    "Complete your professional information",
  ];
  const availableDaysList = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex items-center justify-center flex-1">
          <div className="w-full max-w-lg space-y-6">
            <div>
              <h2 className="text-xs font-semibold tracking-wide uppercase text-primary">
                Step {step} of {getMaxStep()}
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
                      <User className={`absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 ${shouldShowError("name") && "left-3 top-1/3"}`} />
                      <Input
                        id="name"
                        {...register("name")}
                        placeholder="Enter your full name"
                        className={cn("pl-10", shouldShowError("name") && "border-red-500 focus:ring-red-500")}
                      />
                      {shouldShowError("name") && <p className="mt-1 text-xs text-red-600">{errors.name?.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                    <div className="relative">
                      <Mail className={`absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 ${shouldShowError("email") && "left-3 top-1/3"}`} />
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        placeholder="example@test.com"
                        className={cn("pl-10", shouldShowError("email") && "border-red-500 focus:ring-red-500")}
                      />
                      {shouldShowError("email") && <p className="mt-1 text-xs text-red-600">{errors.email?.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                    <div className="relative">
                      <Lock className={`absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 ${shouldShowError("password") && "left-3 top-1/3"}`} />
                      <Input
                        id="password"
                        type="password"
                        {...register("password")}
                        placeholder="Enter your password"
                        className={cn("pl-10", shouldShowError("password") && "border-red-500 focus:ring-red-500")}
                      />
                      {shouldShowError("password") && <p className="mt-1 text-xs text-red-600">{errors.password?.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700">Confirm Password</Label>
                    <div className="relative">
                      <Lock className={`absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 ${shouldShowError("password_confirmation") && "left-3 top-1/3"}`} />
                      <Input
                        id="password_confirmation"
                        type="password"
                        {...register("password_confirmation")}
                        placeholder="Confirm your password"
                        className={cn("pl-10", shouldShowError("password_confirmation") && "border-red-500 focus:ring-red-500")}
                      />
                      {shouldShowError("password_confirmation") && <p className="mt-1 text-xs text-red-600">{errors.password_confirmation?.message}</p>}
                    </div>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cabinet_name" className="text-sm font-medium text-gray-700">Cabinet Name</Label>
                    <Input
                      id="cabinet_name"
                      {...register("cabinet_name")}
                      placeholder="Enter your cabinet name"
                      className={cn(shouldShowError("cabinet_name") && "border-red-500 focus:ring-red-500")}
                    />
                    {shouldShowError("cabinet_name") && <p className="mt-1 text-xs text-red-600">{errors.cabinet_name?.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cabinet_city" className="text-sm font-medium text-gray-700">City</Label>
                      <Input
                        id="cabinet_city"
                        {...register("cabinet_city")}
                        placeholder="Enter your city"
                        className={cn(shouldShowError("cabinet_city") && "border-red-500 focus:ring-red-500")}
                      />
                      {shouldShowError("cabinet_city") && <p className="mt-1 text-xs text-red-600">{errors.cabinet_city?.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cabinet_postal_code" className="text-sm font-medium text-gray-700">Postal Code</Label>
                      <Input
                        id="cabinet_postal_code"
                        {...register("cabinet_postal_code")}
                        placeholder="Enter postal code"
                        className={cn(shouldShowError("cabinet_postal_code") && "border-red-500 focus:ring-red-500")}
                      />
                      {shouldShowError("cabinet_postal_code") && <p className="mt-1 text-xs text-red-600">{errors.cabinet_postal_code?.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cabinet_address" className="text-sm font-medium text-gray-700">Address</Label>
                    <Input
                      id="cabinet_address"
                      {...register("cabinet_address")}
                      placeholder="Enter your cabinet address"
                      className={cn(shouldShowError("cabinet_address") && "border-red-500 focus:ring-red-500")}
                    />
                    {shouldShowError("cabinet_address") && <p className="mt-1 text-xs text-red-600">{errors.cabinet_address?.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cabinet_email" className="text-sm font-medium text-gray-700">Cabinet Email</Label>
                    <div className="relative">
                      <Mail className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                      <Input
                        id="cabinet_email"
                        type="email"
                        {...register("cabinet_email")}
                        placeholder="Enter cabinet email"
                        className={cn("pl-10", shouldShowError("cabinet_email") && "border-red-500 focus:ring-red-500")}
                      />
                      {shouldShowError("cabinet_email") && <p className="mt-1 text-xs text-red-600">{errors.cabinet_email?.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cabinet_opening_time" className="text-sm font-medium text-gray-700">Opening Time</Label>
                      <Input
                        id="cabinet_opening_time"
                        type="time"
                        {...register("cabinet_opening_time")}
                        className={cn(shouldShowError("cabinet_opening_time") && "border-red-500 focus:ring-red-500")}
                      />
                      {shouldShowError("cabinet_opening_time") && <p className="mt-1 text-xs text-red-600">{errors.cabinet_opening_time?.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cabinet_closing_time" className="text-sm font-medium text-gray-700">Closing Time</Label>
                      <Input
                        id="cabinet_closing_time"
                        type="time"
                        {...register("cabinet_closing_time")}
                        className={cn(shouldShowError("cabinet_closing_time") && "border-red-500 focus:ring-red-500")}
                      />
                      {shouldShowError("cabinet_closing_time") && <p className="mt-1 text-xs text-red-600">{errors.cabinet_closing_time?.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cabinet_working_days" className="text-sm font-medium text-gray-700">Cabinet Working Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableDaysList.map((day) => {
                        const isSelected = cabinetWorkingDays?.includes(day) || false;
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const currentDays = cabinetWorkingDays || [];
                              if (isSelected) {
                                setValue("cabinet_working_days", currentDays.filter((d) => d !== day));
                              } else {
                                setValue("cabinet_working_days", [...currentDays, day]);
                              }
                            }}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1 rounded-full border text-sm font-medium transition-colors",
                              isSelected
                                ? "bg-green-100 border-green-400 text-green-800"
                                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            {isSelected ? <Check className="w-4 h-4" /> : day}
                          </button>
                        );
                      })}
                    </div>
                    {shouldShowError("cabinet_working_days") && <p className="mt-1 text-xs text-red-600">{errors.cabinet_working_days?.message}</p>}
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="speciality" className="text-sm font-medium text-gray-700">Medical Specialty</Label>
                    <Combobox
                      value={parseInt(watch("speciality")) || undefined} // Convert string to number for Combobox
                      onValueChange={(label, id) => {
                        setValue("speciality", id?.toString() || ""); // Set the id as a string
                        if (id) clearErrors("speciality"); // Clear errors when a valid id is selected
                      }}
                      placeholder="Select your medical specialty"
                      className={cn(shouldShowError("speciality") && "border-red-500 focus:ring-red-500")}
                    />
                    {shouldShowError("speciality") && <p className="mt-1 text-xs text-red-600">{errors.speciality?.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="license_number" className="text-sm font-medium text-gray-700">License Number</Label>
                    <Input
                      id="license_number"
                      {...register("license_number")}
                      placeholder="Enter your license number"
                      className={cn(shouldShowError("license_number") && "border-red-500 focus:ring-red-500")}
                    />
                    {shouldShowError("license_number") && <p className="mt-1 text-xs text-red-600">{errors.license_number?.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consultation_fees" className="text-sm font-medium text-gray-700">Consultation Fees</Label>
                    <Input
                      id="consultation_fees"
                      type="text"
                      {...register("consultation_fees")}
                      placeholder="Enter consultation fees"
                      className={cn(shouldShowError("consultation_fees") && "border-red-500 focus:ring-red-500")}
                    />
                    {shouldShowError("consultation_fees") && <p className="mt-1 text-xs text-red-600">{errors.consultation_fees?.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-medium text-gray-700">Bio</Label>
                    <Textarea
                      id="bio"
                      {...register("bio")}
                      placeholder="Tell us about your professional background and experience"
                      rows={4}
                      className={cn(shouldShowError("bio") && "border-red-500 focus:ring-red-500")}
                    />
                    {shouldShowError("bio") && <p className="mt-1 text-xs text-red-600">{errors.bio?.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time" className="text-sm font-medium text-gray-700">Start Time</Label>
                      <Input
                        id="start_time"
                        type="time"
                        {...register("start_time")}
                        className={cn(shouldShowError("start_time") && "border-red-500 focus:ring-red-500")}
                      />
                      {shouldShowError("start_time") && <p className="mt-1 text-xs text-red-600">{errors.start_time?.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_time" className="text-sm font-medium text-gray-700">End Time</Label>
                      <Input
                        id="end_time"
                        type="time"
                        {...register("end_time")}
                        className={cn(shouldShowError("end_time") && "border-red-500 focus:ring-red-500")}
                      />
                      {shouldShowError("end_time") && <p className="mt-1 text-xs text-red-600">{errors.end_time?.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="available_days" className="text-sm font-medium text-gray-700">Doctor Working Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableDaysList.map((day) => {
                        const isSelected = availableDays?.includes(day) || false;
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              const currentDays = availableDays || [];
                              if (isSelected) {
                                setValue("available_days", currentDays.filter((d) => d !== day));
                              } else {
                                setValue("available_days", [...currentDays, day]);
                              }
                            }}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1 rounded-full border text-sm font-medium transition-colors",
                              isSelected
                                ? "bg-green-100 border-green-400 text-green-800"
                                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            {isSelected ? <Check className="w-4 h-4" /> : day}
                          </button>
                        );
                      })}
                    </div>
                    {shouldShowError("available_days") && <p className="mt-1 text-xs text-red-600">{errors.available_days?.message}</p>}
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
                    Are you a patient?{" "}
                    <Link to="/register" className="font-medium text-primary hover:underline">
                      Register as a Patient
                    </Link>
                  </p>
                </div>
              )}
              <div className={cn("flex gap-3", step === 1 ? "justify-end" : "justify-between")}>
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={handlePrevious} className="min-w-[100px]">
                    Back
                  </Button>
                )}
                {!isFinalStep() ? (
                  <Button type="button" onClick={handleNext} className="min-w-[100px] ml-auto">
                    Continue
                  </Button>
                ) : (
                  <Button
                    disabled={formLoading || isSubmitting}
                    type="submit"
                    className="min-w-[100px] ml-auto"
                  >
                    {formLoading ? (
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
          src="https://i.pinimg.com/736x/10/1d/e2/101de229426d72010e7bbb7574b33d07.jpg"
          alt="Medical professionals"
          className="absolute inset-0 object-cover w-full h-full rounded-xl"
        />
      </div>
    </div>
  );
};

export default SignupDoctorForm;