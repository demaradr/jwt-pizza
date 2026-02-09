import { test, expect }  from 'playwright-test-coverage';

test('register', async ({ page }) => {
  const randomSuffix = Math.random().toString(36).substring(2, 7)
  const email = `bob${randomSuffix}@gmail.com`;
  const name = `bob${randomSuffix}`;
  
  await page.route('*/**/api/auth', async (route) => {
    const registerRes = {
      user: {
        id: 1,
        name: name,
        email: email,
        roles: [{ role: 'diner' }],
      },
      token: 'registertoken',
    };
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ json: registerRes });
  });

  await page.goto('http://localhost:5173/');
  await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill(name);
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('password');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('link', { name: 'b', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
  await page.getByRole('link', { name: 'b', exact: true }).click();
  await expect(page.getByText(email)).toBeVisible();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
});

test('login', async ({ page }) => {
  await page.route('*/**/api/auth', async (route) => {
    const loginReq = { email: 'd@jwt.com', password: 'a' };
    const loginRes = {
      user: {
        id: 3,
        name: 'Kai Chen',
        email: 'd@jwt.com',
        roles: [{ role: 'diner' }],
      },
      token: 'abcdef',
    };
    expect(route.request().method()).toBe('PUT');
    expect(route.request().postDataJSON()).toMatchObject(loginReq);
    await route.fulfill({ json: loginRes });
  });

  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('d@jwt.com');
  await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();
});

test('logout', async ({ page }) => {
  await page.route('**/api/auth', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({
        json: {
          user: { id: 1, name: 'Test', email: 'test@test.com', roles: [{ role: 'diner' }] },
          token: 'token',
        },
      });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 204 });
    } else {
      await route.continue();
    }
  });
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ json: { id: 1, name: 'Test', email: 'test@test.com', roles: [{ role: 'diner' }] } });
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('test@test.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('test');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByRole('link', { name: 'Logout' })).toBeVisible();
  await page.getByRole('link', { name: 'Logout' }).click();

  await expect(page).toHaveURL('/');
});