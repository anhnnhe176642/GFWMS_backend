/**
 * Generate a random payment code for PayOS
 * PayOS requires orderCode to be a numeric integer <= 9007199254740991 (max safe integer)
 * Format: timestamp-based numeric code
 */
export const generatePaymentCode = () => {
  // Use timestamp (milliseconds) which fits safely within max integer
  // Timestamp is unique enough and always numeric
  return Date.now();
};

/**
 * Generate a payment code with invoice reference
 * Format: invoiceId * 1000 + random(0-999)
 * Ensures uniqueness within reasonable range
 */
export const generatePaymentCodeWithInvoice = (invoiceId) => {
  // Add random component to ensure uniqueness if called multiple times
  const random = Math.floor(Math.random() * 1000);
  const code = invoiceId * 10000 + random;
  
  // Ensure it doesn't exceed max safe integer
  if (code > 9007199254740991) {
    return Date.now();
  }
  
  return code;
};

/**
 * Generate a timestamp-based payment code
 * Most reliable approach - always unique and numeric
 */
export const generateTimestampPaymentCode = () => {
  return Date.now();
};

