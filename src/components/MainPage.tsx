import React, { useEffect, useMemo, useState } from 'react';
import ShiftCard, { Shift } from './ShiftCard';
import './MainPage.css';

interface Employee {
  id: string;
  fullName: string;
  team: string;
}

const initialEmployeePool: Employee[] = [
  { id: 'u1', fullName: 'Ayşe Yılmaz', team: 'Destek' },
  { id: 'u2', fullName: 'Mehmet Kaya', team: 'Operasyon' },
  { id: 'u3', fullName: 'Elif Demir', team: 'Kasa' },
  { id: 'u4', fullName: 'Can Arslan', team: 'Depo' },
  { id: 'u5', fullName: 'Deniz Kurt', team: 'Müşteri İlişkileri' },
  { id: 'u6', fullName: 'Burak Aydın', team: 'Operasyon' },
];

const sampleShifts: Shift[] = [
  { id: 'shift-morning', title: 'Sabahçı', period: 'morning', date: '6 Nisan 2026', color: '#007e6a' },
  { id: 'shift-evening', title: 'Akşamcı', period: 'evening', date: '6 Nisan 2026', color: '#e67e22' },
];

const initialAssignments: Record<string, string[]> = {
  'shift-morning': ['u1', 'u4'],
  'shift-evening': ['u2'],
};

const EMPLOYEES_STORAGE_KEY = 'shift-panel-employees';
const ASSIGNMENTS_STORAGE_KEY = 'shift-panel-assignments';

const loadEmployees = (): Employee[] => {
  if (typeof window === 'undefined') {
    return initialEmployeePool;
  }

  try {
    const raw = window.localStorage.getItem(EMPLOYEES_STORAGE_KEY);
    if (!raw) {
      return initialEmployeePool;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return initialEmployeePool;
    }

    const safeEmployees = parsed.filter(
      (item): item is Employee =>
        typeof item?.id === 'string' && typeof item?.fullName === 'string' && typeof item?.team === 'string',
    );

    return safeEmployees.length > 0 ? safeEmployees : initialEmployeePool;
  } catch {
    return initialEmployeePool;
  }
};

const loadAssignments = (): Record<string, string[]> => {
  if (typeof window === 'undefined') {
    return initialAssignments;
  }

  try {
    const raw = window.localStorage.getItem(ASSIGNMENTS_STORAGE_KEY);
    if (!raw) {
      return initialAssignments;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return initialAssignments;
    }

    const safeAssignments: Record<string, string[]> = {};
    for (const [shiftId, ids] of Object.entries(parsed)) {
      if (Array.isArray(ids)) {
        safeAssignments[shiftId] = ids.filter((id): id is string => typeof id === 'string');
      }
    }

    return Object.keys(safeAssignments).length > 0 ? safeAssignments : initialAssignments;
  } catch {
    return initialAssignments;
  }
};

const MainPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [employees, setEmployees] = useState<Employee[]>(() => loadEmployees());
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [returnToSettingsOnClose, setReturnToSettingsOnClose] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [newEmployee, setNewEmployee] = useState({ fullName: '', team: '' });
  const [employeeError, setEmployeeError] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState<string>(sampleShifts[0].id);
  const [assignments, setAssignments] = useState<Record<string, string[]>>(() => loadAssignments());

  useEffect(() => {
    try {
      window.localStorage.setItem(EMPLOYEES_STORAGE_KEY, JSON.stringify(employees));
    } catch {
      // Ignore storage write failures to keep UI usable.
    }
  }, [employees]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(assignments));
    } catch {
      // Ignore storage write failures to keep UI usable.
    }
  }, [assignments]);

  const selectedShift = sampleShifts.find((shift) => shift.id === selectedShiftId) || sampleShifts[0];

  const assignedIds = useMemo(() => {
    return assignments[selectedShift.id] || [];
  }, [assignments, selectedShift.id]);
  const assignedEmployees = employees.filter((employee) => assignedIds.includes(employee.id));

  const availableEmployees = useMemo(() => {
    return employees
      .filter((employee) => !assignedIds.includes(employee.id))
      .filter((employee) => {
        if (!query.trim()) {
          return true;
        }

        return `${employee.fullName} ${employee.team}`.toLowerCase().includes(query.toLowerCase());
      });
  }, [assignedIds, query, employees]);

  const resetEmployeeForm = () => {
    setNewEmployee({ fullName: '', team: '' });
    setEmployeeError('');
    setEditingEmployeeId(null);
  };

  const closeEmployeeModal = () => {
    setIsEmployeeModalOpen(false);
    if (returnToSettingsOnClose) {
      setIsSettingsModalOpen(true);
    }
    setReturnToSettingsOnClose(false);
    resetEmployeeForm();
  };

  const closeSettingsModal = () => {
    setIsSettingsModalOpen(false);
  };

  const openCreateEmployeeModal = () => {
    setIsSettingsModalOpen(false);
    setReturnToSettingsOnClose(true);
    resetEmployeeForm();
    setIsEmployeeModalOpen(true);
  };

  const openEditEmployeeModal = (employee: Employee) => {
    setIsSettingsModalOpen(false);
    setReturnToSettingsOnClose(true);
    setEditingEmployeeId(employee.id);
    setNewEmployee({ fullName: employee.fullName, team: employee.team });
    setEmployeeError('');
    setIsEmployeeModalOpen(true);
  };

  const submitEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fullName = newEmployee.fullName.trim();
    const team = newEmployee.team.trim();

    if (!fullName || !team) {
      setEmployeeError('Ad soyad ve ekip alanları zorunludur.');
      return;
    }

    const duplicate = employees.some(
      (employee) =>
        employee.fullName.toLowerCase() === fullName.toLowerCase() && employee.id !== editingEmployeeId,
    );
    if (duplicate) {
      setEmployeeError('Bu isimde bir çalışan zaten mevcut.');
      return;
    }

    if (editingEmployeeId) {
      setEmployees((prev) =>
        prev.map((employee) =>
          employee.id === editingEmployeeId ? { ...employee, fullName, team } : employee,
        ),
      );
      closeEmployeeModal();
      return;
    }

    const nextId = `u${Date.now()}`;
    setEmployees((prev) => [...prev, { id: nextId, fullName, team }]);
    closeEmployeeModal();
  };

  const deleteEmployee = (employeeId: string) => {
    setEmployees((prev) => prev.filter((employee) => employee.id !== employeeId));

    setAssignments((prev) => {
      const nextAssignments: Record<string, string[]> = {};

      for (const [shiftId, ids] of Object.entries(prev)) {
        nextAssignments[shiftId] = ids.filter((id) => id !== employeeId);
      }

      return nextAssignments;
    });

    if (editingEmployeeId === employeeId) {
      closeEmployeeModal();
    }
  };

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
        <h1>{'Yönetici Shift Paneli'.toLocaleUpperCase('tr')}</h1>
        <div className="header-actions">
          <button type="button" className="btn secondary" onClick={() => setIsSettingsModalOpen(true)}>
            Ayarlar
          </button>
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
                <p className="empty-text">Bu shiftte henüz kimse atanmadı.</p>
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

      {isSettingsModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeSettingsModal}>
          <div className="modal-card settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Kişi Ayarları</h3>
              <button type="button" className="modal-close" aria-label="Kapat" onClick={closeSettingsModal}>
                X
              </button>
            </div>

            <ul className="employee-list settings-list">
              <li className="add-tile-item">
                <button type="button" className="add-employee-tile" aria-label="Yeni kişi ekle" onClick={openCreateEmployeeModal}>
                  +
                </button>
              </li>

              {employees.map((employee) => (
                <li key={employee.id}>
                  <div>
                    <strong>{employee.fullName}</strong>
                    <span>{employee.team}</span>
                  </div>
                  <div className="employee-actions">
                    <button
                      type="button"
                      className="btn secondary"
                      aria-label="Kişiyi düzenle"
                      onClick={() => openEditEmployeeModal(employee)}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="btn secondary icon-btn danger"
                      aria-label="Kişiyi sil"
                      onClick={() => deleteEmployee(employee.id)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v7m4-7v7"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {isEmployeeModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={closeEmployeeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editingEmployeeId ? 'Kişiyi Düzenle' : 'Yeni Kişi Ekle'}</h3>
              <button type="button" className="modal-close" aria-label="Kapat" onClick={closeEmployeeModal}>
                X
              </button>
            </div>

            <form className="employee-form" onSubmit={submitEmployee}>
              <label>
                Ad Soyad
                <input
                  type="text"
                  value={newEmployee.fullName}
                  onChange={(e) => setNewEmployee((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Örn: Selen Yıldız"
                />
              </label>

              <label>
                Ekip
                <input
                  type="text"
                  value={newEmployee.team}
                  onChange={(e) => setNewEmployee((prev) => ({ ...prev, team: e.target.value }))}
                  placeholder="Örn: Operasyon"
                />
              </label>

              {employeeError ? <p className="form-error">{employeeError}</p> : null}

              <div className="form-actions">
                <button type="button" className="btn" onClick={closeEmployeeModal}>
                  Vazgeç
                </button>
                <button type="submit" className="btn primary">
                  {editingEmployeeId ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MainPage;
