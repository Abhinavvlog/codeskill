import { buildGame } from "@/app/error";

describe("Cyber Escape generated levels", () => {
  it("continues generating varied, playable stages beyond the former level cap", () => {
    const levels = Array.from({ length: 40 }, (_, index) => buildGame(index + 1, index * 100, 3));
    expect(levels[39].level).toBe(40);
    expect(levels[39].score).toBe(3900);
    expect(new Set(levels.slice(0, 12).map((game) => game.platforms.map(({ x, y, w }) => `${x}:${y}:${w}`).join("|"))).size).toBeGreaterThan(8);

    for (const game of levels) {
      expect(game.platforms[0].x).toBe(0);
      expect(game.platforms.at(-1)!.x + game.platforms.at(-1)!.w).toBe(game.worldWidth);
      for (let i = 1; i < game.platforms.length; i += 1) {
        const previous = game.platforms[i - 1];
        const current = game.platforms[i];
        const gap = current.x - (previous.x + previous.w);
        expect(gap).toBeGreaterThanOrEqual(0);
        expect(gap).toBeLessThanOrEqual(76);
        expect(Math.abs(current.y - previous.y)).toBeLessThanOrEqual(34);
      }
    }
  });

  it("ramps movement and hazard pace fairly and adds mechanics gradually", () => {
    const level1 = buildGame(1, 0, 3);
    const level2 = buildGame(2, 0, 3);
    const level3 = buildGame(3, 0, 3);
    const level4 = buildGame(4, 0, 3);
    const level100 = buildGame(100, 0, 3);

    expect(level1.platforms.some((platform) => platform.moving)).toBe(false);
    expect(level2.platforms.some((platform) => platform.moving)).toBe(true);
    expect(level3.hazards.some((hazard) => hazard.kind === "glitch")).toBe(true);
    expect(level4.hazards.some((hazard) => hazard.kind === "drop")).toBe(true);
    expect(level2.playerSpeed).toBeGreaterThan(level1.playerSpeed);
    expect(level100.playerSpeed).toBeGreaterThan(level4.playerSpeed);
    expect(level100.playerSpeed).toBeLessThanOrEqual(270);
    expect(level4.hazardPeriod).toBeLessThan(level1.hazardPeriod);
  });

  it("creates a safe, higher-value bonus challenge every five levels", () => {
    for (const level of [5, 10, 15, 100]) {
      const game = buildGame(level, 250, 2);
      expect(game.specialChallenge).toBe(true);
      expect(game.title).toBe("Crystal Cache Bonus");
      expect(game.hazards).toHaveLength(0);
      expect(game.pickups.length).toBeGreaterThan(5);
      expect(game.pickups.every((pickup) => pickup.value >= 100)).toBe(true);
    }
  });
});
