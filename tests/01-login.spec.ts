import { test, expect } from '@playwright/test'

/**
 * Login page tests — run WITHOUT authentication so the middleware
 * redirect and login UI can be tested from a clean session.
 */
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('Login page UI', () => {
  test('renders title, form fields, and buttons', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByText('AICC Mini')).toBeVisible()
    await expect(page.getByLabel('이메일')).toBeVisible()
    await expect(page.getByLabel('비밀번호')).toBeVisible()
    await expect(page.getByRole('button', { name: '로그인', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: /Google로 로그인/ })).toBeVisible()
  })

  test('shows validation error when email is empty', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: '로그인', exact: true }).click()
    // Match the specific error text (not the Next.js route-announcer div)
    await expect(page.getByText('이메일을 입력해 주세요.')).toBeVisible()
  })

  test('shows error message for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('이메일').fill('wrong@example.com')
    await page.getByLabel('비밀번호').fill('badpassword')
    await page.getByRole('button', { name: '로그인', exact: true }).click()
    // Wait for the error paragraph (p[role="alert"]) — different from Next.js route announcer (div[role="alert"])
    await expect(page.locator('p[role="alert"]')).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('Authentication redirects', () => {
  test('unauthenticated / redirects to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated /tickets redirects to /login', async ({ page }) => {
    await page.goto('/tickets')
    await expect(page).toHaveURL(/\/login/)
  })
})
