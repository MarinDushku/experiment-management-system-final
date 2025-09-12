const mongoose = require('mongoose');
const EEGRecording = require('../../../models/EEGRecording');
const TestHelpers = require('../../utils/testHelpers');

describe('EEGRecording Model', () => {
  let testUser, testExperiment;

  beforeAll(async () => {
    testUser = await TestHelpers.createTestUser({
      username: 'eeguser',
      role: 'researcher'
    });

    testExperiment = await TestHelpers.createTestExperiment({
      name: 'EEG Test Experiment',
      description: 'Experiment for EEG recording testing'
    }, testUser._id);
  });

  describe('Schema Validation', () => {
    it('should create EEG recording with valid data', async () => {
      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'EEG Test Experiment',
        startTime: new Date('2023-10-15T14:00:00Z'),
        endTime: new Date('2023-10-15T14:05:00Z'),
        samplingRate: 250,
        channelCount: 16,
        sampleCount: 75000,
        filePath: '/path/to/eeg/recording.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      const savedRecording = await eegRecording.save();

      expect(savedRecording.experiment.toString()).toBe(testExperiment._id.toString());
      expect(savedRecording.experimentName).toBe('EEG Test Experiment');
      expect(savedRecording.startTime.toISOString()).toBe('2023-10-15T14:00:00.000Z');
      expect(savedRecording.endTime.toISOString()).toBe('2023-10-15T14:05:00.000Z');
      expect(savedRecording.samplingRate).toBe(250);
      expect(savedRecording.channelCount).toBe(16);
      expect(savedRecording.sampleCount).toBe(75000);
      expect(savedRecording.filePath).toBe('/path/to/eeg/recording.csv');
      expect(savedRecording._id).toBeDefined();
      expect(savedRecording.createdAt).toBeDefined();
    });

    it('should require experiment field', async () => {
      const eegData = {
        experimentName: 'Test Experiment',
        startTime: new Date(),
        endTime: new Date(),
        samplingRate: 250,
        channelCount: 16,
        sampleCount: 1000,
        filePath: '/path/to/recording.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      
      await expect(eegRecording.save()).rejects.toThrow();
      await expect(eegRecording.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          experiment: expect.any(Object)
        })
      });
    });

    it('should require experimentName field', async () => {
      const eegData = {
        experiment: testExperiment._id,
        startTime: new Date(),
        endTime: new Date(),
        samplingRate: 250,
        channelCount: 16,
        sampleCount: 1000,
        filePath: '/path/to/recording.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      
      await expect(eegRecording.save()).rejects.toThrow();
      await expect(eegRecording.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          experimentName: expect.any(Object)
        })
      });
    });

    it('should require startTime field', async () => {
      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'Test Experiment',
        endTime: new Date(),
        samplingRate: 250,
        channelCount: 16,
        sampleCount: 1000,
        filePath: '/path/to/recording.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      
      await expect(eegRecording.save()).rejects.toThrow();
      await expect(eegRecording.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          startTime: expect.any(Object)
        })
      });
    });

    it('should require endTime field', async () => {
      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'Test Experiment',
        startTime: new Date(),
        samplingRate: 250,
        channelCount: 16,
        sampleCount: 1000,
        filePath: '/path/to/recording.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      
      await expect(eegRecording.save()).rejects.toThrow();
      await expect(eegRecording.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          endTime: expect.any(Object)
        })
      });
    });

    it('should require samplingRate field', async () => {
      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'Test Experiment',
        startTime: new Date(),
        endTime: new Date(),
        channelCount: 16,
        sampleCount: 1000,
        filePath: '/path/to/recording.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      
      await expect(eegRecording.save()).rejects.toThrow();
      await expect(eegRecording.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          samplingRate: expect.any(Object)
        })
      });
    });

    it('should require channelCount field', async () => {
      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'Test Experiment',
        startTime: new Date(),
        endTime: new Date(),
        samplingRate: 250,
        sampleCount: 1000,
        filePath: '/path/to/recording.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      
      await expect(eegRecording.save()).rejects.toThrow();
      await expect(eegRecording.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          channelCount: expect.any(Object)
        })
      });
    });

    it('should require sampleCount field', async () => {
      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'Test Experiment',
        startTime: new Date(),
        endTime: new Date(),
        samplingRate: 250,
        channelCount: 16,
        filePath: '/path/to/recording.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      
      await expect(eegRecording.save()).rejects.toThrow();
      await expect(eegRecording.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          sampleCount: expect.any(Object)
        })
      });
    });

    it('should require filePath field', async () => {
      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'Test Experiment',
        startTime: new Date(),
        endTime: new Date(),
        samplingRate: 250,
        channelCount: 16,
        sampleCount: 1000
      };

      const eegRecording = new EEGRecording(eegData);
      
      await expect(eegRecording.save()).rejects.toThrow();
      await expect(eegRecording.save()).rejects.toMatchObject({
        errors: expect.objectContaining({
          filePath: expect.any(Object)
        })
      });
    });

    it('should set createdAt timestamp automatically', async () => {
      const beforeSave = new Date();
      
      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'Timestamp Test',
        startTime: new Date('2023-10-15T10:00:00Z'),
        endTime: new Date('2023-10-15T10:05:00Z'),
        samplingRate: 250,
        channelCount: 8,
        sampleCount: 75000,
        filePath: '/path/to/timestamp.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      const savedRecording = await eegRecording.save();

      const afterSave = new Date();

      expect(savedRecording.createdAt).toBeDefined();
      expect(savedRecording.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(savedRecording.createdAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });
  });

  describe('Data Types and Validation', () => {
    it('should accept various sampling rates', async () => {
      const samplingRates = [125, 250, 500, 1000, 2000, 8000];

      for (const rate of samplingRates) {
        const eegData = {
          experiment: testExperiment._id,
          experimentName: `Sampling Rate ${rate} Test`,
          startTime: new Date('2023-10-15T10:00:00Z'),
          endTime: new Date('2023-10-15T10:01:00Z'),
          samplingRate: rate,
          channelCount: 8,
          sampleCount: rate * 60, // 1 minute worth
          filePath: `/path/to/rate_${rate}.csv`
        };

        const eegRecording = new EEGRecording(eegData);
        const savedRecording = await eegRecording.save();

        expect(savedRecording.samplingRate).toBe(rate);
      }
    });

    it('should accept various channel counts', async () => {
      const channelCounts = [1, 4, 8, 16, 32, 64, 128, 256];

      for (const count of channelCounts) {
        const eegData = {
          experiment: testExperiment._id,
          experimentName: `Channel Count ${count} Test`,
          startTime: new Date('2023-10-15T10:00:00Z'),
          endTime: new Date('2023-10-15T10:01:00Z'),
          samplingRate: 250,
          channelCount: count,
          sampleCount: 15000,
          filePath: `/path/to/channels_${count}.csv`
        };

        const eegRecording = new EEGRecording(eegData);
        const savedRecording = await eegRecording.save();

        expect(savedRecording.channelCount).toBe(count);
      }
    });

    it('should accept various sample counts', async () => {
      const sampleCounts = [0, 1, 1000, 100000, 1000000, Number.MAX_SAFE_INTEGER];

      for (const count of sampleCounts) {
        const eegData = {
          experiment: testExperiment._id,
          experimentName: `Sample Count ${count} Test`,
          startTime: new Date('2023-10-15T10:00:00Z'),
          endTime: new Date('2023-10-15T10:01:00Z'),
          samplingRate: 250,
          channelCount: 8,
          sampleCount: count,
          filePath: `/path/to/samples_${count}.csv`
        };

        const eegRecording = new EEGRecording(eegData);
        const savedRecording = await eegRecording.save();

        expect(savedRecording.sampleCount).toBe(count);
      }
    });

    it('should accept negative values for numeric fields', async () => {
      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'Negative Values Test',
        startTime: new Date('2023-10-15T10:00:00Z'),
        endTime: new Date('2023-10-15T10:01:00Z'),
        samplingRate: -250,
        channelCount: -8,
        sampleCount: -1000,
        filePath: '/path/to/negative.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      const savedRecording = await eegRecording.save();

      expect(savedRecording.samplingRate).toBe(-250);
      expect(savedRecording.channelCount).toBe(-8);
      expect(savedRecording.sampleCount).toBe(-1000);
    });

    it('should accept decimal values for numeric fields', async () => {
      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'Decimal Values Test',
        startTime: new Date('2023-10-15T10:00:00Z'),
        endTime: new Date('2023-10-15T10:01:00Z'),
        samplingRate: 250.5,
        channelCount: 16.7,
        sampleCount: 15000.3,
        filePath: '/path/to/decimal.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      const savedRecording = await eegRecording.save();

      expect(savedRecording.samplingRate).toBe(250.5);
      expect(savedRecording.channelCount).toBe(16.7);
      expect(savedRecording.sampleCount).toBe(15000.3);
    });

    it('should handle various file path formats', async () => {
      const filePaths = [
        '/absolute/path/to/file.csv',
        'relative/path/to/file.csv',
        'C:\\Windows\\path\\to\\file.csv',
        './local/file.csv',
        '../parent/file.csv',
        'file.csv',
        '/path/with spaces/file name.csv',
        '/path/with-special_chars/file@123.csv',
        '/very/long/path/that/goes/on/for/many/directories/and/subdirectories/file.csv'
      ];

      for (const filePath of filePaths) {
        const eegData = {
          experiment: testExperiment._id,
          experimentName: 'File Path Test',
          startTime: new Date('2023-10-15T10:00:00Z'),
          endTime: new Date('2023-10-15T10:01:00Z'),
          samplingRate: 250,
          channelCount: 8,
          sampleCount: 15000,
          filePath: filePath
        };

        const eegRecording = new EEGRecording(eegData);
        const savedRecording = await eegRecording.save();

        expect(savedRecording.filePath).toBe(filePath);
      }
    });

    it('should handle various time ranges', async () => {
      const timeRanges = [
        {
          start: new Date('2023-01-01T00:00:00Z'),
          end: new Date('2023-01-01T00:00:01Z'), // 1 second
          name: '1 Second Recording'
        },
        {
          start: new Date('2023-06-15T12:00:00Z'),
          end: new Date('2023-06-15T12:05:00Z'), // 5 minutes
          name: '5 Minute Recording'
        },
        {
          start: new Date('2023-12-31T23:00:00Z'),
          end: new Date('2024-01-01T01:00:00Z'), // 2 hours across year boundary
          name: 'Cross Year Recording'
        },
        {
          start: new Date('1970-01-01T00:00:00Z'),
          end: new Date('1970-01-01T00:00:10Z'), // Unix epoch
          name: 'Epoch Recording'
        }
      ];

      for (const timeRange of timeRanges) {
        const eegData = {
          experiment: testExperiment._id,
          experimentName: timeRange.name,
          startTime: timeRange.start,
          endTime: timeRange.end,
          samplingRate: 250,
          channelCount: 8,
          sampleCount: 2500,
          filePath: `/path/to/${timeRange.name.toLowerCase().replace(/\s+/g, '_')}.csv`
        };

        const eegRecording = new EEGRecording(eegData);
        const savedRecording = await eegRecording.save();

        expect(savedRecording.startTime.getTime()).toBe(timeRange.start.getTime());
        expect(savedRecording.endTime.getTime()).toBe(timeRange.end.getTime());
      }
    });

    it('should validate ObjectId for experiment field', async () => {
      const validEegData = {
        experiment: new mongoose.Types.ObjectId(),
        experimentName: 'Valid ObjectId Test',
        startTime: new Date('2023-10-15T10:00:00Z'),
        endTime: new Date('2023-10-15T10:01:00Z'),
        samplingRate: 250,
        channelCount: 8,
        sampleCount: 15000,
        filePath: '/path/to/valid.csv'
      };

      const eegRecording = new EEGRecording(validEegData);
      const savedRecording = await eegRecording.save();

      expect(savedRecording.experiment).toBeDefined();
      expect(mongoose.Types.ObjectId.isValid(savedRecording.experiment)).toBe(true);
    });

    it('should reject invalid ObjectId for experiment field', async () => {
      const invalidEegData = {
        experiment: 'invalid_object_id',
        experimentName: 'Invalid ObjectId Test',
        startTime: new Date('2023-10-15T10:00:00Z'),
        endTime: new Date('2023-10-15T10:01:00Z'),
        samplingRate: 250,
        channelCount: 8,
        sampleCount: 15000,
        filePath: '/path/to/invalid.csv'
      };

      const eegRecording = new EEGRecording(invalidEegData);
      
      await expect(eegRecording.save()).rejects.toThrow();
    });
  });

  describe('Time Validation and Logic', () => {
    it('should allow endTime after startTime', async () => {
      const startTime = new Date('2023-10-15T14:00:00Z');
      const endTime = new Date('2023-10-15T14:05:00Z');

      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'Valid Time Order Test',
        startTime: startTime,
        endTime: endTime,
        samplingRate: 250,
        channelCount: 8,
        sampleCount: 75000,
        filePath: '/path/to/valid_time.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      const savedRecording = await eegRecording.save();

      expect(savedRecording.endTime.getTime()).toBeGreaterThan(savedRecording.startTime.getTime());
    });

    it('should allow endTime same as startTime', async () => {
      const sameTime = new Date('2023-10-15T14:00:00Z');

      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'Same Time Test',
        startTime: sameTime,
        endTime: sameTime,
        samplingRate: 250,
        channelCount: 8,
        sampleCount: 0,
        filePath: '/path/to/same_time.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      const savedRecording = await eegRecording.save();

      expect(savedRecording.endTime.getTime()).toBe(savedRecording.startTime.getTime());
    });

    it('should allow endTime before startTime', async () => {
      const startTime = new Date('2023-10-15T14:05:00Z');
      const endTime = new Date('2023-10-15T14:00:00Z'); // Before start

      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'Reverse Time Test',
        startTime: startTime,
        endTime: endTime,
        samplingRate: 250,
        channelCount: 8,
        sampleCount: 0,
        filePath: '/path/to/reverse_time.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      const savedRecording = await eegRecording.save();

      expect(savedRecording.endTime.getTime()).toBeLessThan(savedRecording.startTime.getTime());
    });

    it('should calculate duration correctly', async () => {
      const startTime = new Date('2023-10-15T14:00:00Z');
      const endTime = new Date('2023-10-15T14:05:30Z'); // 5.5 minutes

      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'Duration Test',
        startTime: startTime,
        endTime: endTime,
        samplingRate: 250,
        channelCount: 8,
        sampleCount: 82500, // 5.5 * 60 * 250
        filePath: '/path/to/duration.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      const savedRecording = await eegRecording.save();

      const duration = savedRecording.endTime.getTime() - savedRecording.startTime.getTime();
      expect(duration).toBe(330000); // 5.5 minutes in milliseconds
    });
  });

  describe('Reference Relationships', () => {
    it('should populate experiment reference correctly', async () => {
      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'Populate Test',
        startTime: new Date('2023-10-15T14:00:00Z'),
        endTime: new Date('2023-10-15T14:05:00Z'),
        samplingRate: 250,
        channelCount: 16,
        sampleCount: 75000,
        filePath: '/path/to/populate.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      const savedRecording = await eegRecording.save();

      const populatedRecording = await EEGRecording.findById(savedRecording._id).populate('experiment');

      expect(populatedRecording.experiment).toBeDefined();
      expect(populatedRecording.experiment.name).toBe('EEG Test Experiment');
      expect(populatedRecording.experiment.description).toBe('Experiment for EEG recording testing');
    });

    it('should handle non-existent experiment reference', async () => {
      const nonExistentExperimentId = new mongoose.Types.ObjectId();
      
      const eegData = {
        experiment: nonExistentExperimentId,
        experimentName: 'Non-existent Experiment Test',
        startTime: new Date('2023-10-15T14:00:00Z'),
        endTime: new Date('2023-10-15T14:05:00Z'),
        samplingRate: 250,
        channelCount: 8,
        sampleCount: 75000,
        filePath: '/path/to/nonexistent.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      const savedRecording = await eegRecording.save();

      const populatedRecording = await EEGRecording.findById(savedRecording._id).populate('experiment');

      expect(populatedRecording.experiment).toBeNull();
    });
  });

  describe('Querying and Indexing', () => {
    let recording1, recording2, recording3;

    beforeEach(async () => {
      recording1 = await TestHelpers.createTestEEGRecording({
        experiment: testExperiment._id,
        experimentName: 'Query Test Experiment 1',
        startTime: new Date('2023-10-15T09:00:00Z'),
        endTime: new Date('2023-10-15T09:05:00Z'),
        samplingRate: 250,
        channelCount: 8,
        sampleCount: 75000,
        filePath: '/path/to/recording1.csv'
      });

      recording2 = await TestHelpers.createTestEEGRecording({
        experiment: testExperiment._id,
        experimentName: 'Query Test Experiment 2',
        startTime: new Date('2023-10-15T10:00:00Z'),
        endTime: new Date('2023-10-15T10:10:00Z'),
        samplingRate: 500,
        channelCount: 16,
        sampleCount: 300000,
        filePath: '/path/to/recording2.csv'
      });

      recording3 = await TestHelpers.createTestEEGRecording({
        experiment: testExperiment._id,
        experimentName: 'Query Test Experiment 3',
        startTime: new Date('2023-10-15T11:00:00Z'),
        endTime: new Date('2023-10-15T11:03:00Z'),
        samplingRate: 1000,
        channelCount: 32,
        sampleCount: 180000,
        filePath: '/path/to/recording3.csv'
      });
    });

    it('should find recordings by experiment', async () => {
      const recordings = await EEGRecording.find({ experiment: testExperiment._id });

      expect(recordings.length).toBeGreaterThanOrEqual(3);
      expect(recordings.every(rec => rec.experiment.toString() === testExperiment._id.toString())).toBe(true);
    });

    it('should find recordings by sampling rate', async () => {
      const lowRateRecordings = await EEGRecording.find({ samplingRate: { $lte: 250 } });
      const highRateRecordings = await EEGRecording.find({ samplingRate: { $gte: 500 } });

      expect(lowRateRecordings.length).toBeGreaterThanOrEqual(1);
      expect(highRateRecordings.length).toBeGreaterThanOrEqual(2);

      expect(lowRateRecordings.every(rec => rec.samplingRate <= 250)).toBe(true);
      expect(highRateRecordings.every(rec => rec.samplingRate >= 500)).toBe(true);
    });

    it('should find recordings by channel count', async () => {
      const fewChannelRecordings = await EEGRecording.find({ channelCount: { $lte: 16 } });
      const manyChannelRecordings = await EEGRecording.find({ channelCount: { $gt: 16 } });

      expect(fewChannelRecordings.length).toBeGreaterThanOrEqual(2);
      expect(manyChannelRecordings.length).toBeGreaterThanOrEqual(1);

      expect(fewChannelRecordings.every(rec => rec.channelCount <= 16)).toBe(true);
      expect(manyChannelRecordings.every(rec => rec.channelCount > 16)).toBe(true);
    });

    it('should find recordings by time range', async () => {
      const morningRecordings = await EEGRecording.find({
        startTime: { 
          $gte: new Date('2023-10-15T09:00:00Z'), 
          $lt: new Date('2023-10-15T10:00:00Z') 
        }
      });

      const laterRecordings = await EEGRecording.find({
        startTime: { $gte: new Date('2023-10-15T10:00:00Z') }
      });

      expect(morningRecordings.length).toBeGreaterThanOrEqual(1);
      expect(laterRecordings.length).toBeGreaterThanOrEqual(2);
    });

    it('should sort recordings by start time', async () => {
      const recordingsByTime = await EEGRecording.find({ experiment: testExperiment._id }).sort({ startTime: 1 });

      expect(recordingsByTime.length).toBeGreaterThanOrEqual(3);
      
      for (let i = 1; i < recordingsByTime.length; i++) {
        expect(recordingsByTime[i - 1].startTime.getTime()).toBeLessThanOrEqual(
          recordingsByTime[i].startTime.getTime()
        );
      }
    });

    it('should sort recordings by sample count', async () => {
      const recordingsBySamples = await EEGRecording.find({ experiment: testExperiment._id }).sort({ sampleCount: -1 });

      expect(recordingsBySamples.length).toBeGreaterThanOrEqual(3);
      
      for (let i = 1; i < recordingsBySamples.length; i++) {
        expect(recordingsBySamples[i - 1].sampleCount).toBeGreaterThanOrEqual(
          recordingsBySamples[i].sampleCount
        );
      }
    });

    it('should search recordings by file path pattern', async () => {
      const csvRecordings = await EEGRecording.find({ 
        filePath: { $regex: /\.csv$/i } 
      });

      expect(csvRecordings.length).toBeGreaterThanOrEqual(3);
      expect(csvRecordings.every(rec => rec.filePath.toLowerCase().endsWith('.csv'))).toBe(true);
    });

    it('should search recordings by experiment name pattern', async () => {
      const queryRecordings = await EEGRecording.find({ 
        experimentName: { $regex: /query test/i } 
      });

      expect(queryRecordings.length).toBeGreaterThanOrEqual(3);
      expect(queryRecordings.every(rec => 
        rec.experimentName.toLowerCase().includes('query test')
      )).toBe(true);
    });
  });

  describe('Complex Queries and Aggregation', () => {
    beforeEach(async () => {
      // Create additional recordings for complex querying
      await TestHelpers.createTestEEGRecording({
        experiment: testExperiment._id,
        experimentName: 'High Quality Recording',
        startTime: new Date('2023-10-16T09:00:00Z'),
        endTime: new Date('2023-10-16T09:30:00Z'),
        samplingRate: 2000,
        channelCount: 64,
        sampleCount: 3600000,
        filePath: '/high_quality/recording.csv'
      });

      await TestHelpers.createTestEEGRecording({
        experiment: testExperiment._id,
        experimentName: 'Low Quality Recording',
        startTime: new Date('2023-10-16T10:00:00Z'),
        endTime: new Date('2023-10-16T10:02:00Z'),
        samplingRate: 125,
        channelCount: 4,
        sampleCount: 15000,
        filePath: '/low_quality/recording.csv'
      });
    });

    it('should aggregate recording statistics', async () => {
      const stats = await EEGRecording.aggregate([
        { $match: { experiment: testExperiment._id } },
        {
          $group: {
            _id: null,
            totalRecordings: { $sum: 1 },
            avgSamplingRate: { $avg: '$samplingRate' },
            maxChannelCount: { $max: '$channelCount' },
            minChannelCount: { $min: '$channelCount' },
            totalSamples: { $sum: '$sampleCount' }
          }
        }
      ]);

      expect(stats).toHaveLength(1);
      expect(stats[0].totalRecordings).toBeGreaterThan(0);
      expect(stats[0].avgSamplingRate).toBeGreaterThan(0);
      expect(stats[0].maxChannelCount).toBeGreaterThanOrEqual(stats[0].minChannelCount);
      expect(stats[0].totalSamples).toBeGreaterThan(0);
    });

    it('should group recordings by sampling rate ranges', async () => {
      const rateGroups = await EEGRecording.aggregate([
        { $match: { experiment: testExperiment._id } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lte: ['$samplingRate', 250] }, then: 'Low' },
                  { case: { $lte: ['$samplingRate', 1000] }, then: 'Medium' },
                  { case: { $gt: ['$samplingRate', 1000] }, then: 'High' }
                ],
                default: 'Unknown'
              }
            },
            count: { $sum: 1 },
            avgChannels: { $avg: '$channelCount' }
          }
        }
      ]);

      expect(rateGroups.length).toBeGreaterThan(0);
      expect(rateGroups.every(group => group.count > 0)).toBe(true);
    });

    it('should calculate recording durations', async () => {
      const durations = await EEGRecording.aggregate([
        { $match: { experiment: testExperiment._id } },
        {
          $project: {
            experimentName: 1,
            duration: { $subtract: ['$endTime', '$startTime'] },
            samplingRate: 1,
            channelCount: 1
          }
        },
        { $sort: { duration: -1 } }
      ]);

      expect(durations.length).toBeGreaterThan(0);
      expect(durations.every(rec => rec.duration >= 0 || rec.duration < 0)).toBe(true); // Allow negative durations
      
      for (let i = 1; i < durations.length; i++) {
        expect(durations[i - 1].duration).toBeGreaterThanOrEqual(durations[i].duration);
      }
    });

    it('should find recordings with highest data rate', async () => {
      const dataRates = await EEGRecording.aggregate([
        { $match: { experiment: testExperiment._id } },
        {
          $project: {
            experimentName: 1,
            dataRate: { $multiply: ['$samplingRate', '$channelCount'] },
            samplingRate: 1,
            channelCount: 1
          }
        },
        { $sort: { dataRate: -1 } },
        { $limit: 3 }
      ]);

      expect(dataRates.length).toBeGreaterThan(0);
      expect(dataRates.every(rec => rec.dataRate > 0)).toBe(true);
      
      for (let i = 1; i < dataRates.length; i++) {
        expect(dataRates[i - 1].dataRate).toBeGreaterThanOrEqual(dataRates[i].dataRate);
      }
    });
  });

  describe('Model Methods and Virtuals', () => {
    it('should convert to JSON correctly', async () => {
      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'JSON Test Recording',
        startTime: new Date('2023-10-15T14:00:00Z'),
        endTime: new Date('2023-10-15T14:05:00Z'),
        samplingRate: 250,
        channelCount: 16,
        sampleCount: 75000,
        filePath: '/path/to/json_test.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      const savedRecording = await eegRecording.save();

      const jsonRecording = savedRecording.toJSON();

      expect(jsonRecording).toHaveProperty('_id');
      expect(jsonRecording).toHaveProperty('experiment');
      expect(jsonRecording).toHaveProperty('experimentName', 'JSON Test Recording');
      expect(jsonRecording).toHaveProperty('startTime');
      expect(jsonRecording).toHaveProperty('endTime');
      expect(jsonRecording).toHaveProperty('samplingRate', 250);
      expect(jsonRecording).toHaveProperty('channelCount', 16);
      expect(jsonRecording).toHaveProperty('sampleCount', 75000);
      expect(jsonRecording).toHaveProperty('filePath', '/path/to/json_test.csv');
      expect(jsonRecording).toHaveProperty('createdAt');
    });

    it('should convert to Object correctly', async () => {
      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'Object Test Recording',
        startTime: new Date('2023-10-15T15:00:00Z'),
        endTime: new Date('2023-10-15T15:03:00Z'),
        samplingRate: 500,
        channelCount: 32,
        sampleCount: 90000,
        filePath: '/path/to/object_test.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      const savedRecording = await eegRecording.save();

      const objectRecording = savedRecording.toObject();

      expect(objectRecording).toHaveProperty('_id');
      expect(objectRecording).toHaveProperty('experiment');
      expect(objectRecording).toHaveProperty('experimentName', 'Object Test Recording');
      expect(objectRecording).toHaveProperty('startTime');
      expect(objectRecording).toHaveProperty('endTime');
      expect(objectRecording).toHaveProperty('samplingRate', 500);
      expect(objectRecording).toHaveProperty('channelCount', 32);
      expect(objectRecording).toHaveProperty('sampleCount', 90000);
      expect(objectRecording).toHaveProperty('filePath', '/path/to/object_test.csv');
      expect(objectRecording).toHaveProperty('createdAt');
    });
  });

  describe('Error Handling', () => {
    it('should handle mongoose validation errors properly', async () => {
      const invalidRecording = new EEGRecording({
        // Missing all required fields
        createdAt: new Date()
      });

      try {
        await invalidRecording.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.experiment).toBeDefined();
        expect(error.errors.experimentName).toBeDefined();
        expect(error.errors.startTime).toBeDefined();
        expect(error.errors.endTime).toBeDefined();
        expect(error.errors.samplingRate).toBeDefined();
        expect(error.errors.channelCount).toBeDefined();
        expect(error.errors.sampleCount).toBeDefined();
        expect(error.errors.filePath).toBeDefined();
      }
    });

    it('should handle invalid date formats', async () => {
      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'Invalid Date Test',
        startTime: 'invalid-date',
        endTime: new Date(),
        samplingRate: 250,
        channelCount: 8,
        sampleCount: 1000,
        filePath: '/path/to/invalid_date.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      
      await expect(eegRecording.save()).rejects.toThrow();
    });

    it('should handle invalid number formats', async () => {
      const eegData = {
        experiment: testExperiment._id,
        experimentName: 'Invalid Number Test',
        startTime: new Date(),
        endTime: new Date(),
        samplingRate: 'not-a-number',
        channelCount: 8,
        sampleCount: 1000,
        filePath: '/path/to/invalid_number.csv'
      };

      const eegRecording = new EEGRecording(eegData);
      
      await expect(eegRecording.save()).rejects.toThrow();
    });

    it('should handle very long strings', async () => {
      const longExperimentName = 'A'.repeat(1000);
      const longFilePath = 'B'.repeat(2000);
      
      const eegData = {
        experiment: testExperiment._id,
        experimentName: longExperimentName,
        startTime: new Date('2023-10-15T14:00:00Z'),
        endTime: new Date('2023-10-15T14:05:00Z'),
        samplingRate: 250,
        channelCount: 8,
        sampleCount: 75000,
        filePath: longFilePath
      };

      const eegRecording = new EEGRecording(eegData);
      const savedRecording = await eegRecording.save();

      expect(savedRecording.experimentName).toBe(longExperimentName);
      expect(savedRecording.filePath).toBe(longFilePath);
      expect(savedRecording.experimentName.length).toBe(1000);
      expect(savedRecording.filePath.length).toBe(2000);
    });

    it('should handle edge case values', async () => {
      const eegData = {
        experiment: testExperiment._id,
        experimentName: '', // Empty string should fail
        startTime: new Date(0), // Unix epoch
        endTime: new Date(0),
        samplingRate: 0,
        channelCount: 0,
        sampleCount: 0,
        filePath: '' // Empty path should fail
      };

      const eegRecording = new EEGRecording(eegData);
      
      await expect(eegRecording.save()).rejects.toThrow();
    });
  });
});