import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsValidVNDAmount(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidVNDAmount',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'number') return false;

          // Check if amount is positive
          if (value <= 0) return false;

          // Check if amount is reasonable for VND (min 1,000 VND, max 1,000,000,000 VND)
          if (value < 1000 || value > 1000000000) return false;

          // Check if PayPal USD equivalent is valid (min $0.01)
          const usdAmount = value / 24000;
          if (usdAmount < 0.01) return false;

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid VND amount (minimum 1,000 VND, maximum 1,000,000,000 VND)`;
        },
      },
    });
  };
}
