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
    specialite: z.string().min(1, {
      message: "Specialty is required.",
    }),
    license_number: z.string().min(1, {
      message: "License number is required.",
    }),
    bio: z.string().optional(), // Bio is nullable in the database
    cabinet_name: z.string().min(1, {
      message: "Cabinet name is required.",
    }),
    cabinet_address: z.string().min(1, {
      message: "Cabinet address is required.",
    }),
    cabinet_city: z.string().min(1, {
      message: "Cabinet city is required.",
    }),
    cabinet_postal_code: z.string().min(1, {
      message: "Cabinet postal code is required.",
    }),
    heure_ouverture: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
        message: "Opening time required",
      }),
    heure_fermeture: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, {
        message: "Closing time required",
      }),
    jours_travail: z
      .array(z.string())
      .min(1, {
        message: "At least one working day is required.",
      }),
    consultation_fees: z.string().min(1, {
      message: "Consultation fees are required.",
    }),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

type TFormInputs = z.infer<typeof doctorRegisterSchema>;

export { doctorRegisterSchema };
export type { TFormInputs };
