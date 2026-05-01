import { z } from 'zod';

// Schema cho form đăng nhập
export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

// Schema cho form đăng ký
export const registerSchema = z.object({
  fullName: z.string().min(1, 'Tên không được để trống'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

// Schema cho form chia sẻ
export const shareFormSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  description: z.string().optional(),
  file: z.object({
    uri: z.string(),
    name: z.string(),
    type: z.string(),
    size: z.number(),
  }).optional(),
});

// Schema cho form đổi mật khẩu
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Mật khẩu hiện tại phải có ít nhất 6 ký tự'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmNewPassword: z.string().min(6, 'Xác nhận mật khẩu phải có ít nhất 6 ký tự'),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmNewPassword'],
});

// Schema cho form quên mật khẩu
export const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

// Schema cho form xác thực mã PIN
export const verifyPinSchema = z.object({
  pin: z.string().length(6, 'Mã PIN phải có 6 chữ số'),
});

export const validateLogin = (data: any) => {
  return loginSchema.safeParse(data);
};

export const validateRegister = (data: any) => {
  return registerSchema.safeParse(data);
};

export const validateShareForm = (data: any) => {
  return shareFormSchema.safeParse(data);
};

export const validateChangePassword = (data: any) => {
  return changePasswordSchema.safeParse(data);
};

export const validateForgotPassword = (data: any) => {
  return forgotPasswordSchema.safeParse(data);
};

export const validateVerifyPin = (data: any) => {
  return verifyPinSchema.safeParse(data);
};