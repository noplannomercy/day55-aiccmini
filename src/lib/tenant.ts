/**
 * Tenant isolation helper — validates that a tenant_id is present before
 * allowing any service operation to proceed.
 */

export function requireTenantId(tenantId: string | undefined): string {
  if (!tenantId) throw new Error('tenant_id is required')
  return tenantId
}
