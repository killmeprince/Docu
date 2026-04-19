import { useMemo, useRef, useState } from 'react';
import type { FlowNode } from '../../lib/flow';

export function usePointerRepel(nodes: FlowNode[]) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const basePositions = useMemo(() => Object.fromEntries(nodes.map((item) => [item.id, { x: item.x, y: item.y }])), [nodes]);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(basePositions);

  function handleMove(event: React.MouseEvent<HTMLDivElement>): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const scaleX = 980 / rect.width;
    const scaleY = 420 / rect.height;
    const px = (event.clientX - rect.left) * scaleX;
    const py = (event.clientY - rect.top) * scaleY;

    const next: Record<string, { x: number; y: number }> = {};
    nodes.forEach((node) => {
      const dx = node.x - px;
      const dy = node.y - py;
      const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const influence = Math.max(0, 1 - distance / 260);
      const shift = 14 * influence;
      next[node.id] = {
        x: node.x + (dx / distance) * shift,
        y: node.y + (dy / distance) * shift,
      };
    });
    setPositions(next);
  }

  function handleLeave(): void {
    setPositions(basePositions);
  }

  return { containerRef, positions, handleMove, handleLeave };
}
