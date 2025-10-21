import * as React from "react";

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface FieldValidation {
  [key: string]: ValidationRule[];
}

export function useValidation(fieldValidations: FieldValidation) {
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateField = React.useCallback((field: string, value: any): boolean => {
    const rules = fieldValidations[field];
    if (!rules) return true;

    for (const rule of rules) {
      if (!rule.validate(value)) {
        setErrors(prev => ({ ...prev, [field]: rule.message }));
        return false;
      }
    }

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    return true;
  }, [fieldValidations]);

  const validateForm = React.useCallback((formData: Record<string, any>): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(fieldValidations)) {
      const value = formData[field];
      for (const rule of rules) {
        if (!rule.validate(value)) {
          newErrors[field] = rule.message;
          isValid = false;
          break;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [fieldValidations]);

  const clearErrors = React.useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = React.useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
  };
}

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value) => value !== undefined && value !== null && value !== '',
    message,
  }),
  
  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => !value || value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),
  
  isNumber: (message = 'Must be a valid number'): ValidationRule => ({
    validate: (value) => !value || !isNaN(Number(value)),
    message,
  }),
  
  positiveNumber: (message = 'Must be greater than 0'): ValidationRule => ({
    validate: (value) => !value || (Number(value) > 0),
    message,
  }),
  
  email: (message = 'Must be a valid email'): ValidationRule => ({
    validate: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),
  
  url: (message = 'Must be a valid URL'): ValidationRule => ({
    validate: (value) => !value || /^https?:\/\/.+/.test(value),
    message,
  }),
};