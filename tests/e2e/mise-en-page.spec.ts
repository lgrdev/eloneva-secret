import { expect, test } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

test.describe("mise en page commune", () => {
  test("CA1 — l'en-tête commun affiche le logo Eloneva Secret", async ({ page }) => {
    await page.goto("/");
    const enTete = page.getByTestId("en-tete");
    await expect(enTete).toBeVisible();
    const logo = enTete.getByRole("img", { name: "Logo Eloneva Secret" });
    await expect(logo).toBeVisible();
    await expect(enTete).toContainText("Eloneva Secret");
    await expect
      .poll(() => logo.evaluate((img: { complete: boolean; naturalWidth: number }) => img.complete && img.naturalWidth > 0))
      .toBe(true);
  });

  test("CA2 — le document est déclaré en français", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  });

  test("CA3 — à 375 px de large, aucun défilement horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.getByTestId("en-tete")).toBeVisible();
    const mesures = await page.evaluate<{ scrollWidth: number; innerWidth: number; bodyScrollWidth: number }>(
      "({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, bodyScrollWidth: document.body.scrollWidth })",
    );
    expect(mesures.innerWidth).toBe(375);
    expect(mesures.scrollWidth).toBeLessThanOrEqual(mesures.innerWidth);
    expect(mesures.bodyScrollWidth).toBeLessThanOrEqual(mesures.innerWidth);
  });

  test("CA5 — aucune ressource d'un autre domaine n'est chargée", async ({ page }) => {
    const origine = new URL(BASE_URL).origin;
    const hoteAttendu = new URL(BASE_URL).hostname;
    const externes: string[] = [];
    const verifier = (url: string) => {
      if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("about:")) return;
      const u = new URL(url);
      const memeHote = u.hostname === hoteAttendu;
      const protocoleOk = ["http:", "https:", "ws:", "wss:"].includes(u.protocol);
      if (!protocoleOk || !memeHote || (u.protocol.startsWith("http") && u.origin !== origine)) {
        externes.push(url);
      }
    };
    page.on("request", (req) => verifier(req.url()));
    page.on("websocket", (ws) => verifier(ws.url()));

    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate("document.fonts.ready");
    await expect(page.getByTestId("logo")).toBeVisible();

    expect(externes).toEqual([]);
  });
});
