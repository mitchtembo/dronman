import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Certification Utilities (assuming certifications are nested under pilots) ---
// Utility to check certification expiry
export function isCertificationExpiringSoon(expiryDate) {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 60 && diffDays > 0; // Expiring within 60 days
}

export function isCertificationExpired(expiryDate) {
  const today = new Date();
  const expiry = new Date(expiryDate);
  return expiry.getTime() < today.getTime();
}
