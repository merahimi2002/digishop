import type { SVGProps } from 'react';
import { logoGeometry } from '@/config/generated/logo';

export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox={logoGeometry.light.viewBox}
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {(['light', 'dark'] as const).map((theme) => (
        <g key={theme} className={theme === 'light' ? 'logo-geometry-light' : 'logo-geometry-dark'}>
          {logoGeometry[theme].shapes.map((shape, index) => {
            const fill = shape.tone === 'accent' ? 'var(--logo-accent)' : 'var(--logo-base)';
            return shape.type === 'path' ? (
              <path key={index} d={shape.d} fill={fill} />
            ) : (
              <circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} fill={fill} />
            );
          })}
        </g>
      ))}
    </svg>
  );
}
