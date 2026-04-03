import React from 'react';

export interface Shift {
  id: string;
  title: string;
  period: 'morning' | 'evening';
  date: string;
  color?: string;
}

interface ShiftCardProps {
  shift: Shift;
  selected?: boolean;
  assignedCount: number;
  onClick: (shift: Shift) => void;
}

const ShiftCard: React.FC<ShiftCardProps> = ({ shift, selected = false, assignedCount, onClick }) => {
  return (
    <button
      className={`shift-card ${selected ? 'selected' : ''}`}
      style={{ borderLeftColor: shift.color || '#007e6a' }}
      onClick={() => onClick(shift)}
      type="button"
    >
      <div className="shift-top">
        <h3 className="shift-title">{shift.title}</h3>
        <span className={`shift-badge ${shift.period}`}>{shift.period === 'morning' ? 'Sabah' : 'Akşam'}</span>
      </div>

      <div className="shift-date">{shift.date}</div>

      <div className="shift-foot">
        <span>Atanan kişi</span>
        <strong>{assignedCount}</strong>
      </div>
    </button>
  );
};

export default ShiftCard;
