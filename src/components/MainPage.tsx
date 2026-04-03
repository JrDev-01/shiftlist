import React, { useMemo, useState } from 'react';
import ShiftCard, { Shift } from './ShiftCard';
import './MainPage.css';

interface Employee {
  id: string;
  fullName: string;
  team: string;
}

const employeePool: Employee[] = [
  { id: 'u1', fullName: 'Ayse Yilmaz', team: 'Destek' },
  { id: 'u2', fullName: 'Mehmet Kaya', team: 'Operasyon' },
  { id: 'u3', fullName: 'Elif Demir', team: 'Kasa' },
  { id: 'u4', fullName: 'Can Arslan', team: 'Depo' },
  { id: 'u5', fullName: 'Deniz Kurt', team: 'Müşteri İlişkileri' },
  { id: 'u6', fullName: 'Burak Aydin', team: 'Operasyon' },
];

const sampleShifts: Shift[] = [
  { id: 'shift-morning', title: 'Sabahçı', period: 'morning', date: '6 Nisan 2026', color: '#007e6a' },
  { id: 'shift-evening', title: 'Akşamcı', period: 'evening', date: '6 Nisan 2026', color: '#e67e22' },
];

const MainPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState<string>(sampleShifts[0].id);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({
    'shift-morning': ['u1', 'u4'],
    'shift-evening': ['u2'],
  });

  const selectedShift = sampleShifts.find((shift) => shift.id === selectedShiftId) || sampleShifts[0];

  const assignedIds = useMemo(() => {
    return assignments[selectedShift.id] || [];
  }, [assignments, selectedShift.id]);
  const assignedEmployees = employeePool.filter((employee) => assignedIds.includes(employee.id));

  const availableEmployees = useMemo(() => {
    return employeePool
      .filter((employee) => !assignedIds.includes(employee.id))
      .filter((employee) => {
        if (!query.trim()) {
          return true;
        }

        return `${employee.fullName} ${employee.team}`.toLowerCase().includes(query.toLowerCase());
      });
  }, [assignedIds, query]);

  const addEmployeeToShift = (employeeId: string) => {
    setAssignments((prev) => {
      const current = prev[selectedShift.id] || [];
      if (current.includes(employeeId)) {
        return prev;
      }

      return {
        ...prev,
        [selectedShift.id]: [...current, employeeId],
      };
    });
  };

  const removeEmployeeFromShift = (employeeId: string) => {
    setAssignments((prev) => ({
      ...prev,
      [selectedShift.id]: (prev[selectedShift.id] || []).filter((id) => id !== employeeId),
    }));
  };

  return (
    <div className="dashboard-root">
      <header className="dashboard-header">
        <h1>Yönetici Shift Paneli</h1>
        <div className="header-actions">
          <input
            className="search"
            placeholder="Kişi ara: ad veya ekip"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="dashboard-grid">
        <aside className="sidebar">
          <div className="panel-title-block">
            <p className="eyebrow">Shift listesi</p>
            <h2>Günlük Vardiyalar</h2>
          </div>

          <div className="cards compact">
            {sampleShifts.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                selected={shift.id === selectedShift.id}
                assignedCount={(assignments[shift.id] || []).length}
                onClick={(value) => setSelectedShiftId(value.id)}
              />
            ))}
          </div>
        </aside>

        <main className="content">
          <div className="assignment-shell">
            <section className="assignment-card">
              <h3>{selectedShift.title}</h3>
              {assignedEmployees.length === 0 ? (
                <p className="empty-text">Bu shifte henüz kimse atanmadı.</p>
              ) : (
                <ul className="employee-list">
                  {assignedEmployees.map((employee) => (
                    <li key={employee.id}>
                      <div>
                        <strong>{employee.fullName}</strong>
                        <span>{employee.team}</span>
                      </div>
                      <button type="button" className="btn ghost" onClick={() => removeEmployeeFromShift(employee.id)}>
                        Çıkar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="assignment-card">
              <h3>Kişiler</h3>
              {availableEmployees.length === 0 ? (
                <p className="empty-text">Aramaya uygun kişi bulunamadı.</p>
              ) : (
                <ul className="employee-list">
                  {availableEmployees.map((employee) => (
                    <li key={employee.id}>
                      <div>
                        <strong>{employee.fullName}</strong>
                        <span>{employee.team}</span>
                      </div>
                      <button type="button" className="btn primary" onClick={() => addEmployeeToShift(employee.id)}>
                        Ekle
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainPage;
