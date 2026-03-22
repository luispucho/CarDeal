export function setCurrentTenant(tenantId: number) {
  document.cookie = `currentTenantId=${tenantId};path=/;max-age=${60 * 60 * 24 * 365}`;
}

export function getCurrentTenant(): number | null {
  const match = document.cookie.match(/currentTenantId=(\d+)/);
  return match ? parseInt(match[1]) : null;
}

export function clearCurrentTenant() {
  document.cookie = 'currentTenantId=;path=/;max-age=0';
}
