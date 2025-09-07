import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

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

  // Mock initial customers data
  const initialCustomers = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+233 24 123 4567',
      address: '123 Main Street, Accra, Ghana',
      customerType: 'Regular'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+233 26 987 6543',
      address: '456 Oak Avenue, Kumasi, Ghana',
      customerType: 'Premium'
    },
    {
      id: '3',
      name: 'Mike Wilson',
      email: 'mike.wilson@example.com',
      phone: '+233 20 555 1234',
      address: '789 Pine Road, Tema, Ghana',
      customerType: 'VIP'
    },
    {
      id: '4',
      name: 'Lisa Brown',
      email: 'lisa.brown@example.com',
      phone: '+233 27 777 8888',
      address: '321 Elm Street, Accra, Ghana',
      customerType: 'Regular'
    },
    {
      id: '5',
      name: 'David Lee',
      email: 'david.lee@example.com',
      phone: '+233 28 111 2222',
      address: '654 Maple Avenue, Kumasi, Ghana',
      customerType: 'Premium'
    }
  ];

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCustomers();
      setCustomers(response.customers || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
      // Fallback to mock data if API fails
      setCustomers(initialCustomers);
    } finally {
      setLoading(false);
    }
  };

  // Add new customer
  const addCustomer = async (customerData) => {
    try {
      const response = await apiService.createCustomer(customerData);
      const newCustomer = response.customer;
      setCustomers(prev => [...prev, newCustomer]);
      return newCustomer;
    } catch (error) {
      console.error('Failed to create customer:', error);
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

