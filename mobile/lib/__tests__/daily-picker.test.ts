import { getDailyItem } from "../daily-picker";

describe("getDailyItem", () => {
  describe("edge cases", () => {
    it("returns null for an empty array", () => {
      expect(getDailyItem([])).toBeNull();
    });

    it("returns the only item for a single-element array", () => {
      expect(getDailyItem(["solo"])).toBe("solo");
    });
  });

  describe("determinism — same day, same result", () => {
    it("returns the same item when called twice on the same day", () => {
      const items = ["alpha", "beta", "gamma", "delta"];
      const first = getDailyItem(items);
      const second = getDailyItem(items);
      expect(first).toBe(second);
    });

    it("returns a consistent index based on days-since-epoch formula", () => {
      const items = ["a", "b", "c", "d", "e"];
      // Replicate the exact formula from daily-picker.ts which uses new Date().getTime()
      const daysSinceEpoch = Math.floor(new Date().getTime() / 86_400_000);
      const expectedIndex = daysSinceEpoch % items.length;
      expect(getDailyItem(items)).toBe(items[expectedIndex]);
    });
  });

  describe("cycling through items", () => {
    it("returns a valid item from the array", () => {
      const items = ["apple", "banana", "cherry"];
      const result = getDailyItem(items);
      expect(items).toContain(result);
    });

    it("cycles through all items across consecutive simulated days", () => {
      const items = [10, 20, 30];
      const seen = new Set<number>();

      // getDailyItem uses `new Date().getTime()`, so we mock the Date constructor
      const MS_PER_DAY = 86_400_000;
      const OriginalDate = global.Date;

      for (let day = 0; day < items.length * 3; day++) {
        const fakeMs = day * MS_PER_DAY + 1000;
        // Replace Date with a class that returns fakeMs from getTime()
        global.Date = class extends OriginalDate {
          constructor(...args: any[]) {
            if (args.length === 0) {
              super(fakeMs);
            } else {
              super(...(args as []));
            }
          }
          getTime() {
            return fakeMs;
          }
        } as unknown as typeof Date;

        const result = getDailyItem(items);
        if (result !== null) seen.add(result);
      }
      global.Date = OriginalDate;

      // All items should have been returned at least once across the simulated days
      for (const item of items) {
        expect(seen.has(item)).toBe(true);
      }
    });

    it("selection wraps around — index is modulo array length", () => {
      const items = ["x", "y", "z"];
      const MS_PER_DAY = 86_400_000;
      // day 1: daysSinceEpoch=1, 1 % 3 = 1 → items[1] = "y"
      const fakeMs = 1 * MS_PER_DAY + 500;

      const OriginalDate = global.Date;
      global.Date = class extends OriginalDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(fakeMs);
          } else {
            super(...(args as []));
          }
        }
        getTime() {
          return fakeMs;
        }
      } as unknown as typeof Date;

      expect(getDailyItem(items)).toBe("y");
      global.Date = OriginalDate;
    });
  });

  describe("works with different array element types", () => {
    it("works with an array of numbers", () => {
      const items = [1, 2, 3, 4, 5];
      const result = getDailyItem(items);
      expect(items).toContain(result);
    });

    it("works with an array of objects", () => {
      const items = [{ id: 1, name: "one" }, { id: 2, name: "two" }, { id: 3, name: "three" }];
      const result = getDailyItem(items);
      expect(items).toContainEqual(result);
    });
  });

  describe("index bounds", () => {
    it("never returns undefined — always a valid index within bounds", () => {
      for (let len = 1; len <= 10; len++) {
        const items = Array.from({ length: len }, (_, i) => i);
        const result = getDailyItem(items);
        expect(result).not.toBeUndefined();
        expect(result).not.toBeNull();
      }
    });

    it("with a large array, the result is always one of the array elements", () => {
      const items = Array.from({ length: 365 }, (_, i) => `day-${i}`);
      const result = getDailyItem(items);
      expect(items).toContain(result);
    });
  });
});
