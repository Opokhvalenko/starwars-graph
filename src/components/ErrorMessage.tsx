type Props = { message: string };

/** Uniform error message block. */
export default function ErrorMessage({ message }: Props) {
	return (
		<div role="alert" className="card" style={{ borderColor: "#ef4444" }}>
			<strong>Something went wrong:</strong>
			<div style={{ marginTop: 6 }}>{message}</div>
		</div>
	);
}
