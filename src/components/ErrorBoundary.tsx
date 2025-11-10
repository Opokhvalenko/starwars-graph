import React, { type PropsWithChildren } from "react";

type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends React.Component<
	PropsWithChildren,
	State
> {
	override state: State = { hasError: false, message: undefined };

	static getDerivedStateFromError(error: unknown): State {
		return {
			hasError: true,
			message: error instanceof Error ? error.message : String(error),
		};
	}

	override componentDidCatch(_error: unknown, _info: unknown): void {
		// Optionally forward to telemetry (e.g., Sentry)
	}

	override render() {
		if (this.state.hasError) {
			return (
				<div role="alert" className="card" style={{ borderColor: "#ef4444" }}>
					<strong>Unexpected error</strong>
					<div style={{ marginTop: 6 }}>
						{this.state.message ?? "Something went wrong."}
					</div>
				</div>
			);
		}
		return this.props.children;
	}
}
