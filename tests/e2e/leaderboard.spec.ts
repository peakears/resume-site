import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { resumeHome } from "./paths";

/** The API is a separate Worker, so these tests stand in for it. */
const API = /\/api\/golf\/scores/;

const top = [
  { rank: 1, name: "ACE", total: 8, strokes: [2, 3, 3], createdAt: "a" },
  { rank: 2, name: "ZED", total: 12, strokes: [4, 4, 4], createdAt: "b" },
];

async function openGame(page: Page) {
  await page.goto(resumeHome);
  const prompt = page.getByRole("textbox", { name: "Terminal command" });
  await prompt.fill("golf");
  await prompt.press("Enter");
  const game = page.getByRole("dialog", { name: "Mini golf" });
  const green = game.getByRole("application", { name: "Putting green" });
  await green.focus();
  return { game, green };
}

/**
 * Plays a whole round at minimum power. Each putt rolls a few units, so every
 * hole hits the 10-stroke limit and the ball is picked up: 30 putts.
 */
async function finishRound(page: Page, game: Locator, green: Locator) {
  for (let hole = 1; hole <= 3; hole++) {
    await green.focus();
    for (let i = 0; i < 9; i++) await page.keyboard.press("ArrowDown");
    await expect(game).toContainText("Power 5%");
    for (let stroke = 1; stroke <= 10; stroke++) {
      // A press while the ball is still rolling is ignored, so try again.
      await expect(async () => {
        await page.keyboard.press(" ");
        await expect(game).toContainText(`Strokes ${stroke}`, { timeout: 250 });
      }).toPass();
    }
    await game
      .getByRole("button", { name: hole < 3 ? "Next hole" : "See scorecard" })
      .click();
  }
  await expect(game).toContainText("Round complete: 30 strokes");
}

/** The post form and the table, apart from the game's own messages. */
const boardOf = (game: Locator) =>
  game.getByRole("region", { name: "Leaderboard" });

test.describe("leaderboard", () => {
  test.setTimeout(90_000);

  test("posts a finished round and shows where it ranks", async ({ page }) => {
    let posted: Record<string, unknown> | undefined;
    await page.route(API, async (route) => {
      if (route.request().method() === "POST") {
        posted = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          json: { id: 3, rank: 3, total: 30 },
        });
      } else {
        const scores = posted
          ? [
              ...top,
              {
                rank: 3,
                name: "PAT",
                total: 30,
                strokes: [10, 10, 10],
                createdAt: "c",
              },
            ]
          : top;
        await route.fulfill({ json: { scores } });
      }
    });

    const { game, green } = await openGame(page);
    await finishRound(page, game, green);

    // The leaderboard loads beside the scorecard.
    const board = boardOf(game).getByRole("table", { name: "Leaderboard" });
    await expect(board.getByRole("row", { name: /ACE/ })).toBeVisible();
    await expect(board.getByRole("row", { name: /ZED/ })).toBeVisible();

    await game.getByRole("textbox", { name: "Your initials" }).fill("pat1");
    await expect(
      game.getByRole("textbox", { name: "Your initials" }),
    ).toHaveValue("PAT");
    await game.getByRole("button", { name: "Post score" }).click();

    await expect(boardOf(game).getByRole("status")).toContainText(
      "Posted! You're number 3 on the leaderboard.",
    );
    // The list reloads with the new score, and marks it as the visitor's.
    await expect(
      board.getByRole("row", { name: /PAT \(you\)/ }),
    ).toHaveAttribute("aria-current", "true");

    // What was sent: the putts, never a score.
    expect(Object.keys(posted!).sort()).toEqual([
      "courseVersion",
      "name",
      "roundId",
      "shots",
    ]);
    expect(posted).toMatchObject({ name: "PAT", courseVersion: 1 });
    expect(posted!.roundId).toMatch(/^[0-9a-f-]{36}$/);
    expect(posted!.shots).toHaveLength(30);

    const results = await new AxeBuilder({ page }).include("dialog").analyze();
    expect(results.violations).toEqual([]);

    // The initials are remembered for next time.
    expect(
      await page.evaluate(() => localStorage.getItem("golf-initials")),
    ).toBe("PAT");
  });

  test("starts a new round with a new id after Play again", async ({
    page,
  }) => {
    const ids: string[] = [];
    await page.route(API, async (route) => {
      if (route.request().method() === "POST") {
        ids.push(route.request().postDataJSON().roundId);
        await route.fulfill({
          status: 201,
          json: { id: 1, rank: 1, total: 30 },
        });
      } else {
        await route.fulfill({ json: { scores: [] } });
      }
    });

    const { game, green } = await openGame(page);
    await finishRound(page, game, green);
    await expect(game).toContainText("No scores yet. Be the first!");
    await game.getByRole("textbox", { name: "Your initials" }).fill("AAA");
    await game.getByRole("button", { name: "Post score" }).click();
    await expect(boardOf(game).getByText(/^Posted!/)).toBeVisible();

    await game.getByRole("button", { name: "Play again" }).click();
    await expect(game).toContainText("Hole 1 of 3");
    await expect(game.getByRole("table", { name: "Scorecard" })).toBeHidden();
    await finishRound(page, game, green);
    await game.getByRole("button", { name: "Post score" }).click();
    await expect(boardOf(game).getByText(/^Posted!/)).toBeVisible();

    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });

  test("still plays, and says so, when the leaderboard is unavailable", async ({
    page,
  }) => {
    await page.route(API, (route) => route.abort());

    const { game, green } = await openGame(page);
    await finishRound(page, game, green);

    await expect(boardOf(game).getByRole("status")).toContainText(
      "Leaderboard unavailable.",
    );
    await game.getByRole("textbox", { name: "Your initials" }).fill("PAT");
    await game.getByRole("button", { name: "Post score" }).click();
    await expect(boardOf(game).getByRole("alert")).toContainText(
      "Leaderboard unavailable. Your score wasn't posted.",
    );
    // The scorecard is still there, and another try is allowed.
    await expect(game.getByRole("table", { name: "Scorecard" })).toBeVisible();
    await expect(
      game.getByRole("button", { name: "Post score" }),
    ).toBeEnabled();
  });

  test("shows the top scores from the terminal", async ({ page }) => {
    await page.route(API, (route) => route.fulfill({ json: { scores: top } }));
    await page.goto(resumeHome);
    const prompt = page.getByRole("textbox", { name: "Terminal command" });
    await prompt.fill("leaderboard");
    await prompt.press("Enter");
    const terminal = page.getByRole("figure", {
      name: "Profile summary, written as code",
    });
    await expect(terminal).toContainText("1. ACE  8 strokes  [2-3-3]");
    await expect(terminal).toContainText("2. ZED  12 strokes  [4-4-4]");
  });

  test("says so in the terminal when the leaderboard is unavailable", async ({
    page,
  }) => {
    await page.route(API, (route) => route.abort());
    await page.goto(resumeHome);
    const prompt = page.getByRole("textbox", { name: "Terminal command" });
    await prompt.fill("leaderboard");
    await prompt.press("Enter");
    await expect(
      page.getByRole("figure", { name: "Profile summary, written as code" }),
    ).toContainText("Leaderboard unavailable.");
  });
});
