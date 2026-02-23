import { test, expect } from '@playwright/test'

/**
 * Knowledge Base tests — run as authenticated admin.
 * Admin role can create and edit articles.
 */
test.describe('Knowledge Base list', () => {
  test('loads KB list page', async ({ page }) => {
    await page.goto('/kb')
    await expect(page).toHaveURL('/kb')
    await expect(page.getByRole('heading', { name: 'Knowledge Base' })).toBeVisible()
    // Admin/agent can create articles
    await expect(page.getByRole('link', { name: 'New Article' })).toBeVisible()
  })

  test('shows empty state or article cards', async ({ page }) => {
    await page.goto('/kb')
    // Exclude /kb/new from the article links (article cards link to /kb/<uuid>)
    const hasEmptyState = await page.getByText('No articles found').isVisible()
    const hasArticleCards = await page
      .locator('a[href^="/kb/"]:not([href="/kb/new"])')
      .count()
    expect(hasEmptyState || hasArticleCards > 0).toBeTruthy()
  })

  test('search bar is visible', async ({ page }) => {
    await page.goto('/kb')
    await expect(page.getByPlaceholder('Search articles...')).toBeVisible()
  })
})

test.describe('KB article creation', () => {
  test('new article page renders form', async ({ page }) => {
    await page.goto('/kb/new')
    await expect(page.getByLabel('Title')).toBeVisible()
    await expect(page.getByLabel('Content')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Article' })).toBeVisible()
  })

  test('creates an article and redirects to detail page', async ({ page }) => {
    await page.goto('/kb/new')

    const uniqueTitle = `E2E KB Article ${Date.now()}`
    await page.getByLabel('Title').fill(uniqueTitle)
    await page.getByLabel('Content').fill('Playwright E2E test article content for verification.')

    await page.getByRole('button', { name: 'Create Article' }).click()

    // After creation navigates to the article detail (/kb/<uuid>)
    await page.waitForURL(/\/kb\/[0-9a-f-]{36}/, { timeout: 15_000 })
    await expect(page.getByText(uniqueTitle)).toBeVisible()
  })
})
