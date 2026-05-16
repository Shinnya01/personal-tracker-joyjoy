const encoder = new TextEncoder();

const bytesToBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

const deriveHash = async (pin: string, salt: string) => {
  const data = encoder.encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bytesToBase64(new Uint8Array(digest));
};

export const pinService = {
  async createPin(pin: string) {
    const salt = crypto.randomUUID();
    const pinHash = await deriveHash(pin, salt);
    return { pinHash, pinSalt: salt };
  },

  async verifyPin(pin: string, pinHash?: string, pinSalt?: string) {
    if (!pinHash || !pinSalt) return false;
    const computed = await deriveHash(pin, pinSalt);
    return computed === pinHash;
  },

  canUseBiometric() {
    return !!(window.PublicKeyCredential && navigator.credentials);
  },
};

