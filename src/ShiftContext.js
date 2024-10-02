import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc, writeBatch, setDoc, updateDoc } from 'firebase/firestore';
import { getWeekNumber, sortShifts } from './utils/dateUtils';

const ShiftContext = createContext();

export const useShiftContext = () => useContext(ShiftContext);

export const ShiftProvider = ({ children }) => {
  const [shifts, setShifts] = useState({});
  const [employees, setEmployees] = useState([]);
  const [customShifts, setCustomShifts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState({});

  const fetchEmployeesAndShifts = useCallback(async (department, tabId, selectedYear, selectedWeek) => {
    const fetchKey = `${department}-${selectedYear}-${selectedWeek}`;
    if (lastFetch[fetchKey] && Date.now() - lastFetch[fetchKey] < 5000) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const employeesQuery = query(collection(db, "employees"), where("department", "==", department), where("isActive", "==", true));
      const employeesSnapshot = await getDocs(employeesQuery);
      const employeesData = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      employeesData.sort((a, b) => ((a?.order ?? 0) - (b?.order ?? 0)));
      setEmployees(employeesData);

      const shiftsQuery = query(collection(db, "employeeShifts"), 
        where("department", "==", department), 
        where("year", "==", selectedYear), 
        where("week", "==", selectedWeek)
      );
      const shiftsSnapshot = await getDocs(shiftsQuery);
      const shiftsData = shiftsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setShifts(prevShifts => ({
        ...prevShifts,
        [fetchKey]: shiftsData
      }));

      const customShiftsQuery = query(collection(db, "shifts"), where("department", "==", department), where("isActive", "==", true));
      const customShiftsSnapshot = await getDocs(customShiftsQuery);
      const customShiftsData = customShiftsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomShifts(sortShifts(customShiftsData));

      setLastFetch(prev => ({ ...prev, [fetchKey]: Date.now() }));
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateShift = useCallback(async (department, tabId, selectedYear, selectedWeek, employeeId, day, shiftId) => {
    try {
      if (!employeeId) {
        return;
      }

      const shiftKey = `${department}-${selectedYear}-${selectedWeek}`;
      
      setShifts(prevShifts => {
        const currentShifts = prevShifts[shiftKey] ?? [];
        let employeeShift = currentShifts.find(shift => shift?.employeeId === employeeId);
        
        if (employeeShift) {
          const updatedShifts = currentShifts.map(shift => 
            shift?.id === employeeShift?.id 
              ? { ...shift, [day]: shiftId } 
              : shift
          );

          // Update in Firestore
          const shiftRef = doc(db, "employeeShifts", employeeShift.id);
          updateDoc(shiftRef, { [day]: shiftId });

          return {
            ...prevShifts,
            [shiftKey]: updatedShifts
          };
        } else {
          const newShift = {
            employeeId,
            department,
            year: selectedYear,
            week: selectedWeek,
            [day]: shiftId
          };

          // Add to Firestore
          setDoc(doc(collection(db, "employeeShifts")), newShift);

          return {
            ...prevShifts,
            [shiftKey]: [...currentShifts, newShift]
          };
        }
      });
    } catch (err) {
      setError("Failed to update shift. Please try again.");
    }
  }, []);

  const reorderEmployees = useCallback(async (department, updatedEmployees) => {
    try {
      const batch = writeBatch(db);
      updatedEmployees.forEach((employee) => {
        if (employee?.id) {
          const employeeRef = doc(db, "employees", employee.id);
          batch.update(employeeRef, { order: employee.order });
        }
      });
      await batch.commit();
      setEmployees(updatedEmployees);
    } catch (err) {
      setError("Failed to update employee order. Please try again.");
    }
  }, []);

  const clearShifts = useCallback(async (department, selectedYear, selectedWeek) => {
    const shiftKey = `${department}-${selectedYear}-${selectedWeek}`;
    setShifts(prevShifts => ({
      ...prevShifts,
      [shiftKey]: []
    }));
  }, []);

  const getShiftsForWeek = useCallback((department, selectedYear, selectedWeek) => {
    const shiftKey = `${department}-${selectedYear}-${selectedWeek}`;
    return shifts[shiftKey] ?? [];
  }, [shifts]);

  const value = useMemo(() => ({
    shifts,
    setShifts,
    employees,
    customShifts,
    error,
    loading,
    fetchEmployeesAndShifts,
    updateShift,
    reorderEmployees,
    clearShifts,
    getShiftsForWeek
  }), [shifts, employees, customShifts, error, loading, fetchEmployeesAndShifts, updateShift, reorderEmployees, clearShifts, getShiftsForWeek]);

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
};