import type { ReactNode } from 'react';
/** Shared Digishop title: intact text preserves Persian shaping and one semantic heading. */
export function SignatureHeading({
  as: Tag = 'h2',
  id,
  children,
}: {
  as?: 'h1' | 'h2';
  id?: string;
  children: ReactNode;
}) {
  return (
    <Tag id={id} className="signature-heading">
      <span className="signature-copy">{children}</span>
      {Tag === 'h1' && (
        <i className="signature-signal" aria-hidden="true">
          <span />
          <span />
          <span />
        </i>
      )}
    </Tag>
  );
}
