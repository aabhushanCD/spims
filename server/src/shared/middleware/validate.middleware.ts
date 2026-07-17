export const validate = (schema: any) => {
  return (req: any, res: any, next: any) => {
    try {
      req.body = schema.parse(req.body);

      next();
    } catch (error: any) {
      const formattedErrors = error.flatten?.().fieldErrors || error.errors;

      // FIX 3: Add an explicit return to prevent further execution
      return res.status(400).json({
        success: false,
        errors: formattedErrors,
      });
    }
  };
};
