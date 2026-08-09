import { describe, expect, it } from "vitest";
import rawSample from "./__fixtures__/caucasus-raw-sample.json" with { type: "json" };
import { normalizeTheaterExport, type RawExport } from "./normalize-export.js";

describe("normalizeTheaterExport", () => {
  const theater = normalizeTheaterExport(rawSample as RawExport);

  it("normalizes the theater id and name", () => {
    expect(theater.id).toBe("caucasus");
    expect(theater.name).toBe("Caucasus");
  });

  it("normalizes airbases, sorted by name", () => {
    expect(theater.airbases.map((a) => a.name)).toEqual(["Anapa-Vityazevo", "Krasnodar-Center"]);
  });

  it("slugifies the airbase id", () => {
    const anapa = theater.airbases.find((a) => a.name === "Anapa-Vityazevo");
    expect(anapa?.id).toBe("anapa-vityazevo");
  });

  it("maps category code 0 to airdrome", () => {
    const anapa = theater.airbases.find((a) => a.name === "Anapa-Vityazevo");
    expect(anapa?.category).toBe("airdrome");
  });

  it("carries position through", () => {
    const anapa = theater.airbases.find((a) => a.name === "Anapa-Vityazevo");
    expect(anapa?.position).toEqual({
      lat: 45.013174733772,
      lon: 37.359783477556,
      altM: 43.00004196167,
    });
  });

  it("derives both runway ends from a single designator", () => {
    const anapa = theater.airbases.find((a) => a.name === "Anapa-Vityazevo");
    expect(anapa?.runways).toEqual([
      {
        id: "04/22",
        designators: [4, 22],
        lengthM: 2628.5646972656,
        widthM: 60,
      },
    ]);
  });

  it("handles a designator below 18 (reciprocal wraps forward, not negative)", () => {
    const krasnodar = theater.airbases.find((a) => a.name === "Krasnodar-Center");
    expect(krasnodar?.runways).toEqual([
      {
        id: "09/27",
        designators: [9, 27],
        lengthM: 2334.5407714844,
        widthM: 60,
      },
    ]);
  });
});
