import { useMemo } from 'react';
import type { ApprovalStepResponse, AuditEventResponse, DocumentDetailsResponse } from '../../types/api';
import { buildFlowMap, nodeCssState, nodeStatusText } from '../../lib/flow';
import { usePointerRepel } from './usePointerRepel';

export function DocumentFlowMap({
  details,
  steps,
  audit,
}: {
  details: DocumentDetailsResponse;
  steps: ApprovalStepResponse[];
  audit: AuditEventResponse[];
}): JSX.Element {
  const map = useMemo(() => buildFlowMap(details, steps, audit), [details, steps, audit]);
  const { containerRef, positions, handleMove, handleLeave } = usePointerRepel(map.nodes);

  const nodeById = useMemo(() => new Map(map.nodes.map((item) => [item.id, item])), [map.nodes]);

  return (
    <div className="flow-root">
      <div className="flow-legend">
        <span><i className="legend-dot legend-current" /> Текущий этап</span>
        <span><i className="legend-dot legend-completed" /> Пройдено</span>
        <span><i className="legend-dot legend-pending" /> Ожидает</span>
        <span><i className="legend-dot legend-branch" /> Ветка маршрута</span>
      </div>

      <div ref={containerRef} className="flow-canvas" onMouseMove={handleMove} onMouseLeave={handleLeave}>
        <svg className="flow-svg" viewBox="0 0 980 420" preserveAspectRatio="none">
          {map.edges.map((edge) => {
            const from = nodeById.get(edge.from);
            const to = nodeById.get(edge.to);
            if (!from || !to) return null;
            const fromPos = positions[edge.from] || { x: from.x, y: from.y };
            const toPos = positions[edge.to] || { x: to.x, y: to.y };
            const c1x = (fromPos.x + toPos.x) / 2;
            const c1y = fromPos.y;
            const c2x = (fromPos.x + toPos.x) / 2;
            const c2y = toPos.y;
            const path = `M ${fromPos.x} ${fromPos.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${toPos.x} ${toPos.y}`;
            return <path key={`${edge.from}-${edge.to}`} d={path} className={`flow-edge flow-edge-${edge.kind} ${edge.active ? 'flow-edge-active' : ''}`} />;
          })}
        </svg>

        {map.nodes.map((node) => {
          const pos = positions[node.id] || { x: node.x, y: node.y };
          return (
            <article
              key={node.id}
              className={`flow-node ${nodeCssState(node.state)}`}
              style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
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
