/**
 * Calculate GST breakdown (CGST + SGST for intra-state, IGST for inter-state)
 */
const calculateGST = (amount, gstPercent, isInterState = false) => {
  const gstAmount = amount * (gstPercent / 100);
  if (isInterState) {
    return { igst: gstAmount, cgst: 0, sgst: 0, totalGST: gstAmount };
  }
  return {
    cgst: gstAmount / 2,
    sgst: gstAmount / 2,
    igst: 0,
    totalGST: gstAmount,
  };
};

/**
 * GST slab rates in India
 */
const GST_SLABS = [0, 5, 12, 18, 28];

/**
 * Get GST slab for a category
 */
const getGSTSlab = (category) => {
  const slabs = {
    'Groceries': 0, 'Fruits & Vegetables': 0,
    'Dairy': 5, 'Bakery': 5,
    'Beverages': 18, 'Snacks': 12,
    'Personal Care': 18, 'Household': 18,
    'Frozen Foods': 12, 'Electronics': 18, 'Other': 18,
  };
  return slabs[category] || 18;
};

module.exports = { calculateGST, GST_SLABS, getGSTSlab };
