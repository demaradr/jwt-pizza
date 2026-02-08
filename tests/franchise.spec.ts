import { test, expect } from 'playwright-test-coverage';

const mockAdminUser = { id: 1, name: 'Test', email: 'admin@test.com', roles: [{ role: 'diner' }, { role: 'admin' }] };

const mockFranchises = {
  franchises: [
    { id: 'f3', name: 'franchise3', admins: [{ name: 'Admin 3', email: 'admin3@test.com' }], stores: [{ id: 's3', name: 'Store 3', totalRevenue: 100 }] },
    { id: 'f4', name: 'franchise4', admins: [{ name: 'Admin 4', email: 'admin4@test.com' }], stores: [{ id: 's4', name: 'Store 4', totalRevenue: 200 }] },
  ],
  more: false,
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({
        json: { user: mockAdminUser, token: 'mock-token' },
      });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ json: mockAdminUser });
  });

  await page.route('**/api/franchise*', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === 'POST' && url.match(/\/api\/franchise$/)) {
      const body = route.request().postDataJSON();
      await route.fulfill({
        json: { id: 'mock-new-id', name: body.name || 'test', admins: body.admins || [], stores: [] },
      });
      return;
    }

    if (method === 'DELETE' && url.match(/\/api\/franchise\/[^/]+$/)) {
      await route.fulfill({ status: 204 });
      return;
    }

    if (method === 'GET') {
      const nameParam = new URL(url).searchParams.get('name') || '*';
      const filtered =
        nameParam.includes('franchise4') ? { franchises: mockFranchises.franchises.filter((f) => f.name === 'franchise4'), more: false } : mockFranchises;
      await route.fulfill({ json: filtered });
      return;
    }

    await route.continue();
  });
});

test('admin login', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('test');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
  await page.getByRole('link', { name: 'Admin' }).click();


});

test('create franchise', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('test');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
  await page.getByRole('link', { name: 'Admin' }).click();

  await page.getByRole('button', { name: 'Add Franchise' }).click();
  await page.getByRole('textbox', { name: 'franchise name' }).click();
  await page.getByRole('textbox', { name: 'franchise name' }).fill('test');
  await page.getByRole('textbox', { name: 'franchise name' }).press('Tab');
  await page.getByRole('textbox', { name: 'franchisee admin email' }).fill('test@gmail.com');
  await page.getByRole('button', { name: 'Create' }).click();

});



test('delete franchise', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('test');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
  await page.getByRole('link', { name: 'Admin' }).click();

  await page.getByRole('row', { name: 'franchise3 Admin 3 Close' }).getByRole('button').click();
  await expect(page.getByText('Sorry to see you go')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

});

test('filter franchise', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('test');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
  await page.getByRole('link', { name: 'Admin' }).click();

  
  await page.getByRole('textbox', { name: 'Filter franchises' }).click();
  await page.getByRole('textbox', { name: 'Filter franchises' }).fill('franchise4');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('cell', { name: 'franchise4', exact: true })).toBeVisible();

});
