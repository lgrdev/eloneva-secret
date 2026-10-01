import { expect, test } from "@playwright/test";

const MESSAGE = "Service temporairement indisponible. Veuillez réessayer plus tard.";

test.describe("panne serveur", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/sante", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ erreur: MESSAGE }),
      }),
    );
  });

  test("CA2 — sur une 500, le front affiche le message et reste sur /", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("erreur-service")).toContainText(MESSAGE);
    expect(new URL(page.url()).pathname).toBe("/");
  });

  test("CA2 — sur une 500 depuis un autre chemin, le front redirige vers /", async ({ page }) => {
    await page.goto("/autre");
    await expect(page.getByRole("alert")).toContainText(MESSAGE);
    await expect.poll(() => new URL(page.url()).pathname).toBe("/");
  });
});
