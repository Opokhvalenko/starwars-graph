import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

/** Top header with app title and theme toggle. */
export default function Header() {
	return (
		<header className="header">
			<div className="header__inner">
				<div className="flex gap-2 items-center">
					{/* Home link with clear focus and no underline */}
					<Link to="/" className="header-title" aria-label="Go to people list">
						Star&nbsp;Wars&nbsp;Graph
					</Link>

					{/* Small version badge (build-time constant) */}
					<div className="badge" style={{ marginLeft: 4 }}>
						v{__APP_VERSION__}
					</div>
				</div>

				{/* Light/Dark theme switch */}
				<ThemeToggle />
			</div>
		</header>
	);
}
