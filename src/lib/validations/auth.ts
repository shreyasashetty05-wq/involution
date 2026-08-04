import { z } from "zod";
/**
 * Sanitizes a string by stripping all HTML tags.
 */
export const sanitizeInput = (input: string | undefined | null): string => {
    if (!input) return "";
    return input.replace(/<\/?[^>]+(>|$)/g, "").trim();
};

// Password requirements:
// - Minimum 8 characters
// - Maximum 64 characters (bcrypt DoS protection)
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one number
// - At least one special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{8,64}$/;

export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(64, "Password must be at most 64 characters")
    .refine(
        (val) => passwordRegex.test(val),
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    );

export const emailSchema = z
    .string()
    .trim()
    .email("Invalid email format")
    .max(255, "Email is too long");

// Username requirements:
// - Only alphanumeric, underscore, hyphen
// - 3 to 30 characters
const usernameRegex = /^[a-zA-Z0-9_-]+$/;

export const usernameSchema = z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(usernameRegex, "Username can only contain alphanumeric characters, underscores, and hyphens");

// Registration Schema
export const signupSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    username: usernameSchema,
    role: z.enum(["startup", "investor", "incubation"]).optional().default("investor"),
});

// Login Schema
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required").max(64),
});

// Reset Password Schema
export const resetPasswordSchema = z.object({
    email: emailSchema,
});

// Profile Update Schema
export const profileUpdateSchema = z.object({
    displayName: z
        .string()
        .max(50, "Display name is too long")
        .optional()
        .transform((val) => sanitizeInput(val)),
    bio: z
        .string()
        .max(500, "Bio is too long")
        .optional()
        .transform((val) => sanitizeInput(val)),
});
