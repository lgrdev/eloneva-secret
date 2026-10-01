import { expect, test } from "@playwright/test";

const ONGLETS = ["onglet-message", "onglet-mot-de-passe", "onglet-lien"] as const;

test.describe("écran de création d'un secret", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/sante", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: '{"statut":"ok"}' }),
    );
    await page.goto("/");
    await expect(page.getByTestId("formulaire-creation")).toBeVisible();
  });

  for (const cible of ONGLETS) {
    test(`CA1 — l'onglet ${cible} sélectionne le type correspondant`, async ({ page }) => {
      await page.getByTestId(cible).click();
      for (const id of ONGLETS) {
        await expect(page.getByTestId(id)).toHaveAttribute("aria-selected", id === cible ? "true" : "false");
      }
    });
  }

  test("CA1 — les libellés des trois onglets sont affichés", async ({ page }) => {
    const onglets = page.getByTestId("onglets-type");
    await expect(onglets.getByRole("tab")).toHaveCount(3);
    await expect(onglets.getByRole("tab", { name: "Message" })).toBeVisible();
    await expect(onglets.getByRole("tab", { name: "Mot de passe" })).toBeVisible();
    await expect(onglets.getByRole("tab", { name: "Lien" })).toBeVisible();
  });

  test("CA2 — le contenu saisi est conservé quand on change d'onglet", async ({ page }) => {
    const editeur = page.getByTestId("editeur-contenu");
    await editeur.fill("mon secret très confidentiel");
    for (const id of ["onglet-mot-de-passe", "onglet-lien", "onglet-message"]) {
      await page.getByTestId(id).click();
      await expect(page.getByTestId("editeur-contenu")).toHaveValue("mon secret très confidentiel");
    }
  });

  test("CA3 — le compteur se met à jour pendant la saisie", async ({ page }) => {
    const compteur = page.getByTestId("compteur-caracteres");
    await expect(compteur).toContainText("0 caractère");
    await page.getByTestId("editeur-contenu").pressSequentially("hello");
    await expect(compteur).toContainText("5 caractères");
    await page.getByTestId("editeur-contenu").press("Backspace");
    await expect(compteur).toContainText("4 caractères");
  });

  test("CA4 — le sélecteur propose seulement 1 h, 4 h, 24 h, 7 j et 14 j", async ({ page }) => {
    const selecteur = page.getByTestId("selecteur-duree");
    const radios = selecteur.locator('input[type="radio"][name="duree"]');
    await expect(radios).toHaveCount(5);
    expect(await radios.evaluateAll((els) => els.map((e) => e.getAttribute("value")))).toEqual([
      "1h",
      "4h",
      "24h",
      "7j",
      "14j",
    ]);
    for (const [id, libelle] of [
      ["duree-1h", "1 h"],
      ["duree-4h", "4 h"],
      ["duree-24h", "24 h"],
      ["duree-7j", "7 j"],
      ["duree-14j", "14 j"],
    ]) {
      await expect(page.getByTestId(id as string)).toContainText(libelle as string);
    }
  });

  test("CA4 — 24 h est sélectionnée par défaut et marquée « recommandé »", async ({ page }) => {
    await expect(page.getByRole("radio", { name: /24 h/ })).toBeChecked();
    await expect(page.getByTestId("selecteur-duree").locator('input[type="radio"]:checked')).toHaveCount(1);
    const recommandee = page.getByTestId("duree-recommandee");
    await expect(recommandee).toHaveCount(1);
    await expect(recommandee).toContainText(/recommandé/i);
    await expect(page.getByTestId("duree-24h").getByTestId("duree-recommandee")).toHaveCount(1);
  });

  test("CA4 — choisir une autre durée la sélectionne", async ({ page }) => {
    await page.getByTestId("duree-7j").click();
    await expect(page.getByRole("radio", { name: /7 j/ })).toBeChecked();
    await expect(page.getByRole("radio", { name: /24 h/ })).not.toBeChecked();
  });

  test("CA5 — les garanties architecturales sont affichées", async ({ page }) => {
    const garanties = page.getByTestId("garanties");
    await expect(garanties).toBeVisible();
    await expect(garanties.getByTestId("garantie-valkey")).toContainText("Valkey en mémoire, sans persistance");
    await expect(garanties.getByTestId("garantie-traefik")).toContainText("Traefik, TLS 1.3");
    await expect(garanties.getByTestId("garantie-zero-trace")).toContainText("Zéro trace");
    await expect(garanties.getByTestId("garantie-zero-compte")).toContainText("Zéro compte");
  });
});
