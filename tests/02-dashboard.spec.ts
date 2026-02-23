import { test, expect } from '@playwright/test'

/**
 * Dashboard page tests — run as authenticated admin.
 */
test.describe('Dashboard', () => {
  test('shows dashboard heading and greeting', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible()
    // Greeting includes the seeded admin name
    await expect(page.getByText(/Admin User님/)).toBeVisible()
  })

  test('shows KPI stats cards', async ({ page }) => {
    await page.goto('/dashboard')
    // Target [data-slot="card-title"] to distinguish KPI card headers from
    // recharts legend labels and ticket badge text that share the same strings
    const cardTitle = (text: string) =>
      page.locator('[data-slot="card-title"]').filter({ hasText: text })
    await expect(cardTitle('전체 티켓')).toBeVisible()
    await expect(cardTitle('Open')).toBeVisible()
    await expect(cardTitle('In Progress')).toBeVisible()
    await expect(cardTitle('Resolved')).toBeVisible()
  })

  test('shows status and priority chart card titles in DOM', async ({ page }) => {
    await page.goto('/dashboard')
    // Chart card titles may be below the fold; verify they are rendered in the DOM
    const statusTitle = page.getByText('상태별 티켓').first()
    await statusTitle.scrollIntoViewIfNeeded()
    await expect(statusTitle).toBeVisible()

    const priorityTitle = page.getByText('우선순위별 티켓').first()
    await priorityTitle.scrollIntoViewIfNeeded()
    await expect(priorityTitle).toBeVisible()
  })

  test('authenticated user on /login is redirected to /dashboard', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL('/dashboard')
  })
})
