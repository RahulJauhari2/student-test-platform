import { z } from 'zod';

export const clientRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'teacher', 'student']),
  collegeName: z.string().max(100, 'College name cannot exceed 100 characters').optional(),
}).refine(
  (data) => {
    if (data.role === 'student') {
      return !!data.collegeName && data.collegeName.trim().length >= 2;
    }
    return true;
  },
  {
    message: 'College Name is required for students (min 2 chars)',
    path: ['collegeName'],
  }
);

export const clientLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const clientQuestionSchema = z.object({
  subjectId: z.string().min(1, 'Please select a subject'),
  topicId: z.string().min(1, 'Please select a topic'),
  questionText: z.string().min(5, 'Question text must be at least 5 characters'),
  option0: z.string().min(1, 'Option 1 is required'),
  option1: z.string().min(1, 'Option 2 is required'),
  option2: z.string().min(1, 'Option 3 is required'),
  option3: z.string().min(1, 'Option 4 is required'),
  correctOptionIndex: z.number().min(0).max(3),
  explanation: z.string().min(5, 'Explanation is required'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
});
