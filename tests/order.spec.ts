import { test, expect } from 'playwright-test-coverage';

const mockMenu = [
  { id: '1', title: 'Veggie A', description: 'Fresh veggies', image: '/pizza1.png', price: 0.005 },
  { id: '2', title: 'Pepperoni', description: 'Classic pepperoni', image: '/pizza2.png', price: 0.005 },
  { id: '3', title: 'Margarita', description: 'Cheese and tomato', image: '/pizza3.png', price: 0.005 },
  { id: '4', title: 'Crusty A', description: 'Crispy crust', image: '/pizza4.png', price: 0.005 },
  { id: '5', title: 'Charred', description: 'Wood-fired', image: '/pizza5.png', price: 0.005 },
];

const mockFranchises = {
  franchises: [
    {
      id: 'f1',
      name: 'Test Franchise',
      stores: [{ id: '19', name: 'Store 19' }],
    },
  ],
  more: false,
};

test('order', async ({ page }) => {
  await page.route('**/api/auth', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({
        json: {
          user: { id: 1, name: 'Test', email: 'testAD@gmail.com', roles: [{ role: 'diner' }] },
          token: 'mock-token',
        },
      });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({
      json: { id: 1, name: 'Test', email: 'testAD@gmail.com', roles: [{ role: 'diner' }] },
    });
  });

  await page.route('**/api/order/menu', async (route) => {
    await route.fulfill({ json: mockMenu });
  });

  await page.route('**/api/franchise*', async (route) => {
    await route.fulfill({ json: mockFranchises });
  });

  await page.route(/\/api\/order$/, async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      const order = {
        id: 'ord-mock-1',
        franchiseId: body.franchiseId || 'f1',
        storeId: body.storeId || '19',
        date: new Date().toISOString(),
        items: body.items || [],
      };
      await route.fulfill({ json: { order, jwt: 'mock.jwt.token' } });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/order/verify', async (route) => {
    await route.fulfill({
      json: { message: 'valid', payload: JSON.stringify({ orderId: 'ord-mock-1' }) },
    });
  });

  await page.goto('/');

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('testAD@gmail.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('test');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'Order' }).click();

  const storeSelect = page.getByRole('combobox');
  await storeSelect.selectOption({ value: '19' }, { timeout: 10000 });

  await page.getByRole('link', { name: /Image Description Veggie A/ }).waitFor({ state: 'visible', timeout: 10000 });

  await page.getByRole('link', { name: /Image Description Veggie A/ }).click();
  await page.getByRole('link', { name: /Image Description Pepperoni/ }).click();
  await page.getByRole('link', { name: /Image Description Margarita/ }).click();
  await page.getByRole('link', { name: /Image Description Crusty A/ }).click();
  await page.getByRole('link', { name: /Image Description Charred/ }).click();

  await page.getByRole('button', { name: 'Checkout' }).click();
  await page.waitForURL(/\/payment/);

  await page.getByRole('button', { name: 'Pay now' }).click();

  await page.waitForURL(/\/delivery/, { timeout: 15000 });

  await page.getByRole('button', { name: 'Verify' }).click();

  const closeBtn = page.getByRole('button', { name: 'Close' });
  await closeBtn.waitFor({ state: 'visible', timeout: 10000 });
  await closeBtn.click();
});