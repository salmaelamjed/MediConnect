import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useAppDispatch } from "@/store/hooks";
import { actAuthRegister } from "@/store/auth/authSlice";
import { doctorRegisterSchema, type TFormInputs } from "@/validations/DoctorRegisterSchema";
import { Check } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SignupDoctorForm = ({ className, ...props }: React.ComponentProps<"div">) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cabinets, setCabinets] = useState<{ id: number; name: string }[]>([]);

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

  // Watch fields for real-time validation
  const password = watch("password");
  const cabinetWorkingDays = watch("cabinet_working_days");
  const availableDays = watch("available_days");
  const cabinetOption = watch("cabinet_option");
  const speciality = watch("speciality");

  // Fetch cabinets when speciality changes
  useEffect(() => {
    if (step === 2 && cabinetOption === "existing" && speciality) {
      const fetchCabinets = async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/cabinets-by-speciality`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ speciality_id: parseInt(speciality) }),
          });
          const data = await response.json();
          if (response.ok) {
            setCabinets(data.cabinets || []);
          } else {
            toast.error(data.message || "Failed to fetch cabinets");
          }
        } catch (error) {
          toast.error("Error fetching cabinets",error as any);
        }
      };
      fetchCabinets();
    }
  }, [step, cabinetOption, speciality]);

  // Get current step fields for validation
  const getCurrentStepFields = (): (keyof TFormInputs)[] => {
    switch (step) {
      case 1:
        return ["name", "email", "password", "password_confirmation"];
      case 2:
        return ["cabinet_option", "cabinet_id"];
      case 3:
        return cabinetOption === "new"
          ? [
              "cabinet_name",
              "cabinet_city",
              "cabinet_postal_code",
              "cabinet_address",
              "cabinet_email",
              "cabinet_opening_time",
              "cabinet_closing_time",
              "cabinet_working_days",
            ]
          : [];
      case 4:
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

  // Handle final registration submission
  const onSubmit: SubmitHandler<TFormInputs> = async (data: TFormInputs) => {
    try {
      setLoading(true);
      // Map form data to backend expected fields
      const payload = {
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
        ...(data.cabinet_option === "new"
          ? {
              cabinet_name: data.cabinet_name,
              cabinet_city: data.cabinet_city,
              cabinet_postal_code: data.cabinet_postal_code,
              cabinet_address: data.cabinet_address,
              cabinet_email: data.cabinet_email,
              cabinet_opening_time: data.cabinet_opening_time,
              cabinet_closing_time: data.cabinet_closing_time,
              cabinet_working_days: data.cabinet_working_days,
            }
          : { cabinet_id: data.cabinet_id }),
      };
      await dispatch(actAuthRegister(payload)).unwrap();
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
    "Cabinet Selection",
    "Cabinet Information",
    "Professional Information",
  ];
  const stepDescriptions = [
    "Create your MediConnect Doctor Account",
    "Choose your cabinet option",
    "Provide your cabinet details",
    "Complete your professional information",
  ];

  const availableDaysList = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

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
                  <p className="text-white">Cabinet selection</p>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 mr-4 bg-blue-300 rounded-full">
                    <span className="font-semibold text-white">3</span>
                  </div>
                  <p className="text-white">Cabinet information</p>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 mr-4 bg-blue-200 rounded-full">
                    <span className="font-semibold text-white">4</span>
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
                        <Label className="text-sm font-medium text-gray-700">Cabinet Option</Label>
                        <RadioGroup
                          value={cabinetOption}
                          onValueChange={(value) => setValue("cabinet_option", value as "new" | "existing")}
                          className="flex flex-col gap-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="new" id="new" />
                            <Label htmlFor="new">Create a new cabinet</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="existing" id="existing" />
                            <Label htmlFor="existing">Join an existing cabinet</Label>
                          </div>
                        </RadioGroup>
                        {errors.cabinet_option && (
                          <p className="mt-1 text-xs text-red-600">{errors.cabinet_option.message}</p>
                        )}
                      </div>
                      {cabinetOption === "existing" && (
                        <div className="grid gap-2">
                          <Label htmlFor="cabinet_id" className="text-sm font-medium text-gray-700">
                            Select Cabinet
                          </Label>
                          <Select
                            onValueChange={(value) => setValue("cabinet_id", parseInt(value))}
                            disabled={!cabinets.length}
                          >
                            <SelectTrigger
                              className={cn(errors.cabinet_id ? "border-red-500 focus:ring-red-500" : "")}
                            >
                              <SelectValue placeholder="Select a cabinet" />
                            </SelectTrigger>
                            <SelectContent>
                              {cabinets.map((cabinet) => (
                                <SelectItem key={cabinet.id} value={cabinet.id.toString()}>
                                  {cabinet.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.cabinet_id && (
                            <p className="mt-1 text-xs text-red-600">{errors.cabinet_id.message}</p>
                          )}
                          {!cabinets.length && (
                            <p className="mt-1 text-xs text-gray-500">
                              No cabinets available for the selected specialty. Please select a specialty first or create a new cabinet.
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {step === 3 && cabinetOption === "new" && (
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
                      <div className="grid gap-2">
                        <Label htmlFor="cabinet_email" className="text-sm font-medium text-gray-700">
                          Cabinet Email
                        </Label>
                        <Input
                          id="cabinet_email"
                          type="email"
                          {...register("cabinet_email")}
                          placeholder="Enter cabinet email"
                          className={cn(errors.cabinet_email ? "border-red-500 focus:ring-red-500" : "")}
                        />
                        {errors.cabinet_email && (
                          <p className="mt-1 text-xs text-red-600">{errors.cabinet_email.message}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="cabinet_opening_time" className="text-sm font-medium text-gray-700">
                            Opening Time
                          </Label>
                          <Input
                            id="cabinet_opening_time"
                            type="time"
                            {...register("cabinet_opening_time")}
                            className={cn(errors.cabinet_opening_time ? "border-red-500 focus:ring-red-500" : "")}
                          />
                          {errors.cabinet_opening_time && (
                            <p className="mt-1 text-xs text-red-600">{errors.cabinet_opening_time.message}</p>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="cabinet_closing_time" className="text-sm font-medium text-gray-700">
                            Closing Time
                          </Label>
                          <Input
                            id="cabinet_closing_time"
                            type="time"
                            {...register("cabinet_closing_time")}
                            className={cn(errors.cabinet_closing_time ? "border-red-500 focus:ring-red-500" : "")}
                          />
                          {errors.cabinet_closing_time && (
                            <p className="mt-1 text-xs text-red-600">{errors.cabinet_closing_time.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="cabinet_working_days" className="text-sm font-medium text-gray-700">
                          Cabinet Working Days
                        </Label>
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
                                  "flex items-center gap-2 px-2 py-2 rounded-full border text-sm font-medium transition-colors",
                                  "hover:shadow-sm focus:outline-none focus:ring-primary focus:ring-offset-1",
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
                        {cabinetWorkingDays && cabinetWorkingDays.length > 0 && (
                          <p className="mt-1 text-xs text-green-600">Selected: {cabinetWorkingDays.join(", ")}</p>
                        )}
                        {errors.cabinet_working_days && (
                          <p className="mt-1 text-xs text-red-600">{errors.cabinet_working_days.message}</p>
                        )}
                      </div>
                    </>
                  )}

                  {step === 4 && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="speciality" className="text-sm font-medium text-gray-700">
                          Specialty ID
                        </Label>
                        <Input
                          id="speciality"
                          type="text"
                          {...register("speciality")}
                          placeholder="Enter your specialty ID (e.g., 1 for Cardiology)"
                          className={cn(errors.speciality ? "border-red-500 focus:ring-red-500" : "")}
                        />
                        {errors.speciality && (
                          <p className="mt-1 text-xs text-red-600">{errors.speciality.message}</p>
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="start_time" className="text-sm font-medium text-gray-700">
                            Start Time
                          </Label>
                          <Input
                            id="start_time"
                            type="time"
                            {...register("start_time")}
                            className={cn(errors.start_time ? "border-red-500 focus:ring-red-500" : "")}
                          />
                          {errors.start_time && (
                            <p className="mt-1 text-xs text-red-600">{errors.start_time.message}</p>
                          )}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="end_time" className="text-sm font-medium text-gray-700">
                            End Time
                          </Label>
                          <Input
                            id="end_time"
                            type="time"
                            {...register("end_time")}
                            className={cn(errors.end_time ? "border-red-500 focus:ring-red-500" : "")}
                          />
                          {errors.end_time && (
                            <p className="mt-1 text-xs text-red-600">{errors.end_time.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="available_days" className="text-sm font-medium text-gray-700">
                          Doctor Working Days
                        </Label>
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
                                  "flex items-center gap-2 px-2 py-2 rounded-full border text-sm font-medium transition-colors",
                                  "hover:shadow-sm focus:outline-none focus:ring-primary focus:ring-offset-1",
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
                        {availableDays && availableDays.length > 0 && (
                          <p className="mt-1 text-xs text-green-600">Selected: {availableDays.join(", ")}</p>
                        )}
                        {errors.available_days && (
                          <p className="mt-1 text-xs text-red-600">{errors.available_days.message}</p>
                        )}
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
                  {step < 4 ? (
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