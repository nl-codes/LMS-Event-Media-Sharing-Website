/**
 * @module utils/validators
 * @description Shared input validators used by services and scripts.
 */

/**
 * Password policy regex: ≥8 chars, must include lowercase, uppercase,
 * digit, and a non-alphanumeric character.
 */
export const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
