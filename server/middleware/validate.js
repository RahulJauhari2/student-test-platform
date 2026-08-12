const validateBody = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.body = parsed; // assign parsed/sanitized body
    next();
  } catch (error) {
    if (error.errors) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Zod Validation Error: Invalid payload provided',
        errors: formattedErrors,
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message || 'Validation error',
    });
  }
};

module.exports = { validateBody };
