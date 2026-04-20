import { useMemo, useState } from 'react';
import type { PointerEvent } from 'react';
import type { ApprovalStepResponse, AuditEventResponse, DocumentDetailsResponse } from '../../types/api';
import { buildFlowMap, nodeCssState, nodeStatusText } from '../../lib/flow';
import { usePointerRepel } from './usePointerRepel';

type DocumentFlowMapProps = {
    details: DocumentDetailsResponse;
    steps: ApprovalStepResponse[];
    audit: AuditEventResponse[];
};

type Point = {
    x: number;
    y: number;
};

const CANVAS_WIDTH = 980;
const CANVAS_HEIGHT = 420;

/**
 * Ширина/высота узла в рендере задаются CSS.
 * Здесь берем безопасные half-size с небольшим запасом,
 * чтобы схема не упиралась в края контейнера.
 */
const NODE_HALF_WIDTH = 96;
const NODE_HALF_HEIGHT = 74;
const SAFE_PAD_X = 42;
const SAFE_PAD_Y = 28;

function resolveAxisShift(
    minEdge: number,
    maxEdge: number,
    viewportSize: number,
    safePad: number,
): number {
    const minShift = safePad - minEdge;
    const maxShift = (viewportSize - safePad) - maxEdge;

    /**
     * Идеальный случай: есть диапазон, в котором схема полностью помещается.
     * Тогда берем shift, максимально близкий к 0, чтобы не ломать исходную композицию.
     */
    if (minShift <= maxShift) {
        if (0 < minShift) {
            return minShift;
        }
        if (0 > maxShift) {
            return maxShift;
        }
        return 0;
    }

    /**
     * Если обе границы одновременно соблюсти нельзя,
     * даем компромиссный сдвиг, чтобы визуально центрировать переполнение.
     */
    return (minShift + maxShift) / 2;
}

