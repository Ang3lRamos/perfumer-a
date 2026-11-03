import { describe, expect, it } from "vitest";
import { mismoPerfume } from "./coincidir";

describe("mismoPerfume", () => {
  it("ignora marca, presentación, público y orden de palabras", () => {
    expect(mismoPerfume("Ghost Spectre", "Spectre Ghost", "French Avenue")).toBe(true);
    expect(mismoPerfume("Uhud", "Arabiyat Prestige - Uhud| EDP 100ML | UNISEX", "Arabiyat")).toBe(true);
    expect(mismoPerfume("Atlantis Extrait", "Atlantis Extrait", "French Avenue")).toBe(true);
  });

  it("tolera una letra de diferencia en palabras largas", () => {
    expect(mismoPerfume("Mahd al Dhahab", "Arabiyat Prestige - Mahd Al Dahab | EDP 100ML", "Arabiyat")).toBe(true);
  });

  it("no confunde un perfume con su flanker ni con un set", () => {
    expect(mismoPerfume("Marwa", "Arabiyat Marwa Extrait 60ml", "Arabiyat")).toBe(false);
    expect(mismoPerfume("Liquid Brun", "Liquid Brun & Aromatix Naughty Dates Duo", "French Avenue")).toBe(false);
    expect(mismoPerfume("Vulcan Feu", "Vulcan Baie", "French Avenue")).toBe(false);
    expect(mismoPerfume("Odyssey Candee", "Odyssey Candee Perfumed Stick", "Armaf")).toBe(false);
    expect(mismoPerfume("9PM Elixir", "9 PM ELIXIR DEO", "Afnan")).toBe(false);
  });

  it("une números con AM/PM escritos con o sin espacio", () => {
    expect(mismoPerfume("9PM Elixir", "9 PM Elixir", "Afnan")).toBe(true);
    expect(mismoPerfume("9PM", "9 PM", "Afnan")).toBe(true);
  });

  it("usa el género solo cuando ambos nombres lo declaran", () => {
    expect(mismoPerfume("Qimmah for Women", "Lattafa Qimmah For Men", "Lattafa")).toBe(false);
    expect(mismoPerfume("Qimmah for Men", "Lattafa Qimmah For Men", "Lattafa")).toBe(true);
    expect(mismoPerfume("Odyssey Mega", "Odyssey Mega Man", "Armaf")).toBe(true);
  });
});
