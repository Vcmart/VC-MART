/**
 * Wholesale Cart Item Validation Utility
 *
 * Enforces the strict rule for VC MART Wholesale:
 * 1 MIX COLOR SET = 1 piece of each available mix color
 * Total Pieces = Sets * Number of Colors
 */

export {
  calculateWholesalePieces,
  validateWholesaleCartItem,
  validateWholesaleCartItemStructure,
  type WholesaleCartItemValidationParams,
  type WholesaleCartItemValidationResult,
  getProductWholesaleColors,
  DEFAULT_WHOLESALE_MIX_COLORS,
} from './clothingSizes';
