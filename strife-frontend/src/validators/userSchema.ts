import * as Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .pattern(/^\S+$/)
    .required()
    .messages({
      'string.email': 'Invalid email address.',
      'string.pattern.base': 'Email must not contain spaces.',
      'any.required': 'Email is required.',
      'string.empty': 'Email cannot be empty.',
    }),

  displayName: Joi.string()
    .allow(null)
    .optional()
    .trim()
    .min(3)
    .max(30)
    .messages({
      'string.min': 'Display name must be at least 3 characters.',
      'string.max': 'Display name must be at most 30 characters.',
      'string.base': 'Display name must be a string.',
    }),

  username: Joi.string()
    .trim()
    .required()
    .min(3)
    .max(30)
    // eslint-disable-next-line no-control-regex
    .pattern(/^[\x00-\x7F]+$/) // ASCII
    .pattern(/^\S+$/)
    .messages({
      'any.required': 'Username is required.',
      'string.empty': 'Username cannot be empty.',
      'string.min': 'Username should be at least 3 characters.',
      'string.max': 'Username should be at most 30 characters.',
      'string.pattern.base': 'Username must contain only ASCII characters and no spaces.',
    }),

  password: Joi.string()
    .trim()
    .required()
    .min(6)
    .max(30)
    .pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[^\s]*$/)
    .messages({
      'any.required': 'Password is required.',
      'string.empty': 'Password cannot be empty.',
      'string.min': 'Password must be at least 6 characters.',
      'string.max': 'Password must be at most 30 characters.',
      'string.pattern.base': 'Password must include at least one uppercase letter, one number, one symbol, contain only ASCII characters, and have no spaces.',
    }),

  confirmPassword: Joi.string()
    .required()
    .valid(Joi.ref('password'))
    .messages({
      'any.only': 'Passwords do not match.',
      'any.required': 'Please confirm your password.',
      'string.empty': 'Confirm password cannot be empty.',
    }),

  dateOfBirth: Joi.date()
    .required()
    .custom((value, helpers) => {
      const now = new Date();
      const minDate = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
      const maxAgeDate = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());

      if (value > now) {
        return helpers.error('date.future');
      }

      if (value < minDate) {
        return helpers.error('date.tooOld');
      }

      if (value > maxAgeDate) {
        return helpers.error('date.tooYoung');
      }

      return value;
    })
    .messages({
      'any.required': 'Date of birth is required.',
      'date.base': 'Date of birth must be a valid date.',
      'date.future': 'Date of birth cannot be in the future.',
      'date.tooOld': 'Date of birth must not be more than 100 years ago.',
      'date.tooYoung': 'You must be at least 13 years old to register.',
    }),
});

export const loginSchema = Joi.object({

  username: Joi.string()
    .trim()
    .required()
    .min(3)
    .max(30)

    .messages({
      'any.required': 'Username is required.',
      'string.empty': 'Username cannot be empty.',
      'string.min': 'Username should be at least 3 characters.',
      'string.max': 'Username should be at most 30 characters.',
    }),

  password: Joi.string()
    .trim()
    .required()
    .min(6)
    .max(30)
    .messages({
      'any.required': 'Password is required.',
      'string.empty': 'Password cannot be empty.',
      'string.min': 'Password must be at least 6 characters.',
      'string.max': 'Password must be at most 30 characters.',
    }),

});

export const displayNameSchema = Joi.object({
  displayName: registerSchema.extract('displayName'),
});

export const emailSchema = Joi.object({
  email: registerSchema.extract('email'),
});
export const dateOfBirthSchema = Joi.object({
  dateOfBirth: registerSchema.extract('dateOfBirth'),
});
