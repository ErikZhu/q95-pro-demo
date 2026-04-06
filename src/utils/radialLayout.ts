/**
 * Radial Layout Utility
 *
 * Calculates positions for menu items distributed along an arc
 * around a center point using polar coordinate math.
 *
 * Requirements: 3.1, 3.4, 3.7
 */

export interface RadialLayoutConfig {
  centerX: number;
  centerY: number;
  radius: number;
  startAngle: number; // degrees, default 90°
  endAngle: number; // degrees, default 270°
  itemCount: number;
  viewportWidth: number;
  viewportHeight: number;
}

export interface RadialPosition {
  x: number;
  y: number;
  angle: number; // degrees
}

/**
 * Convert degrees to radians.
 */
function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate radial positions for menu items evenly distributed
 * along an arc from startAngle to endAngle.
 *
 * Uses polar coordinate math:
 *   x = centerX + radius * cos(angle)
 *   y = centerY + radius * sin(angle)
 *
 * Items are evenly spaced within [startAngle, endAngle].
 * For a single item, it is placed at the midpoint of the arc.
 * For zero items, returns an empty array.
 */
export function calculateRadialPositions(config: RadialLayoutConfig): RadialPosition[] {
  const { centerX, centerY, radius, startAngle, endAngle, itemCount } = config;

  if (itemCount <= 0) {
    return [];
  }

  if (itemCount === 1) {
    const midAngle = (startAngle + endAngle) / 2;
    const rad = degreesToRadians(midAngle);
    return [
      {
        x: centerX + radius * Math.cos(rad),
        y: centerY + radius * Math.sin(rad),
        angle: midAngle,
      },
    ];
  }

  const angleStep = (endAngle - startAngle) / (itemCount - 1);
  const positions: RadialPosition[] = [];

  for (let i = 0; i < itemCount; i++) {
    const angle = startAngle + i * angleStep;
    const rad = degreesToRadians(angle);
    positions.push({
      x: centerX + radius * Math.cos(rad),
      y: centerY + radius * Math.sin(rad),
      angle,
    });
  }

  return positions;
}

/**
 * Clamp all positions so that items (with given size) stay within the viewport.
 *
 * Each item is treated as a square of `itemSize` centered on (x, y).
 * Positions are clamped so the item doesn't exceed viewport boundaries.
 * The angle value is preserved from the original position.
 */
export function clampToViewport(
  positions: RadialPosition[],
  itemSize: number,
  viewport: { width: number; height: number },
): RadialPosition[] {
  const halfSize = itemSize / 2;

  return positions.map((pos) => ({
    x: Math.max(halfSize, Math.min(viewport.width - halfSize, pos.x)),
    y: Math.max(halfSize, Math.min(viewport.height - halfSize, pos.y)),
    angle: pos.angle,
  }));
}
