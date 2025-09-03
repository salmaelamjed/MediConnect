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
    role: z.enum(["admin", "doctor", "patient"], {
      message: "Role must be either 'admin', 'doctor', or 'patient'.",
    }),
    name: z.string().min(1, {
      message: "Name is required.",
    }),
    license_number: z.string().min(1, {
      message: "License number is required.",
    }),
    bio: z.string().min(1, {
      message: "Bio is required.",
    }),
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
    latitude: z.coerce
      .number()
      .min(-90, {
        message: "Latitude must be between -90 and 90.",
      })
      .max(90, {
        message: "Latitude must be between -90 and 90.",
      }),
    longitude: z.coerce
      .number()
      .min(-180, {
        message: "Longitude must be between -180 and 180.",
      })
      .max(180, {
        message: "Longitude must be between -180 and 180.",
      }),
    consultation_fees: z.string().min(1, {
      message: "Consultation fees is required.",
    }),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

type TFormInputs = z.infer<typeof doctorRegisterSchema>;

export { doctorRegisterSchema };
export type { TFormInputs };
