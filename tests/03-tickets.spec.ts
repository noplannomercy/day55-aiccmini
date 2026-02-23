import { test, expect } from '@playwright/test'

/**
 * Ticket management tests — run as authenticated admin.
 */
test.describe('Ticket list', () => {
  test('loads ticket list page', async ({ page }) => {
    await page.goto('/tickets')
    await expect(page).toHaveURL('/tickets')
    await expect(page.getByRole('heading', { name: '티켓 관리' })).toBeVisible()
    await expect(page.getByRole('link', { name: '새 티켓' })).toBeVisible()
  })

  test('shows empty state or ticket cards', async ({ page }) => {
    await page.goto('/tickets')
    // Exclude /tickets/new from the ticket card links (ticket cards link to /tickets/<uuid>)
    const hasEmptyState = await page.getByText('티켓이 없습니다').isVisible()
    const hasTicketCards = await page
      .locator('a[href^="/tickets/"]:not([href="/tickets/new"])')
      .count()
    expect(hasEmptyState || hasTicketCards > 0).toBeTruthy()
  })
})

test.describe('Ticket creation', () => {
  test('new ticket page renders form', async ({ page }) => {
    await page.goto('/tickets/new')
    await expect(page.getByLabel('제목')).toBeVisible()
    await expect(page.getByLabel('설명')).toBeVisible()
    await expect(page.getByLabel('우선순위')).toBeVisible()
    await expect(page.getByRole('button', { name: '생성' })).toBeVisible()
  })

  test('creates a ticket and lands on detail page', async ({ page }) => {
    await page.goto('/tickets/new')

    const uniqueTitle = `E2E 테스트 티켓 ${Date.now()}`
    await page.getByLabel('제목').fill(uniqueTitle)
    await page.getByLabel('설명').fill('Playwright E2E test — 자동 생성 티켓입니다.')

    await page.getByRole('button', { name: '생성' }).click()

    // After creation, should navigate to the ticket detail page (/tickets/<uuid>)
    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 15_000 })
    await expect(page.getByText(uniqueTitle)).toBeVisible()
  })

  test('shows validation error when title is missing', async ({ page }) => {
    await page.goto('/tickets/new')
    await page.getByLabel('설명').fill('설명만 입력')
    await page.getByRole('button', { name: '생성' }).click()
    await expect(page.getByText('제목을 입력해 주세요.')).toBeVisible()
  })
})
