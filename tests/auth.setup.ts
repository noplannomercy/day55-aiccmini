import { test as setup, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const AUTH_FILE = 'playwright/.auth/user.json'

/**
 * Authentication setup — runs once before all chromium spec files.
 *
 * Logs in with the seeded admin account (admin@aicc.demo / password123)
 * using the mock-login form and saves the resulting browser cookies/storage
 * to playwright/.auth/user.json so every test can reuse the session.
 */
setup('authenticate as admin', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })

  await page.goto('/login')
  await expect(page.getByText('AICC Mini')).toBeVisible()

  await page.getByLabel('이메일').fill('admin@aicc.demo')
  await page.getByLabel('비밀번호').fill('password123')
  await page.getByRole('button', { name: '로그인', exact: true }).click()

  // Wait for the full-page navigation to /dashboard that the login page triggers
  await page.waitForURL('/dashboard', { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: '대시보드' })).toBeVisible()

  await page.context().storageState({ path: AUTH_FILE })
})