export function DocumentFlowMap({
                                    details,
                                    steps,
                                    audit,
                                }: DocumentFlowMapProps): JSX.Element {
    const map = useMemo(() => buildFlowMap(details, steps, audit), [details, steps, audit]);
    const { containerRef, positions, handleMove, handleLeave } = usePointerRepel(map.nodes);

    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [grabbedNodeId, setGrabbedNodeId] = useState<string | null>(null);

    const nodeById = useMemo(
        () => new Map(map.nodes.map((node) => [node.id, node])),
        [map.nodes],
    );

    const resolvedPositions = useMemo<Record<string, Point>>(() => {
        const next: Record<string, Point> = {};

        map.nodes.forEach((node) => {
            next[node.id] = positions[node.id] || { x: node.x, y: node.y };
        });

        return next;
    }, [map.nodes, positions]);

    const normalizedPositions = useMemo<Record<string, Point>>(() => {
        if (!map.nodes.length) {
            return {};
        }

        const xs = map.nodes.map((node) => resolvedPositions[node.id].x);
        const ys = map.nodes.map((node) => resolvedPositions[node.id].y);

        const minLeft = Math.min(...xs) - NODE_HALF_WIDTH;
        const maxRight = Math.max(...xs) + NODE_HALF_WIDTH;
        const minTop = Math.min(...ys) - NODE_HALF_HEIGHT;
        const maxBottom = Math.max(...ys) + NODE_HALF_HEIGHT;

        const shiftX = resolveAxisShift(minLeft, maxRight, CANVAS_WIDTH, SAFE_PAD_X);
        const shiftY = resolveAxisShift(minTop, maxBottom, CANVAS_HEIGHT, SAFE_PAD_Y);

        const next: Record<string, Point> = {};

        map.nodes.forEach((node) => {
            const point = resolvedPositions[node.id];
            next[node.id] = {
                x: point.x + shiftX,
                y: point.y + shiftY,
            };
        });

        return next;
    }, [map.nodes, resolvedPositions]);

    const activeNodeId = grabbedNodeId ?? hoveredNodeId;

    const connectedNodeIds = useMemo(() => {
        if (!activeNodeId) {
            return new Set<string>();
        }

        const next = new Set<string>([activeNodeId]);

        map.edges.forEach((edge) => {
            if (edge.from === activeNodeId || edge.to === activeNodeId) {
                next.add(edge.from);
                next.add(edge.to);
            }
        });

        return next;
    }, [activeNodeId, map.edges]);

    function handleNodePointerDown(
        event: PointerEvent<HTMLElement>,
        nodeId: string,
    ): void {
        event.currentTarget.setPointerCapture(event.pointerId);
        setGrabbedNodeId(nodeId);
        setHoveredNodeId(nodeId);
    }

    function handleNodePointerUp(
        event: PointerEvent<HTMLElement>,
        nodeId: string,
    ): void {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        setGrabbedNodeId((current) => (current === nodeId ? null : current));
    }

    function handleNodePointerCancel(nodeId: string): void {
        setGrabbedNodeId((current) => (current === nodeId ? null : current));
    }

    return (
        <div className="flow-root">
            <div
                ref={containerRef}
                className={`flow-canvas ${grabbedNodeId ? 'flow-canvas-grabbing' : ''}`}
                onMouseMove={handleMove}
                onMouseLeave={() => {
                    handleLeave();
                    setHoveredNodeId(null);
                    setGrabbedNodeId(null);
                }}
            >
                <svg className="flow-svg" viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} preserveAspectRatio="none">
                    {map.edges.map((edge) => {
                        const from = nodeById.get(edge.from);
                        const to = nodeById.get(edge.to);

                        if (!from || !to) {
                            return null;
                        }

                        const fromPos = normalizedPositions[edge.from] || { x: from.x, y: from.y };
                        const toPos = normalizedPositions[edge.to] || { x: to.x, y: to.y };

                        const c1x = (fromPos.x + toPos.x) / 2;
                        const c1y = fromPos.y;
                        const c2x = (fromPos.x + toPos.x) / 2;
                        const c2y = toPos.y;

                        const path = `M ${fromPos.x} ${fromPos.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${toPos.x} ${toPos.y}`;

                        const isRelated = Boolean(
                            activeNodeId && (edge.from === activeNodeId || edge.to === activeNodeId),
                        );

                        return (
                            <path
                                key={`${edge.from}-${edge.to}`}
                                d={path}
                                className={[
                                    'flow-edge',
                                    `flow-edge-${edge.kind}`,
                                    edge.active ? 'flow-edge-active' : '',
                                    isRelated ? 'flow-edge-related' : '',
                                ].filter(Boolean).join(' ')}
                            />
                        );
                    })}
                </svg>

                {map.nodes.map((node) => {
                    const pos = normalizedPositions[node.id] || { x: node.x, y: node.y };
                    const isConnected = activeNodeId ? connectedNodeIds.has(node.id) : false;
                    const isGrabbed = grabbedNodeId === node.id;

                    return (
                        <article
                            key={node.id}
                            className={[
                                'flow-node',
                                nodeCssState(node.state),
                                isConnected ? 'flow-node-connected' : '',
                                isGrabbed ? 'flow-node-grabbed' : '',
                            ].filter(Boolean).join(' ')}
                            style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                            onMouseEnter={() => setHoveredNodeId(node.id)}
                            onMouseLeave={() => {
                                if (grabbedNodeId !== node.id) {
                                    setHoveredNodeId((current) => (current === node.id ? null : current));
                                }
                            }}
                            onFocus={() => setHoveredNodeId(node.id)}
                            onBlur={() => {
                                if (grabbedNodeId !== node.id) {
                                    setHoveredNodeId((current) => (current === node.id ? null : current));
                                }
                            }}
                            onPointerDown={(event) => handleNodePointerDown(event, node.id)}
                            onPointerUp={(event) => handleNodePointerUp(event, node.id)}
                            onPointerCancel={() => handleNodePointerCancel(node.id)}
                            tabIndex={0}
                        >
                            <div className="flow-node-status">{nodeStatusText(node.state)}</div>
                            <div className="flow-node-title">{node.title}</div>
                            {node.subtitle ? <div className="flow-node-subtitle">{node.subtitle}</div> : null}
                            <div className="flow-node-meta">
                                {node.actor ? <span>{node.actor}</span> : null}
                                {node.timestamp ? <span>{node.timestamp}</span> : null}
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}