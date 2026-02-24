import { test, expect } from 'playwright-test-coverage';

const mockAdminUser = { id: 1, name: 'Test', email: 'admin@test.com', roles: [{ role: 'diner' }, { role: 'admin' }] };

const mockFranchises = {
  franchises: [
    { id: 'f3', name: 'franchise3', admins: [{ name: 'Admin 3', email: 'admin3@test.com' }], stores: [{ id: 's3', name: 'Store 3', totalRevenue: 100 }] },
    { id: 'f4', name: 'franchise4', admins: [{ name: 'Admin 4', email: 'admin4@test.com' }], stores: [{ id: 's4', name: 'Store 4', totalRevenue: 200 }] },
  ],
  more: false,
};

const mockUsers = {
  users: [
    { id: 1, name: 'Test', email: 'admin@test.com', roles: [{ role: 'diner' }, { role: 'admin' }] },
    { id: 2, name: 'Alice', email: 'alice@test.com', roles: [{ role: 'diner' }] },
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

  const deletedUserIds = new Set<number>();
  await page.route('**/api/user*', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === 'GET' && url.match(/\/api\/user\?/)) {
      const u = new URL(url);
      const pageParam = Number(u.searchParams.get('page') ?? '0');
      const nameParam = u.searchParams.get('name') ?? '*';

      let users = mockUsers.users.filter((user) => {
        const userId = typeof user.id === 'string' ? Number(user.id) : user.id;
        return userId !== undefined && !deletedUserIds.has(userId);
      });

      if (nameParam !== '*' && nameParam !== '') {
        const normalized = nameParam.split('*').join('').toLowerCase();
        users = users.filter((user) => (user.name ?? '').toLowerCase().includes(normalized));
      }
      if (pageParam >= 1) {
        await route.fulfill({ json: { users: [], more: false } });
        return;
      }

      await route.fulfill({ json: { users, more: users.length > 0 } });
      return;
    }

    if (method === 'DELETE' && url.match(/\/api\/user\/(\d+)$/)) {
      const match = url.match(/\/api\/user\/(\d+)$/);
      if (match) {
        const id = Number(match[1]);
        deletedUserIds.add(id);
      }
      await route.fulfill({ status: 200, body: '{}' });
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
  await page.getByRole('button', { name: 'Submit' }).first().click();
  await expect(page.getByRole('cell', { name: 'franchise4', exact: true })).toBeVisible();
});

test('admin list users', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('test');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();

  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Test', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Alice', exact: true })).toBeVisible();
});

test('admin delete user', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('test');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();

  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Alice', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Test', exact: true })).toBeVisible();
  
  const deleteButton = page.getByRole('row', { name: /Alice/ }).getByRole('button', { name: 'Delete' });
  await Promise.all([
    deleteButton.click(),
    page.waitForResponse(
      (response) => /\/api\/user\/\d+$/.test(response.url()) && response.request().method() === 'DELETE'
    ),
  ]);
  
  await page.waitForLoadState('networkidle');
  
  await expect(page.getByRole('cell', { name: 'Test', exact: true })).toBeVisible();
});

test('admin filter users and paginate user list', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('admin@test.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('test');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.getByRole('link', { name: 'Admin' }).click();

  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();

  const filterUsersInput = page.getByPlaceholder('Filter users');
  await filterUsersInput.fill('Alice');
  await Promise.all([
    page.getByRole('button', { name: 'Submit' }).nth(1).click(),
    page.waitForResponse((r) => r.url().includes('/api/user?') && r.request().method() === 'GET'),
  ]);
  await expect(page.getByRole('cell', { name: 'Alice', exact: true })).toBeVisible();

  const userNext = page.getByRole('button', { name: '»' }).nth(1);
  const userPrev = page.getByRole('button', { name: '«' }).nth(1);

  await expect(userNext).toBeEnabled();
  await Promise.all([
    userNext.click(),
    page.waitForResponse((r) => r.url().includes('/api/user?') && r.request().method() === 'GET'),
  ]);
  await expect(page.getByRole('cell', { name: 'Alice', exact: true })).not.toBeVisible();

  await expect(userPrev).toBeEnabled();
  await Promise.all([
    userPrev.click(),
    page.waitForResponse((r) => r.url().includes('/api/user?') && r.request().method() === 'GET'),
  ]);
  await expect(page.getByRole('cell', { name: 'Alice', exact: true })).toBeVisible();
});
