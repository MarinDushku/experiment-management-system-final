# Research Experiment Management System Documentation

This directory contains comprehensive documentation for the Research Experiment Management System with OpenBCI EEG integration.

## Documentation Structure

- **[API Documentation](./api/)** - Complete API reference with OpenAPI specification
- **[User Documentation](./user/)** - User guides and tutorials
- **[Developer Documentation](./developer/)** - Development setup and contribution guides
- **[Assets](./assets/)** - Images, diagrams, and other documentation assets

## Quick Start

1. **For Users**: See [User Guide](./user/getting-started.md)
2. **For Developers**: See [Developer Setup](./developer/setup.md)
3. **For API Integration**: See [API Reference](./api/openapi.yaml)

## System Overview

The Research Experiment Management System is a comprehensive platform for conducting and managing research experiments with EEG data collection capabilities using OpenBCI hardware.

### Key Features

- **Experiment Management**: Create, configure, and manage research experiments
- **EEG Data Collection**: Real-time EEG data acquisition using OpenBCI hardware
- **Multi-Modal Stimuli**: Support for audio, visual, and text stimuli
- **Data Analysis**: Built-in analysis tools for EEG data processing
- **User Management**: Role-based access control (Admin, Researcher, User)
- **Containerized Deployment**: Docker-based deployment with orchestration
- **Comprehensive Testing**: Full test coverage with automated CI/CD

### Technology Stack

- **Frontend**: React.js with modern hooks and context API
- **Backend**: Node.js with Express framework
- **Database**: MongoDB with Mongoose ODM
- **EEG Integration**: Python with BrainFlow library
- **Authentication**: JWT-based with role-based access control
- **Deployment**: Docker Compose with Nginx reverse proxy
- **Testing**: Jest, React Testing Library, Cypress, pytest

## Getting Help

- Check the [FAQ](./user/faq.md)
- Review [Troubleshooting Guide](./developer/troubleshooting.md)
- Submit issues on the project repository
- Contact the development team

## Contributing

Please see [Contributing Guide](./developer/contributing.md) for information on how to contribute to this project.