const KEY = "theme";

export const ThemeManager = {
	current(): "light" | "dark" {
		const saved = localStorage.getItem(KEY) as "light" | "dark" | null;
		if (saved === "light" || saved === "dark") {
			return saved;
		}
		const prefersDark =
			typeof window !== "undefined" &&
			!!window.matchMedia &&
			window.matchMedia("(prefers-color-scheme: dark)").matches;
		return prefersDark ? "dark" : "light";
	},

	apply(scheme: "light" | "dark") {
		const root = document.documentElement;
		root.setAttribute("data-theme", scheme);
		root.classList.toggle("dark", scheme === "dark");
		localStorage.setItem(KEY, scheme);
	},

	toggle(): "light" | "dark" {
		const next: "light" | "dark" = this.current() === "dark" ? "light" : "dark";
		this.apply(next);
		return next;
	},

	applySavedTheme() {
		this.apply(this.current());
	},
};
