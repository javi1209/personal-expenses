import { expect, test } from '@playwright/test';

const uniqueSuffix = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

test('flujo UI real: registro y CRUD basico de gastos', async ({ page }) => {
  const suffix = uniqueSuffix();
  const email = `e2e.${suffix}@gastos.test`;
  const descripcion = `Compra E2E ${suffix}`;

  await page.goto('/');

  await expect(page.getByRole('button', { name: /Registrarme/i })).toBeVisible();
  await page.getByRole('button', { name: /Registrarme/i }).click();
  await page.getByPlaceholder('Tu nombre').fill('Usuario E2E');
  await page.getByPlaceholder('tu@email.com').fill(email);
  await page.getByPlaceholder(/Minimo 8 caracteres/i).fill('password1234');
  await page.getByRole('button', { name: /Crear Cuenta/i }).click();

  await expect(page.getByRole('heading', { name: /El Gran Libro de Gastos/i })).toBeVisible();

  await page.getByRole('link', { name: /Mis Gastos/i }).click();
  await expect(page.getByRole('heading', { name: /Registro de Gastos/i })).toBeVisible();

  const selectedMonth = await page.locator('main select').first().inputValue();
  const monthDate = `${selectedMonth}-15`;

  await page.getByRole('button', { name: /Nuevo Gasto/i }).click();
  const createDialog = page.getByRole('dialog');
  await expect(createDialog).toBeVisible();
  await createDialog.getByPlaceholder(/Supermercado/i).fill(descripcion);
  await createDialog.getByPlaceholder('0.00').fill('1500');
  await createDialog.locator('input[type="date"]').first().fill(monthDate);
  await createDialog.locator('select').first().selectOption('transporte');
  await createDialog.getByRole('button', { name: /Registrar Gasto/i }).click();

  const row = page.locator('tbody tr', { hasText: descripcion });
  await expect(row).toBeVisible();

  await row.getByRole('button', { name: 'Editar' }).click();
  const editDialog = page.getByRole('dialog');
  await expect(editDialog).toBeVisible();
  await editDialog.getByPlaceholder('0.00').fill('1890');
  await editDialog.getByRole('button', { name: /Guardar cambios/i }).click();
  await expect(row).toContainText('1,890');

  page.once('dialog', (dialog) => {
    void dialog.accept();
  });
  await row.getByRole('button', { name: 'Eliminar' }).click();

  await expect(page.locator('tbody tr', { hasText: descripcion })).toHaveCount(0);
  await expect(page.getByText('No hay gastos registrados para este periodo')).toBeVisible();
});
