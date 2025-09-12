# API Documentation

This directory contains comprehensive API documentation for the Research Experiment Management System.

## Quick Start

### Interactive Documentation

The API documentation is available via Swagger UI when running the development server:

```
http://localhost:5000/api/docs
```

### OpenAPI Specification

The complete OpenAPI 3.0 specification is available in:
- [openapi.yaml](./openapi.yaml) - Complete API specification in YAML format
- [openapi.json](./openapi.json) - Complete API specification in JSON format (auto-generated)

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Getting a Token

1. Register a new user or use existing credentials
2. Login to get a JWT token

```bash
# Register new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "researcher01",
    "password": "securepassword123",
    "role": "researcher"
  }'

# Login to get token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "researcher01",
    "password": "securepassword123"
  }'
```

## API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Experiments
- `GET /api/experiments` - List all experiments
- `POST /api/experiments` - Create new experiment
- `GET /api/experiments/{id}` - Get experiment by ID
- `PUT /api/experiments/{id}` - Update experiment
- `DELETE /api/experiments/{id}` - Delete experiment

### Trials
- `GET /api/trials` - List all trials
- `POST /api/trials` - Create new trial
- `GET /api/trials/{id}` - Get trial by ID
- `PUT /api/trials/{id}` - Update trial
- `DELETE /api/trials/{id}` - Delete trial

### Steps
- `GET /api/steps` - List all steps
- `POST /api/steps` - Create new step
- `GET /api/steps/{id}` - Get step by ID
- `PUT /api/steps/{id}` - Update step
- `DELETE /api/steps/{id}` - Delete step

### EEG/OpenBCI
- `POST /api/openbci/start` - Start EEG data collection
- `POST /api/openbci/stop` - Stop EEG data collection
- `GET /api/openbci/status` - Get device status

### File Upload
- `POST /api/upload/audio` - Upload audio files

## Error Handling

The API uses standard HTTP status codes and returns consistent error responses:

```json
{
  "message": "Error description",
  "error": "Detailed error information",
  "details": {
    "field": "Additional context"
  }
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Rate Limiting

Currently, no rate limiting is implemented, but this may be added in future versions.

## Versioning

The API is currently at version 1.0. Future versions will be clearly documented and backwards compatibility will be maintained when possible.

## Examples

### Complete Experiment Workflow

1. **Create an Experiment**
```bash
curl -X POST http://localhost:5000/api/experiments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Memory Recall Study",
    "description": "Study investigating memory recall patterns using EEG",
    "status": "Draft"
  }'
```

2. **Create Experimental Steps**
```bash
curl -X POST http://localhost:5000/api/steps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Baseline Recording",
    "type": "EEG",
    "duration": 60,
    "description": "Record baseline EEG for 1 minute"
  }'
```

3. **Create a Trial**
```bash
curl -X POST http://localhost:5000/api/trials \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Trial 1 - Baseline",
    "experiment": "EXPERIMENT_ID",
    "steps": ["STEP_ID"]
  }'
```

4. **Start EEG Recording**
```bash
curl -X POST http://localhost:5000/api/openbci/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "participant_name": "participant_001",
    "session_name": "baseline_recording",
    "duration": 60
  }'
```

## Development

### Updating API Documentation

1. Update the [openapi.yaml](./openapi.yaml) file
2. The Swagger UI will automatically reflect changes when the server restarts
3. Generate code or client libraries using the OpenAPI spec

### Adding New Endpoints

1. Create the route in the appropriate `/routes/*.js` file
2. Add JSDoc comments with OpenAPI annotations
3. Update the OpenAPI spec file if needed
4. Test the endpoint using the Swagger UI

## Support

For API support and questions:
- Check the [Troubleshooting Guide](../developer/troubleshooting.md)
- Review the [Developer Documentation](../developer/)
- Submit issues on the project repository