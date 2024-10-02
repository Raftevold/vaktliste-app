import React, { useState, useEffect, useCallback } from 'react';
import ShiftSchedule from './ShiftSchedule';
import { db } from '../firebase';
import { collection, query, getDocs, where, doc, setDoc } from 'firebase/firestore';
import './TabSystem.css';

const TabSystem = ({ department }) => {
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTabs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "tabs"), where("department", "==", department));
      const querySnapshot = await getDocs(q);
      let tabsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Ensure we always have exactly 4 tabs
      while (tabsData.length < 4) {
        const newTabNumber = tabsData.length + 1;
        const newTab = {
          name: newTabNumber.toString(),
          department: department
        };
        const docRef = await setDoc(doc(collection(db, "tabs")), newTab);
        tabsData.push({ id: docRef.id, ...newTab });
      }

      // If we have more than 4 tabs, only keep the first 4
      tabsData = tabsData.slice(0, 4);

      // Ensure tab names are "1", "2", "3", "4"
      tabsData.forEach((tab, index) => {
        tab.name = (index + 1).toString();
      });

      setTabs(tabsData);
      if (tabsData.length > 0 && tabsData[0].id) {
        setActiveTab(tabsData[0].id);
      } else {
        setError('No valid tabs found');
      }
    } catch (err) {
      setError(`Failed to fetch tabs. Please try again. Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [department]);

  useEffect(() => {
    fetchTabs();
  }, [fetchTabs]);

  if (loading) {
    return <div className="loading">Loading tabs...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={fetchTabs}>Retry</button>
      </div>
    );
  }

  return (
    <div className="tab-system">
      <div className="tab-header">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {activeTab && (
          <ShiftSchedule
            department={department}
            tabId={activeTab}
            key={activeTab}
          />
        )}
      </div>
    </div>
  );
};

export default TabSystem;