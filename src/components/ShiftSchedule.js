import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import './ShiftSchedule.css';
import EmployeeListModal from './EmployeeListModal';
import ShiftManagementModal from './ShiftManagementModal';
import WeekSelector from './WeekSelector';
import ShiftTable from './ShiftTable';
import CommentSection from './CommentSection';
import { getWeekNumber, getDateOfISOWeek, formatDate } from '../utils/dateUtils';
import { useShiftContext } from '../ShiftContext';
import exportSchedule from './ExportSchedule';

const ShiftSchedule = ({ department, tabId }) => {
  const { shifts, employees, customShifts, error, loading, fetchEmployeesAndShifts, updateShift, reorderEmployees, clearShifts } = useShiftContext();

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const savedWeek = localStorage.getItem(`selectedWeek-${tabId}`);
    return savedWeek ? parseInt(savedWeek) : getWeekNumber(new Date());
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const savedYear = localStorage.getItem(`selectedYear-${tabId}`);
    return savedYear ? parseInt(savedYear) : new Date().getFullYear();
  });
  const [comment, setComment] = useState('');
  const days = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
  const shiftTableRef = useRef(null);

  useEffect(() => {
    fetchEmployeesAndShifts(department, tabId, selectedYear, selectedWeek);
  }, [fetchEmployeesAndShifts, department, tabId, selectedYear, selectedWeek]);

  useEffect(() => {
    localStorage.setItem(`selectedWeek-${tabId}`, selectedWeek.toString());
    localStorage.setItem(`selectedYear-${tabId}`, selectedYear.toString());
  }, [selectedWeek, selectedYear, tabId]);

  const onDragEnd = async (result) => {
    if (!result.destination) {
      return;
    }

    const newEmployees = Array.from(employees);
    const [reorderedItem] = newEmployees.splice(result.source.index, 1);
    newEmployees.splice(result.destination.index, 0, reorderedItem);

    const updatedEmployees = newEmployees.map((employee, index) => ({
      ...employee,
      order: index
    }));

    reorderEmployees(department, updatedEmployees);
  };

  const handleUpdateShift = (employeeId, day, shiftId) => {
    updateShift(department, tabId, selectedYear, selectedWeek, employeeId, day, shiftId);
  };

  const calculateTotalHours = useCallback((employee) => {
    if (!employee || !employee.id) {
      return 0;
    }
    const shiftKey = `${department}-${selectedYear}-${selectedWeek}`;
    const employeeShift = shifts[shiftKey]?.find(shift => shift.employeeId === employee.id);
    if (!employeeShift) return 0;

    return days.reduce((total, day) => {
      const shiftId = employeeShift[day];
      const shift = customShifts.find(s => s.id === shiftId);
      if (shift && !shift.isTextShift) {
        const [start, end] = shift.shift.split('-').map(Number);
        let hours;
        if (end < start) {
          // Shift goes past midnight
          hours = (24 - start) + end;
        } else {
          hours = end - start;
        }
        if (hours >= 5) {
          hours -= 0.5; // Subtract 30 minutes for shifts of 5 hours or more
        }
        return total + hours;
      }
      return total;
    }, 0);
  }, [shifts, customShifts, days, department, selectedYear, selectedWeek]);

  const handleCommentChange = (e) => {
    const newComment = e.target.value;
    setComment(newComment);
    saveComment(newComment);
  };

  const saveComment = useCallback(async (newComment) => {
    try {
      const commentRef = doc(db, "comments", `${department}-${selectedYear}-${selectedWeek}`);
      await setDoc(commentRef, { text: newComment }, { merge: true });
    } catch (err) {
      console.error("Error saving comment:", err);
    }
  }, [department, selectedYear, selectedWeek]);

  const weekDates = useMemo(() => {
    return days.map((day, index) => {
      const date = new Date(getDateOfISOWeek(selectedWeek, selectedYear));
      date.setDate(date.getDate() + index);
      return formatDate(date);
    });
  }, [selectedWeek, selectedYear]);

  useEffect(() => {
    const fetchComment = async () => {
      try {
        const commentRef = doc(db, "comments", `${department}-${selectedYear}-${selectedWeek}`);
        const commentDoc = await getDoc(commentRef);
        if (commentDoc.exists()) {
          setComment(commentDoc.data().text);
        } else {
          setComment('');
        }
      } catch (err) {
        console.error("Error fetching comment:", err);
      }
    };
    fetchComment();
  }, [department, selectedYear, selectedWeek]);

  const clearSchedule = async () => {
    const confirmClear = window.confirm(`Er du sikker på at du vil tømme vaktliste for uke ${selectedWeek}?`);
    if (confirmClear) {
      try {
        const shiftsQuery = query(
          collection(db, "employeeShifts"),
          where("department", "==", department),
          where("year", "==", selectedYear),
          where("week", "==", selectedWeek)
        );
        const shiftsSnapshot = await getDocs(shiftsQuery);
        
        const batch = writeBatch(db);
        shiftsSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();

        // Clear shifts from local state
        await clearShifts(department, selectedYear, selectedWeek);

        // Refresh the data
        fetchEmployeesAndShifts(department, tabId, selectedYear, selectedWeek);
      } catch (err) {
        console.error("Error clearing schedule:", err);
        alert("Det oppstod en feil ved tømming av vaktlisten. Vennligst prøv igjen.");
      }
    }
  };

  const handleExportSchedule = () => {
    exportSchedule(shiftTableRef, selectedWeek, selectedYear, comment, department);
  };

  if (loading) {
    return <div className="shift-schedule loading">Loading...</div>;
  }
  
  if (error) {
    return <div className="shift-schedule error">{error}</div>;
  }

  const shiftKey = `${department}-${selectedYear}-${selectedWeek}`;
  const currentShifts = shifts[shiftKey] || [];

  return (
    <div className="shift-schedule">
      <div className="management-buttons">
        <button onClick={() => setIsEmployeeModalOpen(true)} className="manage-employees-btn">Manage Employees</button>
        <button onClick={() => setIsShiftModalOpen(true)} className="manage-shifts-btn">Manage Shifts</button>
        <button onClick={handleExportSchedule} className="export-btn">Eksporter Vaktliste</button>
      </div>
      <WeekSelector
        selectedYear={selectedYear}
        selectedWeek={selectedWeek}
        setSelectedYear={setSelectedYear}
        setSelectedWeek={setSelectedWeek}
      />
      {employees.length > 0 ? (
        <ShiftTable
          ref={shiftTableRef}
          employees={employees}
          shifts={currentShifts}
          customShifts={customShifts}
          days={days}
          weekDates={weekDates}
          updateShift={handleUpdateShift}
          calculateTotalHours={calculateTotalHours}
          onDragEnd={onDragEnd}
        />
      ) : (
        <div className="no-employees">
          <p>No employees found. Please add employees to create a schedule.</p>
          <button onClick={() => setIsEmployeeModalOpen(true)} className="add-employee-btn">Add Employees</button>
        </div>
      )}
      <button onClick={clearSchedule} className="clear-schedule-btn">Tøm vaktliste</button>
      <CommentSection
        selectedWeek={selectedWeek}
        comment={comment}
        handleCommentChange={handleCommentChange}
      />
      <EmployeeListModal 
        isOpen={isEmployeeModalOpen} 
        onClose={() => {
          setIsEmployeeModalOpen(false);
          fetchEmployeesAndShifts(department, tabId, selectedYear, selectedWeek);
        }} 
        department={department}
      />
      <ShiftManagementModal
        isOpen={isShiftModalOpen}
        onClose={() => {
          setIsShiftModalOpen(false);
          fetchEmployeesAndShifts(department, tabId, selectedYear, selectedWeek);
        }}
        department={department}
      />
    </div>
  );
};

export default ShiftSchedule;