// Contact configuration for WhatsApp and other contact methods
export const CONTACT_CONFIG = {
  whatsapp: {
    primary: {
      number: '244123456', // Without country code
      display: '+233 24 412 3456',
      name: 'CN Terminal Support'
    },
    secondary: {
      number: '244123457',
      display: '+233 24 412 3457', 
      name: 'CN Terminal Sales'
    }
  },
  phone: {
    primary: '+233244123456',
    display: '+233 24 412 3456'
  },
  email: {
    primary: 'info@cnterminal.com',
    support: 'support@cnterminal.com',
    sales: 'sales@cnterminal.com'
  },
  business: {
    name: 'CN Terminal',
    address: 'Accra, Ghana',
    hours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-2PM'
  }
};

export default CONTACT_CONFIG;


