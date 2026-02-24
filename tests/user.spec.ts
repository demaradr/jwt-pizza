import { test, expect } from 'playwright-test-coverage';

test('updateUser', async ({ page }) => {
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.goto('/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Register' }).click();

  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main')).toContainText('pizza diner');
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').first().fill('pizza dinerx');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

  await expect(page.getByRole('main')).toContainText('pizza dinerx');
});

test('updateUser changes password', async ({ page }) => {
  const mockUser = { id: '1', name: 'pizza diner', email: 'diner@jwt.com', roles: [{ role: 'diner' }] };
  await page.route('**/api/auth', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({ json: { user: mockUser, token: 'token' } });
    } else {
      await route.continue();
    }
  });
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ json: mockUser });
  });
  let putBody: { password?: string } = {};
  await page.route('**/api/user/*', async (route) => {
    if (route.request().method() === 'PUT') {
      putBody = route.request().postDataJSON() || {};
      await route.fulfill({ json: { user: { ...mockUser }, token: 'token' } });
    } else {
      await route.continue();
    }
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('diner@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('oldpass');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'pd' }).click();
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.locator('#password').fill('newpass');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
  expect(putBody.password).toBe('newpass');
});

test('updateUser changes email', async ({ page }) => {
  const mockUser = { id: '1', name: 'pizza diner', email: 'old@jwt.com', roles: [{ role: 'diner' }] };
  await page.route('**/api/auth', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({ json: { user: mockUser, token: 'token' } });
    } else {
      await route.continue();
    }
  });
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ json: mockUser });
  });
  await page.route('**/api/user/*', async (route) => {
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON() || {};
      await route.fulfill({
        json: { user: { ...mockUser, email: body.email }, token: 'token' },
      });
    } else {
      await route.continue();
    }
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('old@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('pass');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'pd' }).click();
  await expect(page.getByRole('main')).toContainText('old@jwt.com');
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('textbox').nth(1).fill('new@jwt.com');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
  await expect(page.getByRole('main')).toContainText('new@jwt.com');
});

test('updateUser as admin role', async ({ page }) => {
  const mockAdminUser = { id: '2', name: 'Admin User', email: 'admin@jwt.com', roles: [{ role: 'diner' }, { role: 'admin' }] };
  await page.route('**/api/auth', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({ json: { user: mockAdminUser, token: 'token' } });
    } else {
      await route.continue();
    }
  });
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ json: mockAdminUser });
  });
  await page.route('**/api/user/*', async (route) => {
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON() || {};
      await route.fulfill({
        json: { user: { ...mockAdminUser, name: body.name }, token: 'token' },
      });
    } else {
      await route.continue();
    }
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'AU' }).click();
  await expect(page.getByRole('main')).toContainText('Admin User');
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('textbox').first().fill('Admin Updated');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });
  await expect(page.getByRole('main')).toContainText('Admin Updated');
});