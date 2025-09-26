import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';
import { useAuth } from './AuthContext';

const CustomerContext = createContext();

export const useCustomers = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};

export const CustomerProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();


  // Load customers when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCustomers();
    } else {
      // Clear customers when not authenticated
      setCustomers([]);
    }
  }, [isAuthenticated]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCustomers();
      setCustomers(response.customers || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
      // Set empty array if API fails
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Add new customer
  const addCustomer = async (customerData) => {
    try {
      console.log('🔄 CustomerContext: Creating customer with data:', customerData);
      const response = await apiService.createCustomer(customerData);
      console.log('✅ CustomerContext: API response:', response);
      const newCustomer = response.customer;
      console.log('📝 CustomerContext: New customer:', newCustomer);
      setCustomers(prev => [...prev, newCustomer]);
      console.log('💾 CustomerContext: Updated customers list');
      return newCustomer;
    } catch (error) {
      console.error('💥 CustomerContext: Failed to create customer:', error);
      throw error;
    }
  };

  // Update existing customer
  const updateCustomer = async (id, customerData) => {
    try {
      const response = await apiService.updateCustomer(id, customerData);
      const updatedCustomer = response.customer;
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === id ? updatedCustomer : customer
        )
      );
      return updatedCustomer;
    } catch (error) {
      console.error('Failed to update customer:', error);
      throw error;
    }
  };

  // Delete customer
  const deleteCustomer = async (id) => {
    try {
      await apiService.deleteCustomer(id);
      setCustomers(prev => prev.filter(customer => customer.id !== id));
    } catch (error) {
      console.error('Failed to delete customer:', error);
      throw error;
    }
  };

  // Get customer by ID
  const getCustomerById = (id) => {
    return customers.find(customer => customer.id === id);
  };

  // Search customers
  const searchCustomers = (searchTerm) => {
    const term = searchTerm.toLowerCase();
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(term) ||
      customer.email.toLowerCase().includes(term) ||
      customer.phone.includes(term)
    );
  };

  const value = {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerById,
    searchCustomers
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};

export default CustomerContext;

