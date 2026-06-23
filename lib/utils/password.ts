const PASSWORD_LENGTH = 12;

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SPECIALS = "!@#$%^&*()-_=+[]{}|;:,.?/~";
const ALL_CHARACTERS = `${UPPERCASE}${LOWERCASE}${NUMBERS}${SPECIALS}`;

function getRandomChar(characters: string) {
  const randomValues = new Uint32Array(1);
  crypto.getRandomValues(randomValues);
  const index = randomValues[0] % characters.length;
  return characters[index];
}

function shuffleCharacters(value: string[]) {
  const shuffled = [...value];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomValues = new Uint32Array(1);
    crypto.getRandomValues(randomValues);
    const swapIndex = randomValues[0] % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.join("");
}

export function generateStrongPassword(length: number = PASSWORD_LENGTH): string {
  const targetLength = Math.max(length, 12);
  const passwordCharacters = [
    getRandomChar(UPPERCASE),
    getRandomChar(LOWERCASE),
    getRandomChar(NUMBERS),
    getRandomChar(SPECIALS),
  ];

  while (passwordCharacters.length < targetLength) {
    passwordCharacters.push(getRandomChar(ALL_CHARACTERS));
  }

  return shuffleCharacters(passwordCharacters);
}

export function calculatePasswordStrength(password: string): "Weak" | "Medium" | "Strong" {
  if (!password) {
    return "Weak";
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const meetsLength = password.length >= 12;
  const criteriaMet = [hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length;

  if (meetsLength && criteriaMet === 4) {
    return "Strong";
  }

  if (password.length >= 8 && criteriaMet >= 3) {
    return "Medium";
  }

  return "Weak";
}
