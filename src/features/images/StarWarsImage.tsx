import { useState } from "react";

type Props = {
	id?: number | string | null;
	alt: string;
	className?: string;
};

function toNumId(x: unknown): number | null {
	if (typeof x === "number" && Number.isFinite(x)) {
		return x;
	}
	if (typeof x === "string") {
		const m = x.match(/(\d+)(?:\/)?$/);
		return m ? Number(m[1]) : null;
	}
	return null;
}

const FALLBACK_SVG =
	"data:image/svg+xml;utf8," +
	encodeURIComponent(
		`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
      <rect width='100%' height='100%' fill='#e5e7eb'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
        fill='#64748b' font-family='sans-serif' font-size='14'>no image</text>
    </svg>`,
	);

const IMG_ORIGIN = import.meta.env.VITE_IMG_ORIGIN ?? "http://localhost:8787";

export function StarWarsImage({ id, alt, className = "" }: Props) {
	const num = toNumId(id);
	const [stage, setStage] = useState<0 | 1 | 2>(0);

	const src = !num
		? FALLBACK_SVG
		: stage === 0
			? `${IMG_ORIGIN}/img/characters/${num}.jpg`
			: stage === 1
				? `https://ui-avatars.com/api/?name=${encodeURIComponent(
						alt || "Unknown",
					)}&size=400&background=E5E7EB&color=334155&format=png`
				: FALLBACK_SVG;

	return (
		<img
			src={src}
			alt={alt}
			loading="lazy"
			decoding="async"
			referrerPolicy="no-referrer"
			className={`w-full aspect-4/3 object-cover bg-slate-100 dark:bg-slate-700 ${className}`}
			onError={() => setStage((s) => (s < 2 ? ((s + 1) as 0 | 1 | 2) : s))}
		/>
	);
}

export default StarWarsImage;
