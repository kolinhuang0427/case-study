const { test, expect } = require("@playwright/test");

async function setContext(page, applianceType, modelNumber) {
  await page.getByTestId("appliance-select").selectOption(applianceType);
  if (modelNumber) {
    await page.getByTestId("model-input").fill(modelNumber);
  }
}

async function sendChatMessage(page, message) {
  await page.getByTestId("composer-input").fill(message);
  await page.getByTestId("composer-send").click();
}

test.describe("Required case-study scenarios", () => {
  test("returns install checklist for PS11752778", async ({ page }) => {
    await page.goto("/");
    await setContext(page, "refrigerator", "WRF535SWHZ");

    await sendChatMessage(page, "How can I install part number PS11752778?");

    const lastAssistant = page.locator('[data-testid="message-assistant"]').last();
    await expect(lastAssistant).toContainText(/PS11752778/i);
    await expect(page.getByText("Unplug refrigerator and shut off water supply.")).toBeVisible();
    await expect(page.getByRole("button", { name: /View sources \(\d+\)/ }).last()).toBeVisible();
  });

  test("confirms compatibility for WDT780SAEM1 and PS11750057", async ({ page }) => {
    await page.goto("/");
    await setContext(page, "dishwasher", "WDT780SAEM1");

    // Seed prior part context and ensure the newest PS number in user message wins.
    await sendChatMessage(page, "How can I install part number PS11752778?");
    await sendChatMessage(page, "Is PS11750057 compatible with my WDT780SAEM1 model?");

    await expect(page.locator('[data-testid="message-assistant"]').last()).toContainText(/PS11750057/i);
    await expect(page.getByText("Dishwasher Water Inlet Valve")).toBeVisible();
    await expect(page.getByText(/Fit[s]? .*WDT780SAEM1/i)).toBeVisible();
  });

  test("provides troubleshooting steps and relevant part for ice maker issue", async ({ page }) => {
    await page.goto("/");
    await setContext(page, "refrigerator", "WRF535SWHZ");

    await sendChatMessage(page, "The ice maker on my Whirlpool fridge is not working. How can I fix it?");

    await expect(page.locator('[data-testid="message-assistant"]').last()).toContainText(/ice maker|water|sensor/i);
    await expect(page.getByText("PS11752778")).toBeVisible();

    await page.getByRole("button", { name: /View sources \(\d+\)/ }).last().click();
    await expect(page.getByText("Whirlpool Refrigerator Ice Maker Not Working")).toBeVisible();
  });

  test("refuses out-of-scope requests", async ({ page }) => {
    await page.goto("/");
    await setContext(page, "refrigerator", "");

    await sendChatMessage(page, "Can you help fix my dryer heating issue?");

    const lastAssistant = page.locator('[data-testid="message-assistant"]').last();
    await expect(lastAssistant.getByRole("button", { name: "Find a part" })).toBeVisible();
    await expect(lastAssistant.getByRole("button", { name: "Track order" })).toBeVisible();
  });

  test("supports secure return request flow", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("order-action").selectOption("return");
    await page.getByTestId("order-id-input").fill("A12345");
    await page.getByTestId("order-postal-input").fill("78701");
    await page.getByTestId("order-submit").click();

    await expect(page.getByText("Order A12345: return requested")).toBeVisible();
    await expect(page.getByText("Return flow is stubbed.")).toBeVisible();
  });
});
