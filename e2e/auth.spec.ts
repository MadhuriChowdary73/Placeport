import { test, expect } from '@playwright/test'

test.describe('Auth wall', () => {
  test('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/feed')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page shows PlacePort heading and clean tagline', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('PlacePort')).toBeVisible()
    await expect(page.getByPlaceholder('you@gmail.com')).toBeVisible()
    await expect(page.getByRole('button', { name: /send magic link/i })).toBeVisible()
  })

  test('validates email format on submission', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'invalid-email-address')
    await page.click('button[type="submit"]')
    await expect(page.getByText(/valid email/i)).toBeVisible()
  })
})
