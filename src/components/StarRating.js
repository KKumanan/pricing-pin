import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ value = 0, onChange, editable = false, size = 22 }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`focus:outline-none transition-all duration-200 ${
            editable ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
          }`}
          onClick={() => {
            if (editable && onChange) {
              console.log('Star clicked:', star);
              onChange(star);
            }
          }}
          tabIndex={editable ? 0 : -1}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          style={{ background: 'none', border: 'none', padding: '2px' }}
        >
          <Star
            className={
              star <= value
                ? 'text-yellow-400 fill-yellow-300'
                : 'text-gray-300'
            }
            size={size}
            fill={star <= value ? 'currentColor' : 'none'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating; 