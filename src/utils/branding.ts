import officialDefaultLogo from '../assets/images/vc_mart_official_logo.jpg';
import { loadBranding, saveLogoToFirebase, uploadBrandAsset } from '../lib/firebaseRepository';

export const PRIMARY_ACTIVE_LOGO_KEY = 'vcmart_active_logo';
export const LEGACY_CUSTOM_LOGO_KEY = 'vcmart_custom_logo';

/**
 * Returns initial logo source from local cache immediately to prevent flash/layout-shift.
 * If admin has previously selected a logo, that logo is returned.
 * Otherwise returns officialDefaultLogo.
 */
export function getInitialLogoSync(): string {
  try {
    const saved =
      localStorage.getItem(PRIMARY_ACTIVE_LOGO_KEY) ||
      localStorage.getItem(LEGACY_CUSTOM_LOGO_KEY);
    if (saved && saved.trim()) {
      return saved.trim();
    }
  } catch {
    // ignore
  }
  return officialDefaultLogo;
}

/**
 * Checks if a custom admin logo is currently active in local storage
 */
export function hasAdminSelectedLogoSync(): boolean {
  try {
    const saved =
      localStorage.getItem(PRIMARY_ACTIVE_LOGO_KEY) ||
      localStorage.getItem(LEGACY_CUSTOM_LOGO_KEY);
    return Boolean(saved && saved.trim());
  } catch {
    return false;
  }
}

/**
 * Updates DOM head elements so favicon, apple touch icon and social cards match the admin logo
 */
export function updateDocumentHeadBranding(logoUrl: string) {
  if (typeof document === 'undefined') return;

  try {
    // 1. Favicon
    let favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = logoUrl;

    // 2. Apple Touch Icon
    let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = logoUrl;

    // 3. Open Graph image
    let ogImage = document.querySelector("meta[property='og:image']") as HTMLMetaElement | null;
    if (ogImage) {
      ogImage.content = logoUrl;
    }

    // 4. Twitter image
    let twitterImage = document.querySelector("meta[name='twitter:image']") as HTMLMetaElement | null;
    if (twitterImage) {
      twitterImage.content = logoUrl;
    }
  } catch (e) {
    console.error('Failed to update head branding tags:', e);
  }
}

/**
 * Fetches the latest Admin-selected logo from the server and Firebase.
 * This runs automatically for new visitors, on page refresh, and on tab focus.
 */
export async function fetchLatestAdminLogo(): Promise<string | null> {
  try {
    const firebaseLogo = await loadBranding();
    if (firebaseLogo) {
      persistLogoLocally(firebaseLogo);
      updateDocumentHeadBranding(firebaseLogo);
      return firebaseLogo;
    }
  } catch (err) {
    console.warn('Could not fetch logo from Firebase:', err);
  }

  // Local storage is a display cache only. Firebase remains canonical.
  try {
    const local =
      localStorage.getItem(PRIMARY_ACTIVE_LOGO_KEY) ||
      localStorage.getItem(LEGACY_CUSTOM_LOGO_KEY);
    if (local) return local;
  } catch {
    // ignore
  }

  return null;
}

/**
 * Persists logo to localStorage and updates head tags
 */
export function persistLogoLocally(logoUrl: string | null) {
  try {
    if (logoUrl && logoUrl.trim()) {
      localStorage.setItem(PRIMARY_ACTIVE_LOGO_KEY, logoUrl.trim());
      localStorage.setItem(LEGACY_CUSTOM_LOGO_KEY, logoUrl.trim());
      updateDocumentHeadBranding(logoUrl.trim());
    } else {
      localStorage.removeItem(PRIMARY_ACTIVE_LOGO_KEY);
      localStorage.removeItem(LEGACY_CUSTOM_LOGO_KEY);
      updateDocumentHeadBranding(officialDefaultLogo);
    }
  } catch (e) {
    console.error('Failed to persist logo to localStorage:', e);
  }
}

/**
 * Uploads the selected image to Firebase Storage and records its URL in Firestore.
 */
export async function saveAdminLogoEverywhere(
  logoUrlOrDataUrl: string | null
): Promise<{ success: boolean; effectiveUrl?: string; message?: string }> {
  // If null, reset to default
  if (!logoUrlOrDataUrl) {
    persistLogoLocally(null);
    await saveLogoToFirebase('');
    return { success: true, effectiveUrl: officialDefaultLogo, message: 'Logo reset to default' };
  }
  let effectiveUrl = logoUrlOrDataUrl;
  if (logoUrlOrDataUrl.startsWith('data:')) {
    const response = await fetch(logoUrlOrDataUrl);
    const blob = await response.blob();
    const file = new File([blob], `vcmart-logo.${blob.type.includes('png') ? 'png' : 'jpg'}`, { type: blob.type || 'image/jpeg' });
    effectiveUrl = await uploadBrandAsset(file);
  }
  await saveLogoToFirebase(effectiveUrl);
  persistLogoLocally(effectiveUrl);

  // Dispatch custom browser event so any listening components can react
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('vcmart_logo_updated', { detail: { logoUrl: effectiveUrl } })
    );
  }

  return {
    success: true,
    effectiveUrl,
    message: 'Logo successfully saved as global website logo!',
  };
}
