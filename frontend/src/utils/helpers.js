// Format date to a readable string
export const formatDate = (dateString) => {
    if (dateString === null || dateString === undefined || dateString === '') {
      return 'Invalid Date';
    }
    
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString(undefined, options);
  };
  
  // Convert seconds to a formatted time string (MM:SS)
  export const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(Math.abs(seconds % 60));
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Sort items by a specific field
  export const sortByField = (items, field, direction = 'asc') => {
    return [...items].sort((a, b) => {
      if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
      if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };
  
  // Filter items by search term
  export const filterBySearchTerm = (items, searchTerm, fields) => {
    if (!searchTerm) return items;
    
    const lowercasedTerm = searchTerm.trim().toLowerCase();
    
    return items.filter(item => {
      return fields.some(field => {
        const value = item[field];
        if (!value) return false;
        return value.toString().toLowerCase().includes(lowercasedTerm);
      });
    });
  };