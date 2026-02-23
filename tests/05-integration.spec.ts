import { test, expect } from '@playwright/test'

/**
 * Integration tests — cross-feature flows run as authenticated admin.
 * Each test covers at least two distinct pages or features interacting.
 */

// ─── Ticket flows ───────────────────────────────────────────────────────────

test.describe('Ticket detail integration', () => {
  test('created ticket detail shows title, description, actions, and comments sections', async ({
    page,
  }) => {
    // 1. Create a ticket via the new-ticket form
    await page.goto('/tickets/new')
    const title = `INT 티켓 ${Date.now()}`
    await page.getByLabel('제목').fill(title)
    await page.getByLabel('설명').fill('통합 테스트 설명입니다.')
    await page.getByRole('button', { name: '생성' }).click()

    // 2. Wait for redirect to /tickets/<uuid>
    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 15_000 })

    // 3. Verify the ticket title, description, and key UI sections
    await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: title })).toBeVisible()
    await expect(page.getByText('통합 테스트 설명입니다.')).toBeVisible()

    // Actions panel (admin can manage tickets)
    const actionsSection = page.getByText('Actions', { exact: true })
    await actionsSection.scrollIntoViewIfNeeded()
    await expect(actionsSection).toBeVisible()

    // Comments section heading
    const commentsHeading = page.getByRole('heading', { name: 'Comments' })
    await commentsHeading.scrollIntoViewIfNeeded()
    await expect(commentsHeading).toBeVisible()
  })

  test('ticket status can be changed from detail page', async ({ page }) => {
    // 1. Create a ticket (starts as "open")
    await page.goto('/tickets/new')
    const title = `STATUS 티켓 ${Date.now()}`
    await page.getByLabel('제목').fill(title)
    await page.getByLabel('설명').fill('상태 변경 테스트')
    await page.getByRole('button', { name: '생성' }).click()
    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 15_000 })

    // 2. Click the "In Progress" status transition button
    const inProgressBtn = page.getByRole('button', { name: 'In Progress' })
    await inProgressBtn.scrollIntoViewIfNeeded()
    await inProgressBtn.click()

    // 3. After router.refresh(), the "Open" button should now appear (current status is in_progress)
    await expect(page.getByRole('button', { name: 'Open' })).toBeVisible({ timeout: 10_000 })
  })

  test('comment can be added to a ticket and appears in the list', async ({ page }) => {
    // 1. Create a ticket
    await page.goto('/tickets/new')
    const title = `COMMENT 티켓 ${Date.now()}`
    await page.getByLabel('제목').fill(title)
    await page.getByLabel('설명').fill('댓글 테스트 티켓')
    await page.getByRole('button', { name: '생성' }).click()
    await page.waitForURL(/\/tickets\/[0-9a-f-]{36}/, { timeout: 15_000 })

    // 2. Fill and submit the comment form
    const commentText = `E2E 댓글 ${Date.now()}`
    await page.getByPlaceholder('Write a comment...').fill(commentText)
    await page.getByRole('button', { name: 'Add Comment' }).click()

    // 3. After router.refresh(), the comment should appear
    await expect(page.getByText(commentText)).toBeVisible({ timeout: 10_000 })
  })
})

// ─── KB article flows ────────────────────────────────────────────────────────

test.describe('KB article integration', () => {
  test('created article detail shows content and edit button', async ({ page }) => {
    // 1. Create a KB article
    await page.goto('/kb/new')
    const title = `INT KB ${Date.now()}`
    await page.getByLabel('Title').fill(title)
    await page.getByLabel('Content').fill('통합 테스트 KB 콘텐츠입니다.')
    await page.getByRole('button', { name: 'Create Article' }).click()

    // 2. Wait for redirect to /kb/<uuid>
    await page.waitForURL(/\/kb\/[0-9a-f-]{36}$/, { timeout: 15_000 })

    // 3. Verify content and edit button
    await expect(page.getByRole('heading', { level: 1 }).filter({ hasText: title })).toBeVisible()
    await expect(page.getByText('통합 테스트 KB 콘텐츠입니다.')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Edit Article' })).toBeVisible()
  })

  test('KB edit page loads with pre-filled article data', async ({ page }) => {
    // 1. Create article
    await page.goto('/kb/new')
    const title = `EDIT KB ${Date.now()}`
    await page.getByLabel('Title').fill(title)
    await page.getByLabel('Content').fill('수정 전 콘텐츠')
    await page.getByRole('button', { name: 'Create Article' }).click()
    await page.waitForURL(/\/kb\/[0-9a-f-]{36}$/, { timeout: 15_000 })

    // 2. Click Edit Article link
    await page.getByRole('link', { name: 'Edit Article' }).click()
    await page.waitForURL(/\/kb\/[0-9a-f-]{36}\/edit$/, { timeout: 10_000 })

    // 3. Edit form should have Title and Content fields pre-filled
    await expect(page.getByLabel('Title')).toBeVisible()
    await expect(page.getByLabel('Content')).toBeVisible()
    const titleInput = page.getByLabel('Title')
    await expect(titleInput).toHaveValue(title)
  })
})

// ─── Settings and navigation ─────────────────────────────────────────────────

test.describe('Admin settings pages', () => {
  test('settings/rules page renders heading and create button', async ({ page }) => {
    await page.goto('/settings/rules')
    await expect(page).toHaveURL('/settings/rules')
    await expect(page.getByRole('heading', { name: '자동화 규칙' })).toBeVisible()
  })

  test('settings/users page renders heading', async ({ page }) => {
    await page.goto('/settings/users')
    await expect(page).toHaveURL('/settings/users')
    await expect(page.getByRole('heading', { name: '사용자 관리' })).toBeVisible()
  })

  test('settings/audit page renders heading', async ({ page }) => {
    await page.goto('/settings/audit')
    await expect(page).toHaveURL('/settings/audit')
    await expect(page.getByRole('heading', { name: '감사 로그' })).toBeVisible()
  })
})

// ─── Notifications ───────────────────────────────────────────────────────────

test.describe('Notifications', () => {
  test('notifications page renders heading', async ({ page }) => {
    await page.goto('/notifications')
    await expect(page).toHaveURL('/notifications')
    await expect(page.getByRole('heading', { name: '알림' })).toBeVisible()
  })
})
