// MongoDB initialization script
// This script creates the database and an initial admin user

// Switch to the experiment-management database
db = db.getSiblingDB('experiment-management');

// Create collections (they will be created automatically when first document is inserted)
db.createCollection('users');
db.createCollection('experiments');
db.createCollection('trials');
db.createCollection('steps');
db.createCollection('responses');
db.createCollection('eegrecordings');

// Create indexes for better performance
db.users.createIndex({ "username": 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
db.users.createIndex({ "email": 1 }, { sparse: true });
db.experiments.createIndex({ "createdBy": 1 });
db.experiments.createIndex({ "status": 1 });
db.trials.createIndex({ "createdBy": 1 });
db.steps.createIndex({ "createdBy": 1 });
db.responses.createIndex({ "experimentId": 1 });
db.responses.createIndex({ "timestamp": 1 });
db.eegrecordings.createIndex({ "experiment": 1 });

print('Database initialized with collections and indexes');