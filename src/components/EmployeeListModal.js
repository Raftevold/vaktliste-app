import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
import './EmployeeListModal.css';

// Simple logging function
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  console[type](`[${timestamp}] EmployeeListModal: ${message}`);
};

const EmployeeListModal = ({ isOpen, onClose, department }) => {
  const [newEmployee, setNewEmployee] = useState({ name: '', role: '' });
  const [error, setError] = useState(null);
  const [roles, setRoles] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    log(`Fetching employees for department: ${department}`);
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "employees"), where("department", "==", department));
      const querySnapshot = await getDocs(q);
      const employeesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const rolesData = {};
      employeesData.forEach(employee => {
        if (!rolesData[employee.role]) {
          rolesData[employee.role] = { color: employee.roleColor || '#ffffff', employees: [] };
        }
        rolesData[employee.role].employees.push(employee);
      });
      setRoles(rolesData);
      log(`Fetched ${employeesData.length} employees`);
    } catch (err) {
      log(`Error fetching employees: ${err.message}`, 'error');
      setError(`Failed to fetch employees: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [department]);

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen, fetchEmployees]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee(prev => ({ ...prev, [name]: value }));
  };

  const addEmployee = async (e) => {
    e.preventDefault();
    log(`Adding new employee: ${newEmployee.name}, role: ${newEmployee.role}`);
    setError(null);
    try {
      await addDoc(collection(db, "employees"), {
        ...newEmployee,
        department,
        roleColor: roles[newEmployee.role]?.color || '#ffffff',
        isActive: true
      });
      setNewEmployee({ name: '', role: '' });
      log(`Employee ${newEmployee.name} added successfully`);
      fetchEmployees();
    } catch (err) {
      log(`Error adding employee: ${err.message}`, 'error');
      setError(`Failed to add employee: ${err.message}`);
    }
  };

  const deleteEmployee = async (employeeId) => {
    if (window.confirm("Are you sure you want to delete this employee? This action cannot be undone.")) {
      log(`Deleting employee with ID: ${employeeId}`);
      setError(null);
      try {
        await deleteDoc(doc(db, "employees", employeeId));
        log(`Employee with ID ${employeeId} deleted successfully`);
        fetchEmployees();
      } catch (err) {
        log(`Error deleting employee: ${err.message}`, 'error');
        setError(`Failed to delete employee: ${err.message}`);
      }
    }
  };

  const updateRoleColor = async (role, color) => {
    log(`Updating color for role: ${role} to ${color}`);
    setError(null);
    try {
      const batch = writeBatch(db);
      const q = query(collection(db, "employees"), where("department", "==", department), where("role", "==", role));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        batch.update(doc.ref, { roleColor: color });
      });
      await batch.commit();
      log(`Color updated successfully for role: ${role}`);
      fetchEmployees();
    } catch (err) {
      log(`Error updating role color: ${err.message}`, 'error');
      setError(`Failed to update role color: ${err.message}`);
    }
  };

  const toggleEmployeeStatus = async (employeeId, currentStatus) => {
    log(`Toggling status for employee ID: ${employeeId}`);
    setError(null);
    try {
      const employeeRef = doc(db, "employees", employeeId);
      await updateDoc(employeeRef, { isActive: !currentStatus });
      log(`Status toggled successfully for employee ID: ${employeeId}`);
      fetchEmployees();
    } catch (err) {
      log(`Error toggling employee status: ${err.message}`, 'error');
      setError(`Failed to update employee status: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Manage Employees</h2>
        {error && <p className="error">{error}</p>}
        {loading ? (
          <p>Loading employees...</p>
        ) : (
          <>
            <form onSubmit={addEmployee} className="add-employee-form">
              <input
                type="text"
                name="name"
                value={newEmployee.name}
                onChange={handleInputChange}
                placeholder="Employee Name"
                required
              />
              <input
                type="text"
                name="role"
                value={newEmployee.role}
                onChange={handleInputChange}
                placeholder="Employee Role"
                required
              />
              <button type="submit">Add Employee</button>
            </form>
            <div className="employee-list">
              {Object.entries(roles).map(([role, { color, employees }]) => (
                <div key={role} className="role-group">
                  <h3>
                    {role}
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => updateRoleColor(role, e.target.value)}
                    />
                  </h3>
                  <ul>
                    {employees.map(employee => (
                      <li key={employee.id} className="employee-item">
                        <div className="employee-info">
                          <input 
                            type="checkbox" 
                            checked={employee.isActive} 
                            onChange={() => toggleEmployeeStatus(employee.id, employee.isActive)}
                          />
                          <span>{employee.name}</span>
                        </div>
                        <button onClick={() => deleteEmployee(employee.id)} className="delete-btn" title="Delete employee">
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}
        <button onClick={onClose} className="close-btn">Close</button>
      </div>
    </div>
  );
};

export default EmployeeListModal;