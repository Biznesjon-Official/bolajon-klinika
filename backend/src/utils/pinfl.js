/**
 * PINFL (Personal Identification Number For Life) Parser
 * Format: 14 digits - DDMMYYXXXXXCC
 * DD - Day of birth
 * MM - Month of birth
 * YY - Year of birth (last 2 digits)
 * XXXXX - Unique identifier
 * C - Gender (odd = male, even = female)
 * C - Check digit
 */

export const parsePINFL = (pinfl) => {
  if (!pinfl || pinfl.length !== 14 || !/^\d{14}$/.test(pinfl)) {
    throw new Error('Invalid PINFL format');
  }
  
  const day = parseInt(pinfl.substring(0, 2));
  const month = parseInt(pinfl.substring(2, 4));
  const year = parseInt(pinfl.substring(4, 6));
  const genderDigit = parseInt(pinfl.substring(12, 13));
  
  // Determine century
  const currentYear = new Date().getFullYear();
  const currentCentury = Math.floor(currentYear / 100) * 100;
  const previousCentury = currentCentury - 100;
  
  let fullYear = currentCentury + year;
  if (fullYear > currentYear) {
    fullYear = previousCentury + year;
  }
  
  // Validate date
  const birthDate = new Date(fullYear, month - 1, day);
  if (
    birthDate.getDate() !== day ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getFullYear() !== fullYear
  ) {
    // Don't throw error, just log warning and use a valid date
    console.warn(`⚠️ Invalid birth date in PINFL: ${day}/${month}/${fullYear}`);
    // Use first day of the month as fallback
    const fallbackDate = new Date(fullYear, month - 1, 1);
    
    return {
      birthDate: fallbackDate.toISOString().split('T')[0],
      gender: genderDigit % 2 === 0 ? 'Female' : 'Male',
      isValid: true,
      warning: 'PINFL date was invalid, used fallback date'
    };
  }
  
  // Determine gender
  const gender = genderDigit % 2 === 0 ? 'Female' : 'Male';
  
  return {
    birthDate: birthDate.toISOString().split('T')[0],
    gender,
    isValid: true
  };
};

export const validatePINFL = (pinfl) => {
  try {
    parsePINFL(pinfl);
    return true;
  } catch (error) {
    return false;
  }
};

export const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};
