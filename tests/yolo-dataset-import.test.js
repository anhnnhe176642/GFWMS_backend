import { describe, it, expect } from 'vitest';
import { buildClassIdMapping, remapDetectionsToAnnotations } from '../src/utils/yolo-format.js';

/**
 * Test suite for YOLO Dataset import utility functions
 */
describe('YOLO Dataset Import Utilities', () => {
  
  describe('buildClassIdMapping', () => {
    it('should correctly build class mapping when classes overlap', () => {
      const existingClasses = ['class_A', 'class_B', 'class_C'];
      const importedClasses = ['class_B', 'class_C', 'class_D', 'class_E'];
      
      const { classIdMap, mergedClasses } = buildClassIdMapping(existingClasses, importedClasses);
      
      expect(classIdMap).toEqual({
        0: 1,  // class_B was at index 1 in existing
        1: 2,  // class_C was at index 2 in existing
        2: 3,  // class_D is new, gets added at index 3
        3: 4   // class_E is new, gets added at index 4
      });
      
      expect(mergedClasses).toEqual([
        'class_A', 'class_B', 'class_C', 'class_D', 'class_E'
      ]);
    });

    it('should correctly map when all imported classes are new', () => {
      const existingClasses = ['class_A', 'class_B'];
      const importedClasses = ['class_X', 'class_Y', 'class_Z'];
      
      const { classIdMap, mergedClasses } = buildClassIdMapping(existingClasses, importedClasses);
      
      expect(classIdMap).toEqual({
        0: 2,  // class_X gets index 2
        1: 3,  // class_Y gets index 3
        2: 4   // class_Z gets index 4
      });
      
      expect(mergedClasses).toEqual([
        'class_A', 'class_B', 'class_X', 'class_Y', 'class_Z'
      ]);
    });

    it('should correctly map when existing dataset has no classes', () => {
      const existingClasses = [];
      const importedClasses = ['class_1', 'class_2', 'class_3'];
      
      const { classIdMap, mergedClasses } = buildClassIdMapping(existingClasses, importedClasses);
      
      expect(classIdMap).toEqual({
        0: 0,
        1: 1,
        2: 2
      });
      
      expect(mergedClasses).toEqual([
        'class_1', 'class_2', 'class_3'
      ]);
    });

    it('should not mutate original existingClasses array', () => {
      const existingClasses = ['class_A', 'class_B'];
      const importedClasses = ['class_C'];
      const originalLength = existingClasses.length;
      
      buildClassIdMapping(existingClasses, importedClasses);
      
      // Original array should not be modified
      expect(existingClasses.length).toBe(originalLength);
      expect(existingClasses).toEqual(['class_A', 'class_B']);
    });

    it('should handle empty imported classes', () => {
      const existingClasses = ['class_A', 'class_B'];
      const importedClasses = [];
      
      const { classIdMap, mergedClasses } = buildClassIdMapping(existingClasses, importedClasses);
      
      expect(classIdMap).toEqual({});
      expect(mergedClasses).toEqual(['class_A', 'class_B']);
    });

    it('should handle duplicate classes in imported list', () => {
      const existingClasses = ['cat'];
      const importedClasses = ['dog', 'cat', 'dog']; // dog appears twice
      
      const { classIdMap, mergedClasses } = buildClassIdMapping(existingClasses, importedClasses);
      
      expect(classIdMap).toEqual({
        0: 1,  // dog at 0 -> becomes index 1
        1: 0,  // cat at 1 -> index 0
        2: 1   // dog at 2 -> still index 1 (already mapped)
      });
      
      expect(mergedClasses).toEqual(['cat', 'dog']);
    });
  });

  describe('remapDetectionsToAnnotations', () => {
    it('should correctly remap annotation class IDs using class map', () => {
      const detections = [
        { class_id: 0, bbox: [10, 20, 100, 150] },
        { class_id: 1, bbox: [50, 60, 80, 120] },
        { class_id: 2, bbox: [200, 250, 350, 400] }
      ];
      
      const classIdMap = {
        0: 2,  // old class 0 -> new class 2
        1: 0,  // old class 1 -> new class 0
        2: 3   // old class 2 -> new class 3
      };
      
      const classNames = ['cat', 'dog', 'bird', 'fish'];
      
      const annotations = remapDetectionsToAnnotations(detections, classIdMap, classNames);
      
      expect(annotations).toEqual([
        {
          class_id: 2,
          class_name: 'bird',
          x1: 10,
          y1: 20,
          x2: 110,
          y2: 170,
          confidence: 1.0
        },
        {
          class_id: 0,
          class_name: 'cat',
          x1: 50,
          y1: 60,
          x2: 130,
          y2: 180,
          confidence: 1.0
        },
        {
          class_id: 3,
          class_name: 'fish',
          x1: 200,
          y1: 250,
          x2: 550,
          y2: 650,
          confidence: 1.0
        }
      ]);
    });

    it('should handle unmapped class IDs by keeping original', () => {
      const detections = [
        { class_id: 5, bbox: [10, 20, 100, 150] }
      ];
      
      const classIdMap = {
        0: 2,
        1: 0
      };
      
      const classNames = ['cat', 'dog', 'bird'];
      
      const annotations = remapDetectionsToAnnotations(detections, classIdMap, classNames);
      
      expect(annotations[0].class_id).toBe(5); // Should keep original unmapped class ID
      expect(annotations[0].class_name).toBe('unknown'); // Out of range
    });

    it('should use unknown for out-of-range class names', () => {
      const detections = [
        { class_id: 0, bbox: [10, 20, 100, 150] }
      ];
      
      const classIdMap = { 0: 10 }; // Maps to index 10
      const classNames = ['cat', 'dog']; // Only 2 classes
      
      const annotations = remapDetectionsToAnnotations(detections, classIdMap, classNames);
      
      expect(annotations[0].class_id).toBe(10);
      expect(annotations[0].class_name).toBe('unknown');
    });

    it('should convert YOLO bbox format to pixel coordinates correctly', () => {
      const detections = [
        { 
          class_id: 0, 
          bbox: [50, 100, 200, 300], // [x, y, width, height] in YOLO format after parseYoloFormat
          confidence: 0.95
        }
      ];
      
      const classIdMap = { 0: 0 };
      const classNames = ['object'];
      
      const annotations = remapDetectionsToAnnotations(detections, classIdMap, classNames);
      
      // bbox[0]=50 (x), bbox[1]=100 (y), bbox[2]=200 (width), bbox[3]=300 (height)
      // x1=50, y1=100, x2=50+200=250, y2=100+300=400
      expect(annotations[0]).toEqual({
        class_id: 0,
        class_name: 'object',
        x1: 50,
        y1: 100,
        x2: 250,
        y2: 400,
        confidence: 0.95
      });
    });

    it('should handle default confidence', () => {
      const detections = [
        { class_id: 0, bbox: [0, 0, 10, 10] } // no confidence
      ];
      
      const classIdMap = { 0: 0 };
      const classNames = ['class'];
      
      const annotations = remapDetectionsToAnnotations(detections, classIdMap, classNames);
      
      expect(annotations[0].confidence).toBe(1.0);
    });

    it('should handle empty detections', () => {
      const detections = [];
      const classIdMap = {};
      const classNames = ['cat'];
      
      const annotations = remapDetectionsToAnnotations(detections, classIdMap, classNames);
      
      expect(annotations).toEqual([]);
    });

    it('should handle null/undefined classNames array', () => {
      const detections = [
        { class_id: 0, bbox: [10, 20, 100, 150] }
      ];
      
      const classIdMap = { 0: 0 };
      
      const annotations = remapDetectionsToAnnotations(detections, classIdMap, undefined);
      
      expect(annotations[0].class_name).toBe('unknown');
    });

    it('should round bbox coordinates to integers', () => {
      const detections = [
        { class_id: 0, bbox: [10.5, 20.7, 100.2, 150.9] }
      ];
      
      const classIdMap = { 0: 0 };
      const classNames = ['class'];
      
      const annotations = remapDetectionsToAnnotations(detections, classIdMap, classNames);
      
      expect(annotations[0].x1).toBe(11); // Math.round(10.5)
      expect(annotations[0].y1).toBe(21); // Math.round(20.7)
      expect(annotations[0].x2).toBe(111); // Math.round(10.5 + 100.2)
      expect(annotations[0].y2).toBe(172); // Math.round(20.7 + 150.9)
    });
  });

  describe('Integration: buildClassIdMapping + remapDetectionsToAnnotations', () => {
    it('should handle full import workflow', () => {
      // Scenario: Existing dataset has ['dog', 'cat']
      // Importing dataset has ['cat', 'bird', 'dog']
      // Image has detections with old class IDs: 0=cat, 1=bird, 2=dog
      
      const existingClasses = ['dog', 'cat'];
      const importedClasses = ['cat', 'bird', 'dog'];
      
      // Step 1: Build mapping
      const { classIdMap, mergedClasses } = buildClassIdMapping(existingClasses, importedClasses);
      
      expect(mergedClasses).toEqual(['dog', 'cat', 'bird']);
      expect(classIdMap).toEqual({
        0: 1,  // imported cat(0) -> merged cat(1)
        1: 2,  // imported bird(1) -> merged bird(2)
        2: 0   // imported dog(2) -> merged dog(0)
      });
      
      // Step 2: Remap detections
      const detections = [
        { class_id: 0, bbox: [10, 20, 100, 150], confidence: 0.9 },  // cat
        { class_id: 1, bbox: [200, 250, 350, 400], confidence: 0.85 } // bird
      ];
      
      const annotations = remapDetectionsToAnnotations(detections, classIdMap, mergedClasses);
      
      expect(annotations).toEqual([
        {
          class_id: 1,
          class_name: 'cat',
          x1: 10,
          y1: 20,
          x2: 110,
          y2: 170,
          confidence: 0.9
        },
        {
          class_id: 2,
          class_name: 'bird',
          x1: 200,
          y1: 250,
          x2: 550,
          y2: 650,
          confidence: 0.85
        }
      ]);
    });
  });
});
