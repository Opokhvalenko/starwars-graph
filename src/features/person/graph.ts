import type { Film, LinkRef, Person, Starship } from "@api/types";
import { extractId } from "@lib/id";
import dagre from "dagre";

/** Node kind for styling/semantics. */
export type NodeKind = "person" | "film" | "starship";

/** Graph node data used in React Flow. */
export interface GraphNodeData {
	label: string;
	kind: NodeKind;
}

/** React Flow simplified node/edge shapes (to avoid importing lib types here). */
export interface FlowNode {
	id: string;
	data: GraphNodeData;
	position: { x: number; y: number };
}

export interface FlowEdge {
	id: string;
	source: string;
	target: string;
}

export interface BuiltGraph {
	nodes: FlowNode[];
	edges: FlowEdge[];
}

/** Normalize LinkRef (number | url string) to numeric id for set comparisons. */
function refToId(ref: LinkRef): number {
	if (typeof ref === "number") {
		return ref;
	}
	if (typeof ref === "string") {
		return extractId(ref);
	}
	throw new Error(`Unsupported LinkRef: ${String(ref)}`);
}

/** Builds raw graph (without coordinates). */
function buildRaw(
	person: Person,
	films: Film[],
	starships: Starship[],
): BuiltGraph {
	const personId = `person-${extractId(person.url)}`;

	const filmNodes: FlowNode[] = films.map((f) => ({
		id: `film-${extractId(f.url)}`,
		data: { label: f.title, kind: "film" as const },
		position: { x: 0, y: 0 },
	}));

	const starshipNodes: FlowNode[] = starships.map((s) => ({
		id: `starship-${extractId(s.url)}`,
		data: { label: s.name, kind: "starship" as const },
		position: { x: 0, y: 0 },
	}));

	const personNode: FlowNode = {
		id: personId,
		data: { label: person.name, kind: "person" },
		position: { x: 0, y: 0 },
	};

	const edgesPF: FlowEdge[] = filmNodes.map((fn) => ({
		id: `${personNode.id}-${fn.id}`,
		source: personNode.id,
		target: fn.id,
	}));

	// Use numeric IDs to avoid mismatch between numbers and URLs
	const heroShipIds = new Set(person.starships.map(refToId));
	const edgesFS: FlowEdge[] = [];

	for (const film of films) {
		const filmId = `film-${extractId(film.url)}`;
		const filmShipIds = new Set(film.starships.map(refToId));

		for (const s of starships) {
			const sidNum = extractId(s.url);
			if (heroShipIds.has(sidNum) && filmShipIds.has(sidNum)) {
				const sid = `starship-${sidNum}`;
				edgesFS.push({
					id: `${filmId}-${sid}`,
					source: filmId,
					target: sid,
				});
			}
		}
	}

	const nodes = [personNode, ...filmNodes, ...starshipNodes];
	const edges = [...edgesPF, ...edgesFS];
	return { nodes, edges };
}

/** Computes Dagre layout with top-to-bottom ranks (TB). */
function layoutWithDagre(graph: BuiltGraph): BuiltGraph {
	const g = new dagre.graphlib.Graph();
	g.setGraph({
		rankdir: "TB",
		nodesep: 40,
		ranksep: 110,
		marginx: 20,
		marginy: 20,
	});
	g.setDefaultEdgeLabel(() => ({}));

	// Estimate node dimensions from label length for better layout
	for (const n of graph.nodes) {
		const width = Math.max(120, Math.min(260, n.data.label.length * 9));
		const height = n.data.kind === "person" ? 56 : 48;
		g.setNode(n.id, { width, height });
	}
	for (const e of graph.edges) {
		g.setEdge(e.source, e.target);
	}

	dagre.layout(g);

	// React Flow expects top-left coords: x - width/2, y - height/2
	const nodes = graph.nodes.map((n) => {
		const dn = g.node(n.id) as {
			x: number;
			y: number;
			width: number;
			height: number;
		};
		return {
			...n,
			position: { x: dn.x - dn.width / 2, y: dn.y - dn.height / 2 },
		};
	});

	return { nodes, edges: graph.edges };
}

/** Public API: build graph and apply Dagre layout. */
export function buildGraph(
	person: Person,
	films: Film[],
	starships: Starship[],
): BuiltGraph {
	const raw = buildRaw(person, films, starships);
	return layoutWithDagre(raw);
}
