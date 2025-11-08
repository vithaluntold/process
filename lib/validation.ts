import { z } from "zod";

export const emailSchema = z.string().email("Invalid email format").min(1, "Email is required");

export const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters");

export const optionalNameSchema = z
  .string()
  .max(100, "Name must be less than 100 characters")
  .regex(/^[a-zA-Z\s'-]*$/, "Name contains invalid characters")
  .optional()
  .nullable();

export const descriptionSchema = z
  .string()
  .max(1000, "Description must be less than 1000 characters")
  .optional()
  .nullable();

export const processNameSchema = z
  .string()
  .min(1, "Process name is required")
  .max(200, "Process name must be less than 200 characters")
  .regex(/^[a-zA-Z0-9\s\-_().]+$/, "Process name contains invalid characters");

export const caseIdSchema = z
  .string()
  .min(1, "Case ID is required")
  .max(100, "Case ID must be less than 100 characters");

export const activitySchema = z
  .string()
  .min(1, "Activity is required")
  .max(200, "Activity must be less than 200 characters");

export const resourceSchema = z
  .string()
  .max(100, "Resource must be less than 100 characters")
  .optional()
  .nullable();

export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[\x00-\x1F\x7F]/g, "");
}

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: optionalNameSchema,
  lastName: optionalNameSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const processSchema = z.object({
  name: processNameSchema,
  description: descriptionSchema,
  source: z.string().min(1, "Source is required").max(200),
});

export const eventLogSchema = z.object({
  processId: z.number().int().positive(),
  caseId: caseIdSchema,
  activity: activitySchema,
  timestamp: z.coerce.date(),
  resource: resourceSchema,
  metadata: z.record(z.any()).optional().nullable(),
});
