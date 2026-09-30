import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const racine = resolve(import.meta.dirname, "../..");

interface Tsconfig {
  extends?: string;
  compilerOptions?: { strict?: boolean };
}

function lire(fichier: string): Tsconfig {
  return JSON.parse(readFileSync(fichier, "utf8")) as Tsconfig;
}

// Résout `strict` en suivant la chaîne `extends`.
function strictEffectif(fichier: string): boolean | undefined {
  const config = lire(fichier);
  if (config.compilerOptions?.strict !== undefined) return config.compilerOptions.strict;
  if (config.extends) return strictEffectif(resolve(dirname(fichier), config.extends));
  return undefined;
}

describe("configuration TypeScript", () => {
  const paquets = ["tsconfig.json", "tsconfig.server.json", "tsconfig.front.json"];
  for (const nom of paquets) {
    it(`CA3 — ${nom} est en mode strict`, () => {
      expect(strictEffectif(resolve(racine, nom))).toBe(true);
    });
  }
});
