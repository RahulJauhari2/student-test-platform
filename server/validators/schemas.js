const { z } = require('zod');

// Registration schema
const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'teacher', 'student'], {
    errorMap: () => ({ message: 'Role must be admin, teacher, or student' }),
  }),
  collegeName: z.string().trim().optional(),
}).refine(
  (data) => {
    if (data.role === 'student') {
      return !!data.collegeName && data.collegeName.trim().length >= 2;
    }
    return true;
  },
  {
    message: 'College Name is required for students (min 2 characters)',
    path: ['collegeName'],
  }
);

// Login schema
const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Invalid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty'),
});

// Forgot password schema
const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
});

// Reset password schema
const resetPasswordSchema = z.object({
  password: z.string().min(6, 'New password must be at least 6 characters'),
});

// Subject schema
const subjectSchema = z.object({
  name: z.string().trim().min(2, 'Subject name is required'),
  code: z.string().trim().min(2, 'Subject code is required').toUpperCase(),
  description: z.string().optional(),
  iconName: z.string().optional(),
  colorGradient: z.string().optional(),
});

// Topic schema
const topicSchema = z.object({
  subjectId: z.string().min(1, 'Subject ID is required'),
  name: z.string().trim().min(2, 'Topic name is required'),
  description: z.string().optional(),
  timeLimitMinutes: z.number().min(1).max(180).default(5),
  questionCount: z.number().min(1).default(5),
});

// Question schema
const questionSchema = z.object({
  subjectId: z.string().min(1, 'Subject ID is required'),
  topicId: z.string().min(1, 'Topic ID is required'),
  questionText: z.string().trim().min(5, 'Question text must be at least 5 characters'),
  options: z
    .array(z.string().trim().min(1, 'Option cannot be empty'))
    .min(2, 'At least 2 options are required')
    .max(6, 'Maximum 6 options allowed'),
  correctOptionIndex: z.number().min(0, 'Invalid correct option index'),
  explanation: z.string().trim().min(5, 'Explanation is required'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).default('Medium'),
}).refine(
  (data) => data.correctOptionIndex < data.options.length,
  {
    message: 'Correct option index must point to a valid option in options list',
    path: ['correctOptionIndex'],
  }
);

// Bulk Questions Schema
const bulkQuestionSchema = z.object({
  questions: z.array(questionSchema).min(1, 'At least one question is required for bulk upload'),
});

// Test submission schema - ultra flexible & safe
const testSubmissionSchema = z.object({
  topicId: z.string({ required_error: 'Topic ID is required' }),
  timeTakenSeconds: z.number().optional().default(0),
  answers: z.array(z.any()).optional().default([]),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  subjectSchema,
  topicSchema,
  questionSchema,
  bulkQuestionSchema,
  testSubmissionSchema,
};
