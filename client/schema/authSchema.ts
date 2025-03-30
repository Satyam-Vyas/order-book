import { z } from "zod";

export const loginFormSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

export type loginFormValues = z.infer<typeof loginFormSchema>

export const signupFormSchema = z
  .object({
    username: z
      .string()
      .regex(/^[a-zA-Z0-9@.+-_]+$/, "Username may contain only letters, numbers, and @/./+/-/_ characters")
      .min(3, "Username must be at least 3 characters long"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type signupFormValues = z.infer<typeof signupFormSchema>