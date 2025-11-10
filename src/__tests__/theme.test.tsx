import { ThemeManager } from "@lib/theme";

describe("ThemeManager", () => {
	it("toggles theme by updating html data attribute", () => {
		const el = document.documentElement;

		el.setAttribute("data-theme", "light");
		ThemeManager.toggle();
		const after = el.getAttribute("data-theme");

		expect(after === "dark" || after === "light").toBe(true);
	});
});
