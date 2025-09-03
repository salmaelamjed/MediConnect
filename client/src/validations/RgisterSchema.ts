import { z } from "zod";

const registerSchema = z
  .object({
    // Champs communs
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
    password_confirmation: z.string(),
    role: z.enum(["admin", "doctor", "patient"], {
      message: "Role must be either 'admin', 'doctor', or 'patient'.",
    }),
    name: z.string().optional(),



  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match.",
    path: ["password_confirmation"],
  })
  .refine(
    (data) => {
      if (data.role === "doctor" || data.role === "patient") {
        return data.name && data.name.length >= 3;
      }
      return true;
    },
    {
      message:
        "Name is required and must be at least 3 characters long for doctors and patients.",
      path: ["name"],
    }
  )
  
type TFormInputs = z.infer<typeof registerSchema>;

// Schéma pour la vérification d'email
const verifyEmailSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  code: z.string().length(6, {
    message: "Verification code must be exactly 6 characters.",
  }),
});

// Schéma pour renvoyer le code de vérification
const resendVerificationSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

// Schéma pour le login
const loginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

type TVerifyEmailInputs = z.infer<typeof verifyEmailSchema>;
type TResendVerificationInputs = z.infer<typeof resendVerificationSchema>;
type TLoginInputs = z.infer<typeof loginSchema>;

export {
  registerSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  loginSchema,
};
export type {
  TFormInputs,
  TVerifyEmailInputs,
  TResendVerificationInputs,
  TLoginInputs,
};
