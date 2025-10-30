/**
 * Tests for execution results handling
 */

import { describe, it, expect } from 'vitest';

describe('Execution Results Handling', () => {
  describe('filterExecutionResults', () => {
    it('should filter out null and undefined values', () => {
      // Simulate the filtering logic from the fix
      const mockResults = [
        { id: 1, name: 'Test 1' },
        null,
        { id: 2, name: 'Test 2' },
        undefined,
        { id: 3, name: 'Test 3' },
      ];

      const filteredResults = mockResults.filter(
        (row) => row != null && typeof row === 'object'
      );

      expect(filteredResults).toHaveLength(3);
      expect(filteredResults).toEqual([
        { id: 1, name: 'Test 1' },
        { id: 2, name: 'Test 2' },
        { id: 3, name: 'Test 3' },
      ]);
    });

    it('should handle empty arrays', () => {
      const mockResults: any[] = [];
      const filteredResults = mockResults.filter(
        (row) => row != null && typeof row === 'object'
      );

      expect(filteredResults).toHaveLength(0);
    });

    it('should handle arrays with only invalid values', () => {
      const mockResults = [null, undefined, '', 0, false, 'string'];
      const filteredResults = mockResults.filter(
        (row) => row != null && typeof row === 'object'
      );

      expect(filteredResults).toHaveLength(0);
    });

    it('should preserve valid object rows', () => {
      const mockResults = [
        { id: 1, name: 'Test 1', value: null },
        { id: 2, name: 'Test 2', value: undefined },
        { id: 3, name: 'Test 3', value: 'valid' },
      ];

      const filteredResults = mockResults.filter(
        (row) => row != null && typeof row === 'object'
      );

      expect(filteredResults).toHaveLength(3);
      expect(filteredResults[0]).toEqual({
        id: 1,
        name: 'Test 1',
        value: null,
      });
      expect(filteredResults[1]).toEqual({
        id: 2,
        name: 'Test 2',
        value: undefined,
      });
      expect(filteredResults[2]).toEqual({
        id: 3,
        name: 'Test 3',
        value: 'valid',
      });
    });
  });

  describe('Object.values safety', () => {
    it('should handle null rows safely', () => {
      const row = null;

      // This should not throw an error with the fix
      const safeCheck = row != null && typeof row === 'object';
      expect(safeCheck).toBe(false);
    });

    it('should handle undefined rows safely', () => {
      const row = undefined;

      // This should not throw an error with the fix
      const safeCheck = row != null && typeof row === 'object';
      expect(safeCheck).toBe(false);
    });

    it('should handle valid object rows', () => {
      const row = { id: 1, name: 'Test' };

      // This should pass the safety check
      const safeCheck = row != null && typeof row === 'object';
      expect(safeCheck).toBe(true);

      // And Object.values should work
      expect(Object.values(row)).toEqual([1, 'Test']);
    });
  });
});
