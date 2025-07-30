import * as yup from 'yup';

export const loginSchema = yup.object().shape({
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export const registrationSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm Password is required'),
  role: yup.string().oneOf(['user', 'admin']).required(),

  companyName: yup.string().when('role', (role, schema) =>
    role === 'admin'
      ? schema.required('Company name is required')
      : schema.notRequired()
  ),

  companyPassword: yup.string().when('role', (role, schema) =>
    role === 'admin'
      ? schema.required('Company password is required')
      : schema.notRequired()
  ),
});

export const vehicleSchema = yup.object().shape({
  make: yup.string().required('Make is required'),
  model: yup.string().required('Model is required'),
  year: yup
    .number()
    .typeError('Year must be a number')
    .required('Year is required')
    .min(1900)
    .max(new Date().getFullYear() + 1),
  licensePlate: yup.string().required('License plate is required'),
  vin: yup.string().required('VIN is required'),
});

export const maintenanceLogSchema = yup.object().shape({
  title: yup.string().required('Title is required'),
  description: yup.string(),
  date: yup.date().required('Date is required'),
  mileage: yup
    .number()
    .typeError('Mileage must be a number')
    .required('Mileage is required'),
  assignedAdminId: yup.string().required('Please select a company'),
});
