import Header from "./Header";

type Props = { children: React.ReactNode };

export default function Layout({ children }: Props) {
	return (
		<>
			<Header />
			<main className="px-4 mx-auto max-w-7xl">{children}</main>
		</>
	);
}
