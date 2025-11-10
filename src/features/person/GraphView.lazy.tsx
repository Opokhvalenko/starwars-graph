import { useMemo } from "react";
import ReactFlow, {
	Background,
	Controls,
	type Edge,
	MiniMap,
	type Node,
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

/**
 * React Flow canvas that visualizes:
 *   Person → Films → Starships
 * Node colors are handled by CSS classes: .node--person|film|starship
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
			<ReactFlow
				nodes={n}
				edges={e}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				fitView
				fitViewOptions={{ padding: 0.2 }}
			>
				<Background />
				<MiniMap pannable zoomable />
				<Controls />
			</ReactFlow>
		</section>
	);
}
