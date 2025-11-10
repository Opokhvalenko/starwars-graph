import { ThemeManager } from "@lib/theme";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
	const [scheme, setScheme] = useState<"light" | "dark">(() =>
		ThemeManager.current(),
	);

	useEffect(() => {
		ThemeManager.applySavedTheme();
	}, []);

	return (
		<button
			type="button"
			onClick={() => setScheme(ThemeManager.toggle())}
			className="btn btn-soft"
			aria-label="Toggle theme"
		>
			{scheme === "dark" ? "Light theme" : "Dark theme"}
		</button>
	);
}
