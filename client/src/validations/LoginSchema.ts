import { z } from "zod";

const loginSchema = z.object({
  email: z.string().nonempty({ message: "Email is Required" }).email(),
  password: z.string().nonempty({ message: "Password is Required" }),
});

export type LoginInputs = z.infer<typeof loginSchema>;
export default loginSchema;
