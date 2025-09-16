import { formatDate, formatTime, sortByField, filterBySearchTerm } from '../helpers';

describe('Helper Utilities', () => {
  describe('formatDate', () => {
    // Mock Date to ensure consistent testing across different timezones
    const originalToLocaleDateString = Date.prototype.toLocaleDateString;

    beforeEach(() => {
      // Mock toLocaleDateString to return predictable results
      Date.prototype.toLocaleDateString = jest.fn().mockReturnValue('October 15, 2023 at 10:30 AM');
    });

    afterEach(() => {
      Date.prototype.toLocaleDateString = originalToLocaleDateString;
    });

    it('formats a valid date string correctly', () => {
      const result = formatDate('2023-10-15T10:30:00Z');

      expect(Date.prototype.toLocaleDateString).toHaveBeenCalledWith(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      expect(result).toBe('October 15, 2023 at 10:30 AM');
    });

    it('handles different date string formats', () => {
      formatDate('2023-10-15');
      formatDate('10/15/2023');
      formatDate('Oct 15, 2023');

      expect(Date.prototype.toLocaleDateString).toHaveBeenCalledTimes(3);
    });

    it('handles Date object input', () => {
      const date = new Date('2023-10-15T10:30:00Z');
      formatDate(date);

      expect(Date.prototype.toLocaleDateString).toHaveBeenCalled();
    });

    it('handles invalid date strings', () => {
      Date.prototype.toLocaleDateString = originalToLocaleDateString;
      
      const result = formatDate('invalid-date');
      
      expect(result).toBe('Invalid Date');
    });

    it('handles null and undefined inputs', () => {
      Date.prototype.toLocaleDateString = originalToLocaleDateString;
      
      expect(formatDate(null)).toBe('Invalid Date');
      expect(formatDate(undefined)).toBe('Invalid Date');
    });

    it('handles empty string input', () => {
      Date.prototype.toLocaleDateString = originalToLocaleDateString;
      
      expect(formatDate('')).toBe('Invalid Date');
    });
  });

  describe('formatTime', () => {
    it('formats seconds to MM:SS format correctly', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(30)).toBe('00:30');
      expect(formatTime(60)).toBe('01:00');
      expect(formatTime(90)).toBe('01:30');
      expect(formatTime(125)).toBe('02:05');
      expect(formatTime(3661)).toBe('61:01'); // Over an hour
    });

    it('pads single digits with zeros', () => {
      expect(formatTime(5)).toBe('00:05');
      expect(formatTime(65)).toBe('01:05');
      expect(formatTime(305)).toBe('05:05');
    });

    it('handles large numbers correctly', () => {
      expect(formatTime(3600)).toBe('60:00'); // 1 hour
      expect(formatTime(7200)).toBe('120:00'); // 2 hours
      expect(formatTime(3665)).toBe('61:05'); // 1 hour 1 minute 5 seconds
    });

    it('handles decimal seconds by truncating', () => {
      expect(formatTime(90.7)).toBe('01:30'); // Math.floor behavior
      expect(formatTime(125.9)).toBe('02:05');
    });

    it('handles negative numbers', () => {
      expect(formatTime(-30)).toBe('-1:30'); // JavaScript modulo with negative numbers
      expect(formatTime(-90)).toBe('-2:30');
    });

    it('handles zero correctly', () => {
      expect(formatTime(0)).toBe('00:00');
    });

    it('handles very large numbers', () => {
      expect(formatTime(999999)).toBe('16666:39'); // 16666 minutes and 39 seconds
    });
  });

  describe('sortByField', () => {
    const mockItems = [
      { name: 'Charlie', age: 25, created: '2023-01-01' },
      { name: 'Alice', age: 30, created: '2023-01-03' },
      { name: 'Bob', age: 20, created: '2023-01-02' }
    ];

    it('sorts by string field in ascending order by default', () => {
      const result = sortByField(mockItems, 'name');

      expect(result).toEqual([
        { name: 'Alice', age: 30, created: '2023-01-03' },
        { name: 'Bob', age: 20, created: '2023-01-02' },
        { name: 'Charlie', age: 25, created: '2023-01-01' }
      ]);
    });

    it('sorts by number field in ascending order', () => {
      const result = sortByField(mockItems, 'age');

      expect(result).toEqual([
        { name: 'Bob', age: 20, created: '2023-01-02' },
        { name: 'Charlie', age: 25, created: '2023-01-01' },
        { name: 'Alice', age: 30, created: '2023-01-03' }
      ]);
    });

    it('sorts by string field in descending order', () => {
      const result = sortByField(mockItems, 'name', 'desc');

      expect(result).toEqual([
        { name: 'Charlie', age: 25, created: '2023-01-01' },
        { name: 'Bob', age: 20, created: '2023-01-02' },
        { name: 'Alice', age: 30, created: '2023-01-03' }
      ]);
    });

    it('sorts by number field in descending order', () => {
      const result = sortByField(mockItems, 'age', 'desc');

      expect(result).toEqual([
        { name: 'Alice', age: 30, created: '2023-01-03' },
        { name: 'Charlie', age: 25, created: '2023-01-01' },
        { name: 'Bob', age: 20, created: '2023-01-02' }
      ]);
    });

    it('does not mutate the original array', () => {
      const original = [...mockItems];
      const result = sortByField(mockItems, 'name');

      expect(mockItems).toEqual(original); // Original unchanged
      expect(result).not.toBe(mockItems); // Different reference
    });

    it('handles empty array', () => {
      const result = sortByField([], 'name');

      expect(result).toEqual([]);
    });

    it('handles array with one item', () => {
      const singleItem = [{ name: 'Solo', age: 25 }];
      const result = sortByField(singleItem, 'name');

      expect(result).toEqual(singleItem);
    });

    it('handles missing field gracefully', () => {
      const itemsWithMissingField = [
        { name: 'Alice', age: 30 },
        { name: 'Bob' }, // Missing age
        { name: 'Charlie', age: 25 }
      ];

      const result = sortByField(itemsWithMissingField, 'age');

      // Items with missing field should be sorted to one end
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Bob'); // undefined < numbers
    });

    it('handles null and undefined values in fields', () => {
      const itemsWithNullValues = [
        { name: 'Alice', value: 30 },
        { name: 'Bob', value: null },
        { name: 'Charlie', value: undefined },
        { name: 'David', value: 10 }
      ];

      const result = sortByField(itemsWithNullValues, 'value');

      expect(result).toHaveLength(4);
      // null and undefined should be sorted before numbers
      expect([result[0].name, result[1].name]).toEqual(expect.arrayContaining(['Bob', 'Charlie']));
    });

    it('handles date strings correctly', () => {
      const result = sortByField(mockItems, 'created');

      expect(result).toEqual([
        { name: 'Charlie', age: 25, created: '2023-01-01' },
        { name: 'Bob', age: 20, created: '2023-01-02' },
        { name: 'Alice', age: 30, created: '2023-01-03' }
      ]);
    });

    it('maintains stable sort for equal values', () => {
      const itemsWithEqualValues = [
        { name: 'First', value: 1 },
        { name: 'Second', value: 1 },
        { name: 'Third', value: 1 }
      ];

      const result = sortByField(itemsWithEqualValues, 'value');

      // Should maintain original order for equal values
      expect(result[0].name).toBe('First');
      expect(result[1].name).toBe('Second');
      expect(result[2].name).toBe('Third');
    });
  });

  describe('filterBySearchTerm', () => {
    const mockItems = [
      { name: 'Alice Johnson', email: 'alice@example.com', role: 'researcher' },
      { name: 'Bob Smith', email: 'bob@test.com', role: 'admin' },
      { name: 'Charlie Brown', email: 'charlie@example.org', role: 'user' },
      { name: 'David Wilson', email: 'david@company.com', role: 'researcher' }
    ];

    it('returns all items when search term is empty', () => {
      const result = filterBySearchTerm(mockItems, '', ['name', 'email']);

      expect(result).toEqual(mockItems);
    });

    it('returns all items when search term is null or undefined', () => {
      expect(filterBySearchTerm(mockItems, null, ['name'])).toEqual(mockItems);
      expect(filterBySearchTerm(mockItems, undefined, ['name'])).toEqual(mockItems);
    });

    it('filters by single field correctly', () => {
      const result = filterBySearchTerm(mockItems, 'alice', ['name']);

      expect(result).toEqual([
        { name: 'Alice Johnson', email: 'alice@example.com', role: 'researcher' }
      ]);
    });

    it('is case insensitive', () => {
      const result = filterBySearchTerm(mockItems, 'ALICE', ['name']);

      expect(result).toEqual([
        { name: 'Alice Johnson', email: 'alice@example.com', role: 'researcher' }
      ]);
    });

    it('filters by multiple fields', () => {
      const result = filterBySearchTerm(mockItems, 'example', ['name', 'email']);

      expect(result).toEqual([
        { name: 'Alice Johnson', email: 'alice@example.com', role: 'researcher' },
        { name: 'Charlie Brown', email: 'charlie@example.org', role: 'researcher' }
      ]);
    });

    it('returns items that match any of the specified fields', () => {
      const result = filterBySearchTerm(mockItems, 'smith', ['name', 'email', 'role']);

      expect(result).toEqual([
        { name: 'Bob Smith', email: 'bob@test.com', role: 'admin' }
      ]);
    });

    it('handles partial matches', () => {
      const result = filterBySearchTerm(mockItems, 'john', ['name']);

      expect(result).toEqual([
        { name: 'Alice Johnson', email: 'alice@example.com', role: 'researcher' }
      ]);
    });

    it('returns empty array when no matches found', () => {
      const result = filterBySearchTerm(mockItems, 'xyz123', ['name', 'email']);

      expect(result).toEqual([]);
    });

    it('handles empty array input', () => {
      const result = filterBySearchTerm([], 'search', ['field']);

      expect(result).toEqual([]);
    });

    it('handles items with missing field values', () => {
      const itemsWithMissingFields = [
        { name: 'Alice', email: 'alice@test.com' },
        { name: 'Bob' }, // Missing email
        { email: 'charlie@test.com' }, // Missing name
        { name: 'David', email: 'david@test.com' }
      ];

      const result = filterBySearchTerm(itemsWithMissingFields, 'alice', ['name', 'email']);

      expect(result).toEqual([
        { name: 'Alice', email: 'alice@test.com' }
      ]);
    });

    it('handles null and undefined field values', () => {
      const itemsWithNullFields = [
        { name: 'Alice', email: null },
        { name: null, email: 'bob@test.com' },
        { name: 'Charlie', email: undefined },
        { name: 'David', email: 'david@test.com' }
      ];

      const result = filterBySearchTerm(itemsWithNullFields, 'david', ['name', 'email']);

      expect(result).toEqual([
        { name: 'David', email: 'david@test.com' }
      ]);
    });

    it('handles numeric field values', () => {
      const itemsWithNumbers = [
        { name: 'Item 1', id: 123 },
        { name: 'Item 2', id: 456 },
        { name: 'Item 3', id: 789 }
      ];

      const result = filterBySearchTerm(itemsWithNumbers, '123', ['name', 'id']);

      expect(result).toEqual([
        { name: 'Item 1', id: 123 }
      ]);
    });

    it('handles boolean field values', () => {
      const itemsWithBooleans = [
        { name: 'Item 1', active: true },
        { name: 'Item 2', active: false },
        { name: 'Item 3', active: true }
      ];

      const result = filterBySearchTerm(itemsWithBooleans, 'true', ['name', 'active']);

      expect(result).toEqual([
        { name: 'Item 1', active: true },
        { name: 'Item 3', active: true }
      ]);
    });

    it('handles multiple words in search term', () => {
      const result = filterBySearchTerm(mockItems, 'alice johnson', ['name']);

      expect(result).toEqual([
        { name: 'Alice Johnson', email: 'alice@example.com', role: 'researcher' }
      ]);
    });

    it('handles whitespace in search term', () => {
      const result = filterBySearchTerm(mockItems, '  alice  ', ['name']);

      // Should trim and search for 'alice'
      expect(result).toEqual([
        { name: 'Alice Johnson', email: 'alice@example.com', role: 'researcher' }
      ]);
    });

    it('does not mutate the original array', () => {
      const original = [...mockItems];
      const result = filterBySearchTerm(mockItems, 'alice', ['name']);

      expect(mockItems).toEqual(original); // Original unchanged
      expect(result).not.toBe(mockItems); // Different reference
    });

    it('handles special characters in search term', () => {
      const itemsWithSpecialChars = [
        { name: 'test@domain.com', value: 'email-like' },
        { name: 'user123!', value: 'with-exclamation' },
        { name: 'normal name', value: 'regular' }
      ];

      const result = filterBySearchTerm(itemsWithSpecialChars, '@domain', ['name']);

      expect(result).toEqual([
        { name: 'test@domain.com', value: 'email-like' }
      ]);
    });
  });

  describe('Integration Tests', () => {
    const complexItems = [
      { name: 'Alice Johnson', age: 30, department: 'Engineering', created: '2023-01-15T10:30:00Z' },
      { name: 'Bob Smith', age: 25, department: 'Marketing', created: '2023-02-20T14:15:00Z' },
      { name: 'Charlie Brown', age: 35, department: 'Engineering', created: '2023-01-10T09:45:00Z' },
      { name: 'Diana Prince', age: 28, department: 'HR', created: '2023-03-05T16:20:00Z' }
    ];

    it('combines filtering and sorting operations', () => {
      // First filter by department, then sort by age
      const filtered = filterBySearchTerm(complexItems, 'engineering', ['department']);
      const result = sortByField(filtered, 'age');

      expect(result).toEqual([
        { name: 'Alice Johnson', age: 30, department: 'Engineering', created: '2023-01-15T10:30:00Z' },
        { name: 'Charlie Brown', age: 35, department: 'Engineering', created: '2023-01-10T09:45:00Z' }
      ]);
    });

    it('works with all utility functions together', () => {
      // Filter, sort, and format
      const filtered = filterBySearchTerm(complexItems, 'alice', ['name']);
      const sorted = sortByField(filtered, 'age', 'desc');
      
      expect(sorted).toHaveLength(1);
      expect(sorted[0].name).toBe('Alice Johnson');

      // Format the creation date
      const formattedDate = formatDate(sorted[0].created);
      expect(typeof formattedDate).toBe('string');

      // Format age as time (just for testing)
      const formattedAge = formatTime(sorted[0].age);
      expect(formattedAge).toBe('00:30'); // 30 seconds
    });
  });
});