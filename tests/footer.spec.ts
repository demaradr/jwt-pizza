import { test, expect }  from 'playwright-test-coverage';


test('franchise', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Franchise' })).toBeVisible();
  await page.getByRole('contentinfo').getByRole('link', { name: 'Franchise' }).click();
  await expect(page.getByText('If you are already a')).toBeVisible();
});

test('about', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
    await page.getByRole('link', { name: 'About' }).click();
    await expect(page.getByText('The secret sauce')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Our employees' })).toBeVisible();
});

test('history', async ({ page }) => {
    await page.goto('http://localhost:5173/');
    await expect(page.getByRole('link', { name: 'History' })).toBeVisible();
    await page.getByRole('link', { name: 'History' }).click();
    await expect(page.getByText('Mama Rucci, my my')).toBeVisible();
    await expect(page.getByText('It gained popularity in')).toBeVisible();
});