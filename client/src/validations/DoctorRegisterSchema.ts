import { z } from "zod";

const doctorRegisterSchema = z
  .object({
    email: z.string().email({
      message: "Please enter a valid email address.",
    }),
    password: z
      .string()
      .min(8, {
        message: "Password must be at least 8 characters long.",
      })
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
          message:
            "Password must include at least one uppercase letter, one lowercase letter, one digit, and one special character.",
        }
      ),
    password_confirmation: z.string().min(1, {
      message: "Password confirmation is required.",
    }),
    role: z.literal("doctor", {
      message: "Role must be 'doctor' for this form.",
    }),
    name: z.string().min(1, {
      message: "Name is required.",
    }),
    speciality: z.string().min(1, {
      message: "Specialty ID is required.",
    }),
    license_number: z.string().min(1, {
      message: "License number is required.",
    }),
    bio: z.string().optional(),
    cabinet_option: z.enum(["new", "existing"], {
      message: "Cabinet option must be 'new' or 'existing'.",
    }),
    cabinet_id: z.number().optional(),
    cabinet_name: z.string().optional(),
    cabinet_address: z.string().optional(),
    cabinet_city: z.string().optional(),
    cabinet_postal_code: z.string().optional(),
    cabinet_email: z
      .string()
      .email({ message: "Invalid cabinet email." })
      .optional(),
    cabinet_opening_time: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
        message: "Opening time must be in HH:mm format.",
      })
      .optional(),
    cabinet_closing_time: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
        message: "Closing time must be in HH:mm format.",
      })
      .optional(),
    cabinet_working_days: z.array(z.string()).optional(),
    consultation_fees: z.string().min(1, {
      message: "Consultation fees are required.",
    }),
    start_time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
      message: "Start time must be in HH:mm format.",
    }),
    end_time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
      message: "End time must be in HH:mm format.",
    }),
    available_days: z.array(z.string()).min(1, {
      message: "At least one working day is required.",
    }),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  })
  .refine(
    (data) =>
      data.cabinet_option === "new"
        ? data.cabinet_name &&
          data.cabinet_address &&
          data.cabinet_city &&
          data.cabinet_postal_code &&
          data.cabinet_email &&
          data.cabinet_opening_time &&
          data.cabinet_closing_time &&
          data.cabinet_working_days &&
          data.cabinet_working_days.length > 0
        : true,
    {
      message: "All cabinet fields are required when creating a new cabinet.",
      path: ["cabinet_name"],
    }
  )
  .refine(
    (data) => (data.cabinet_option === "existing" ? !!data.cabinet_id : true),
    {
      message: "Cabinet ID is required when joining an existing cabinet.",
      path: ["cabinet_id"],
    }
  );

type TFormInputs = z.infer<typeof doctorRegisterSchema>;

export { doctorRegisterSchema };
export type { TFormInputs };
