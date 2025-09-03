import { z } from "zod";

const patientInfoSchema = z
  .object({
    // Champs spécifiques au patient
    date_of_birth: z.string().optional(), // ou z.date() selon votre préférence
    gender: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    code_postal: z.string().optional(),
    medical_history: z.string().optional(),
    allergies: z.string().optional(),
  })
 type TFormInputs = z.infer<typeof patientInfoSchema>;
 
export { patientInfoSchema };
export type { TFormInputs };