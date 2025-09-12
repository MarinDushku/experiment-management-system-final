# Contributing Guide

Thank you for your interest in contributing to the Research Experiment Management System! This guide will help you get started with contributing to the project.

## Getting Started

### Prerequisites

Before contributing, ensure you have:
- Read the [Developer Setup Guide](./setup.md)
- Set up your development environment
- Familiarized yourself with the codebase
- Reviewed existing issues and pull requests

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:
- Be respectful and constructive in all interactions
- Focus on what is best for the community and research
- Show empathy towards other community members
- Report any unacceptable behavior to project maintainers

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

#### 🐛 Bug Reports
- Report bugs through GitHub Issues
- Include detailed reproduction steps
- Provide system information and error messages
- Test with the latest version before reporting

#### ✨ Feature Requests
- Suggest new features through GitHub Issues
- Explain the use case and benefit
- Consider implementation complexity
- Discuss with maintainers before starting work

#### 📖 Documentation
- Improve existing documentation
- Add examples and tutorials
- Fix typos and clarify confusing sections
- Translate documentation to other languages

#### 🧪 Testing
- Add test cases for untested code
- Improve test coverage
- Add integration and E2E tests
- Test on different platforms and configurations

#### 💻 Code Contributions
- Fix bugs and implement features
- Improve performance and security
- Refactor and clean up code
- Add new experimental features

## Development Workflow

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/yourusername/experiment-management-system.git
cd experiment-management-system

# Add upstream remote
git remote add upstream https://github.com/originalowner/experiment-management-system.git
```

### 2. Create a Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name
# or
git checkout -b bugfix/issue-number-description
# or
git checkout -b docs/documentation-improvement
```

### Branch Naming Conventions

- `feature/` - New features or enhancements
- `bugfix/` - Bug fixes
- `hotfix/` - Critical fixes for production
- `docs/` - Documentation updates
- `test/` - Testing improvements
- `refactor/` - Code refactoring
- `chore/` - Maintenance tasks

### 3. Make Changes

#### Code Style Guidelines

**JavaScript/Node.js (Backend)**
- Use ES6+ features consistently
- Follow existing code formatting
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Handle errors appropriately

```javascript
/**
 * Creates a new experiment with validation
 * @param {Object} experimentData - Experiment configuration
 * @param {string} experimentData.name - Experiment name
 * @param {string} experimentData.description - Experiment description
 * @param {string} userId - ID of the creating user
 * @returns {Promise<Object>} Created experiment object
 * @throws {ValidationError} When validation fails
 */
async function createExperiment(experimentData, userId) {
  try {
    // Implementation here
  } catch (error) {
    // Error handling
  }
}
```

**React/JavaScript (Frontend)**
- Use functional components with hooks
- Follow React best practices
- Use descriptive component names
- Implement proper error boundaries
- Add PropTypes or TypeScript types

```javascript
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ExperimentCard = ({ experiment, onSelect }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Side effects here
  }, [experiment.id]);

  return (
    <div className="experiment-card">
      {/* Component JSX */}
    </div>
  );
};

ExperimentCard.propTypes = {
  experiment: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired
};
```

**Python (OpenBCI Integration)**
- Follow PEP 8 style guide
- Use type hints where appropriate
- Add docstrings for functions and classes
- Handle exceptions properly

```python
def collect_eeg_data(participant_name: str, duration: int = 60) -> str:
    """
    Collect EEG data from OpenBCI device.
    
    Args:
        participant_name: Name of the participant
        duration: Recording duration in seconds
        
    Returns:
        Filename of the saved EEG data
        
    Raises:
        OpenBCIConnectionError: When device is not connected
        ValidationError: When parameters are invalid
    """
    try:
        # Implementation here
        pass
    except Exception as e:
        # Error handling
        raise
```

#### Testing Requirements

**All contributions must include appropriate tests:**

**Backend Tests**
```javascript
// Unit test example
describe('ExperimentController', () => {
  describe('createExperiment', () => {
    it('should create experiment with valid data', async () => {
      const experimentData = {
        name: 'Test Experiment',
        description: 'Test description'
      };
      
      const result = await request(app)
        .post('/api/experiments')
        .set('Authorization', `Bearer ${token}`)
        .send(experimentData)
        .expect(201);
        
      expect(result.body.name).toBe(experimentData.name);
    });

    it('should reject experiment with invalid data', async () => {
      const invalidData = { name: '' };
      
      await request(app)
        .post('/api/experiments')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData)
        .expect(400);
    });
  });
});
```

