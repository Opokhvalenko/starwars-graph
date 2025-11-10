import { useMemo } from "react";
import ReactFlow, {
	Background,
	Controls,
	type Edge,
	MiniMap,
	type Node,
	ReactFlowProvider,
	useEdgesState,
	useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import type { Film, Person, Starship } from "@api/types";
import { buildGraph } from "./graph";

export type GraphViewProps = {
	person: Person;
	films: Film[];
	starships: Starship[];
};

/** Small overlay legend (outside the canvas height). */
function GraphLegend() {
	const Item = ({ dot, label }: { dot: string; label: string }) => (
		<li className="inline-flex gap-2 items-center">
			<span aria-hidden className={`h-2.5 w-2.5 rounded-full border ${dot}`} />
			<span className="text-sm">{label}</span>
		</li>
	);

	return (
		<div
			data-testid="graph-legend"
			role="note"
			aria-label="Graph legend"
			className="absolute top-3 left-3 z-10 py-2 px-3 rounded-xl border pointer-events-none border-slate-200 bg-white/80 text-slate-700 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
		>
			<ul className="flex flex-wrap gap-y-2 gap-x-4 items-center">
				<Item dot="bg-blue-500 border-blue-600" label="Person" />
				<Item dot="bg-slate-500 border-slate-600" label="Film" />
				<Item dot="bg-amber-500 border-amber-600" label="Starship" />
			</ul>
		</div>
	);
}

// ---- color helpers ----
type Kind = "person" | "film" | "starship" | undefined;

function extractKind(data: unknown): Kind {
	const k = (data as { kind?: string } | undefined)?.kind;
	if (k === "person" || k === "film" || k === "starship") {
		return k;
	}
	return undefined;
}

function fillByKind(kind: Kind): string {
	switch (kind) {
		case "person":
			return "#3b82f6"; // blue-500
		case "film":
			return "#64748b"; // slate-500
		case "starship":
			return "#f59e0b"; // amber-500
		default:
			return "#94a3b8"; // fallback
	}
}

function strokeByKind(kind: Kind): string {
	switch (kind) {
		case "person":
			return "#2563eb"; // blue-600
		case "film":
			return "#475569"; // slate-600
		case "starship":
			return "#d97706"; // amber-600
		default:
			return "#64748b";
	}
}

/**
 * React Flow canvas that visualizes: Person → Films → Starships
 */
export default function GraphView({
	person,
	films,
	starships,
}: GraphViewProps) {
	const { nodes, edges } = useMemo(
		() => buildGraph(person, films, starships),
		[person, films, starships],
	);

	const rfNodes = useMemo<Node[]>(
		() =>
			nodes.map((n) => ({
				id: n.id,
				position: { x: n.position.x, y: n.position.y },
				data: { label: n.data.label, kind: n.data.kind },
				type: "default",
				className: `node node--${n.data.kind}`,
				style: {
					borderWidth: 1,
					borderRadius: 16,
					padding: 8,
					fontWeight: n.data.kind === "person" ? 700 : 500,
				},
			})),
		[nodes],
	);

	const rfEdges = useMemo<Edge[]>(
		() =>
			edges.map((e) => ({
				id: e.id,
				source: e.source,
				target: e.target,
				animated: false,
			})),
		[edges],
	);

	const [n, , onNodesChange] = useNodesState(rfNodes);
	const [e, , onEdgesChange] = useEdgesState(rfEdges);

	return (
		<section
			data-testid="graph-flow"
			aria-label="Person graph"
			className="p-2 w-full h-full rounded-2xl border graph-panel border-slate-200 dark:border-slate-700"
		>
			<div className="relative h-full pr-[176px] pt-[120px]">
				<GraphLegend />

				<ReactFlowProvider>
					<div className="absolute inset-0">
						<ReactFlow
							nodes={n}
							edges={e}
							onNodesChange={onNodesChange}
							onEdgesChange={onEdgesChange}
							fitView
							fitViewOptions={{ padding: 0.25 }}
							proOptions={{ hideAttribution: true }}
						>
							<Background />
							<Controls position="bottom-left" />
						</ReactFlow>
					</div>

					<MiniMap
						className="hidden absolute top-3 right-3 z-10 md:block"
						pannable
						zoomable
						style={{
							width: 160,
							height: 110,
							borderRadius: 12,
							pointerEvents: "none",
							background: "rgba(255,255,255,.85)",
							boxShadow: "0 4px 14px rgba(2,6,23,0.12)",
						}}
						nodeColor={(node) => fillByKind(extractKind(node.data))}
						nodeStrokeColor={(node) => strokeByKind(extractKind(node.data))}
					/>
				</ReactFlowProvider>
			</div>
		</section>
	);
}
