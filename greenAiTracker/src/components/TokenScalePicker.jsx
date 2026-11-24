import React from 'react';
import { TOKEN_SCALES } from '../lib/tokenScale';

export default function TokenScalePicker({
  value,
  onChange,
  scales = TOKEN_SCALES,
  label = 'Token Scale',
}) {
  return (
    <div className="token-scale-picker" role="group" aria-label={label}>
      <span className="token-scale-picker__label">{label}:</span>
      <div className="token-scale-picker__options">
        {scales.map((scale) => {
          const isActive = scale.id === value;
          return (
            <button
              key={scale.id}
              type="button"
              className={`token-scale-picker__btn ${isActive ? 'is-active' : ''}`}
              aria-pressed={isActive}
              onClick={() => onChange(scale.id)}
              title={scale.label}
            >
              {scale.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}