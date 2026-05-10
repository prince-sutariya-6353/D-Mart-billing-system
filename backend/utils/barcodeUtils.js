const { v4: uuidv4 } = require('uuid');

/**
 * Generate EAN-13 barcode number
 */
const generateBarcode = () => {
  const prefix = '890'; // India country code
  const product = String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
  const base = prefix + product;

  // Calculate check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return base + checkDigit;
};

/**
 * Validate EAN-13 barcode
 */
const validateBarcode = (barcode) => {
  if (!/^\d{13}$/.test(barcode)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(barcode[12]);
};

module.exports = { generateBarcode, validateBarcode };