**Frontend Tests**
```javascript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import ExperimentCard from '../ExperimentCard';

describe('ExperimentCard', () => {
  const mockExperiment = {
    id: '1',
    name: 'Test Experiment',
    description: 'Test description'
  };

  it('renders experiment information correctly', () => {
    render(<ExperimentCard experiment={mockExperiment} onSelect={jest.fn()} />);
    
    expect(screen.getByText('Test Experiment')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const mockOnSelect = jest.fn();
    render(<ExperimentCard experiment={mockExperiment} onSelect={mockOnSelect} />);
    
    fireEvent.click(screen.getByText('Test Experiment'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockExperiment);
  });
});
```

### 4. Commit Changes

#### Commit Message Format

Use conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(experiments): add audio stimulus support

Add ability to upload and play audio files in experimental steps.
Includes validation for supported audio formats (MP3, WAV, M4A).

Closes #123
```

```
fix(auth): resolve token expiration handling

Fix issue where expired JWT tokens weren't properly handled,
causing users to see confusing error messages.

Fixes #456
```

```
docs(api): update OpenAPI specification

Add missing endpoints and improve parameter descriptions
in the API documentation.
```

### 5. Run Tests

Before committing, ensure all tests pass:

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests  
cd frontend
npm test
npm run test:coverage

# Python tests
cd backend
python -m pytest tests/ -v

# Integration tests
npm run test:integration
```

### 6. Push and Create Pull Request

```bash
# Push your branch
git push origin feature/your-feature-name

# Create pull request through GitHub interface
```

## Pull Request Guidelines

### Pull Request Template

When creating a pull request, include:

```markdown
## Description
Brief description of changes made

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
Describe the tests that you ran to verify your changes

## Checklist:
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs tests and checks
2. **Code Review**: Maintainers review code for quality and functionality
3. **Testing**: Manual testing of new features
4. **Documentation**: Verify documentation is updated
5. **Approval**: At least one maintainer approval required
6. **Merge**: Squash and merge after approval

### Review Criteria

Reviewers will check:
- **Functionality**: Does the code work as intended?
- **Code Quality**: Is the code clean, readable, and maintainable?
- **Testing**: Are there adequate tests with good coverage?
- **Documentation**: Is documentation updated and accurate?
- **Security**: Are there any security vulnerabilities?
- **Performance**: Does the change impact performance?
- **Compatibility**: Does it maintain backward compatibility?

## Issue Guidelines

### Bug Reports

Use this template for bug reports:

```markdown
**Bug Description**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
Add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. Windows 10, macOS 12, Ubuntu 20.04]
 - Browser: [e.g. Chrome 98, Firefox 97]
 - Node.js Version: [e.g. 18.14.0]
 - System Version: [e.g. 1.2.3]

**Additional Context**
Any other context about the problem.
```

### Feature Requests

Use this template for feature requests:

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**Use Case**
Explain how this feature would be used in real scenarios.

**Implementation Ideas**
If you have ideas about implementation, share them here.
```

## Development Resources

### Useful Commands

```bash
# Start development environment
npm run dev

# Run specific tests
npm test -- --testNamePattern="Experiment"

# Check code coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Database operations
npm run create-admin
npm run seed-data
```

### Testing Guidelines

#### Test Coverage Requirements
- **Minimum overall coverage**: 80%
- **Critical functions**: 90%+ coverage
- **New features**: Must include comprehensive tests
- **Bug fixes**: Must include regression tests

#### Test Types
- **Unit Tests**: Test individual functions/components
- **Integration Tests**: Test API endpoints and database interactions
- **Component Tests**: Test React components with user interactions
- **E2E Tests**: Test complete user workflows

### Documentation Standards

- **API Changes**: Update OpenAPI specification
- **New Features**: Add user documentation and examples
- **Configuration**: Document new environment variables
- **Dependencies**: Update installation instructions

## Security Considerations

### Reporting Security Issues

- **Do NOT** create public issues for security vulnerabilities
- Email security issues to: [security@yourproject.com]
- Include detailed information about the vulnerability
- Allow reasonable time for fixes before public disclosure

### Security Guidelines

- Validate all user inputs
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Sanitize data before displaying to users
- Keep dependencies updated
- Follow OWASP security guidelines

## Release Process

### Version Numbering

We follow Semantic Versioning (SemVer):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Schedule

- **Major releases**: Every 6-12 months
- **Minor releases**: Every 1-3 months
- **Patch releases**: As needed for critical fixes

## Getting Help

### Community Support

- **GitHub Discussions**: General questions and ideas
- **GitHub Issues**: Bug reports and feature requests
- **Email**: Direct contact for sensitive issues
- **Documentation**: Comprehensive guides and API reference

### Maintainer Contact

- Create issues for bugs and features
- Tag maintainers with @username for urgent issues
- Email for security concerns or private matters

## Recognition

Contributors are recognized through:
- **Contributors file**: All contributors listed
- **Release notes**: Major contributions highlighted  
- **GitHub achievements**: Contributor badges and statistics
- **Community appreciation**: Public recognition in discussions

Thank you for contributing to the Research Experiment Management System! Your contributions help advance scientific research and open-source software development.