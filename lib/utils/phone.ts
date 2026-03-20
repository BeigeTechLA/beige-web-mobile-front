export const sanitizePhoneInput = (value: string) =>
  value.replace(/[^0-9+()\-.\s]/g, "");
