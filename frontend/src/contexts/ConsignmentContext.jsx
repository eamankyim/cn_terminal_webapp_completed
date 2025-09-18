import React, { createContext, useContext, useState, useEffect } from 'react';
import consignmentService from '../services/consignmentService';

const ConsignmentContext = createContext();

export const useConsignments = () => {
  const context = useContext(ConsignmentContext);
  if (!context) {
    throw new Error('useConsignments must be used within a ConsignmentProvider');
  }
  return context;
};

export const ConsignmentProvider = ({ children }) => {
  const [consignments, setConsignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load consignments for a specific customer
  const loadConsignmentsByCustomer = async (customerId) => {
    if (!customerId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await consignmentService.getConsignmentsByCustomer(customerId);
      setConsignments(response.consignments || []);
    } catch (err) {
      console.error('Error loading consignments:', err);
      setError(err.message || 'Failed to load consignments');
    } finally {
      setLoading(false);
    }
  };

  // Load all consignments
  const loadAllConsignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await consignmentService.getAllConsignments();
      setConsignments(response.consignments || []);
    } catch (err) {
      console.error('Error loading all consignments:', err);
      setError(err.message || 'Failed to load consignments');
    } finally {
      setLoading(false);
    }
  };

  // Add new consignment
  const addConsignment = async (consignmentData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await consignmentService.createConsignment(consignmentData);
      setConsignments(prev => [response.consignment, ...prev]);
      return response.consignment;
    } catch (err) {
      console.error('Error adding consignment:', err);
      setError(err.message || 'Failed to add consignment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update consignment
  const updateConsignment = async (id, consignmentData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await consignmentService.updateConsignment(id, consignmentData);
      setConsignments(prev => 
        prev.map(consignment => 
          consignment.id === id ? response.consignment : consignment
        )
      );
      return response.consignment;
    } catch (err) {
      console.error('Error updating consignment:', err);
      setError(err.message || 'Failed to update consignment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete consignment
  const deleteConsignment = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await consignmentService.deleteConsignment(id);
      setConsignments(prev => prev.filter(consignment => consignment.id !== id));
    } catch (err) {
      console.error('Error deleting consignment:', err);
      setError(err.message || 'Failed to delete consignment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update consignment status
  const updateConsignmentStatus = async (id, status) => {
    setLoading(true);
    setError(null);
    try {
      const response = await consignmentService.updateConsignmentStatus(id, status);
      setConsignments(prev => 
        prev.map(consignment => 
          consignment.id === id ? response.consignment : consignment
        )
      );
      return response.consignment;
    } catch (err) {
      console.error('Error updating consignment status:', err);
      setError(err.message || 'Failed to update consignment status');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear consignments
  const clearConsignments = () => {
    setConsignments([]);
    setError(null);
  };

  const value = {
    consignments,
    loading,
    error,
    loadConsignmentsByCustomer,
    loadAllConsignments,
    addConsignment,
    updateConsignment,
    deleteConsignment,
    updateConsignmentStatus,
    clearConsignments
  };

  return (
    <ConsignmentContext.Provider value={value}>
      {children}
    </ConsignmentContext.Provider>
  );
};

export default ConsignmentContext;


