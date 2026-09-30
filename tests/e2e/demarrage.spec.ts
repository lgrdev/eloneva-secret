import { expect, test } from "@playwright/test";

test.describe("démarrage (pnpm dev)", () => {
  test("CA2 — la page d'accueil répond 200 et affiche le titre", async ({ page }) => {
    const reponse = await page.goto("/");
    expect(reponse?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "Eloneva Secret" })).toBeVisible();
  });

  test("CA2 — l'API répond 200 via le proxy du front", async ({ request }) => {
    const reponse = await request.get("/api/sante");
    expect(reponse.status()).toBe(200);
    expect(await reponse.json()).toEqual({ statut: "ok" });
  });
});
