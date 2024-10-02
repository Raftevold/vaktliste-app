import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, updateDoc, doc, addDoc, deleteDoc, where } from 'firebase/firestore';
import './ShiftManagementModal.css';

const ShiftManagementModal = ({ isOpen, onClose, department }) => {
  const [shifts, setShifts] = useState([]);
  const [newShift, setNewShift] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchShifts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "shifts"), where("department", "==", department));
      const querySnapshot = await getDocs(q);
      const shiftData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setShifts(sortShifts(shiftData));
    } catch (err) {
      setError(`Failed to fetch shifts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [department]);

  useEffect(() => {
    if (isOpen) {
      fetchShifts();
    }
  }, [isOpen, fetchShifts]);

  const sortShifts = (shifts) => {
    return shifts.sort((a, b) => {
      if (a.isTextShift && b.isTextShift) {
        return a.shift.localeCompare(b.shift);
      } else if (a.isTextShift) {
        return 1;
      } else if (b.isTextShift) {
        return -1;
      } else {
        const [aStart, aEnd] = a.shift.split('-').map(Number);
        const [bStart, bEnd] = b.shift.split('-').map(Number);
        if (aStart !== bStart) {
          return aStart - bStart;
        } else {
          return aEnd - bEnd;
        }
      }
    });
  };

  const addShift = async () => {
    if (newShift) {
      setError(null);
      try {
        const isTextShift = !/^\d{2}-\d{2}$/.test(newShift);
        const newShiftData = {
          shift: newShift,
          isActive: true,
          department: department,
          isTextShift: isTextShift
        };
        await addDoc(collection(db, "shifts"), newShiftData);
        setNewShift('');
        await fetchShifts();
      } catch (err) {
        setError(`Failed to add shift: ${err.message}`);
      }
    } else {
      setError("Please enter a valid shift (e.g., '09-15' or 'Ferie')");
    }
  };

  const toggleShift = async (shiftId) => {
    setError(null);
    try {
      const shiftRef = doc(db, "shifts", shiftId);
      const shift = shifts.find(s => s.id === shiftId);
      await updateDoc(shiftRef, { isActive: !shift.isActive });
      await fetchShifts();
    } catch (err) {
      setError(`Failed to toggle shift: ${err.message}`);
    }
  };

  const deleteShift = async (shiftId) => {
    setError(null);
    try {
      await deleteDoc(doc(db, "shifts", shiftId));
      await fetchShifts();
    } catch (err) {
      setError(`Failed to delete shift: ${err.message}`);
    }
  };

  const handleClose = () => {
    setNewShift('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Manage Shifts for {department}</h2>
        {error && <p className="error">{error}</p>}
        {loading ? (
          <p>Loading shifts...</p>
        ) : (
          <>
            <div className="shift-list">
              {shifts.map(shift => (
                <div key={shift.id} className="shift-item">
                  <input
                    type="checkbox"
                    checked={shift.isActive}
                    onChange={() => toggleShift(shift.id)}
                  />
                  <span>{shift.shift}</span>
                  <button onClick={() => deleteShift(shift.id)}>Delete</button>
                </div>
              ))}
            </div>
            <div className="add-shift">
              <input
                type="text"
                value={newShift}
                onChange={(e) => setNewShift(e.target.value)}
                placeholder="Enter shift (e.g., 09-15 or Ferie)"
              />
              <button onClick={addShift}>Add Shift</button>
            </div>
          </>
        )}
        <button className="close-button" onClick={handleClose}>Close</button>
      </div>
    </div>
  );
};

export default ShiftManagementModal;