import { describe, expect, it } from "vitest";
import { calcProfit } from "./catalog";

describe("calcProfit", () => {
  it("Printify: retail minus base cost, with margin", () => {
    expect(calcProfit({ supplier: "printify", retailPrice: 32, baseCost: 12, royaltyRate: 0 })).toEqual({ net: 20, margin: 62.5 });
  });
  it("Zazzle: retail times royalty rate", () => {
    expect(calcProfit({ supplier: "zazzle", retailPrice: 20, baseCost: 0, royaltyRate: 15 })).toEqual({ net: 3, margin: 15 });
  });
});
