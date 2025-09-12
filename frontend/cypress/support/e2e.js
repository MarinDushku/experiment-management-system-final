// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Add custom commands for the experiment management system
Cypress.Commands.add('login', (username = 'testuser', password = 'password123') => {
  cy.visit('/login');
  cy.get('[data-testid="username-input"]').type(username);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('not.include', '/login');
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/login');
});

Cypress.Commands.add('createStep', (stepData) => {
  const defaultStep = {
    name: 'Test Step',
    type: 'Music',
    duration: 60,
    details: { volume: 0.8 }
  };
  
  const step = { ...defaultStep, ...stepData };
  
  cy.visit('/steps');
  cy.get('[data-testid="create-step-button"]').click();
  cy.get('[data-testid="step-name-input"]').type(step.name);
  cy.get('[data-testid="step-type-select"]').select(step.type);
  cy.get('[data-testid="step-duration-input"]').clear().type(step.duration.toString());
  
  if (step.type === 'Music' && step.details.volume) {
    cy.get('[data-testid="volume-input"]').clear().type(step.details.volume.toString());
  }
  
  cy.get('[data-testid="save-step-button"]').click();
  cy.get('[data-testid="success-alert"]').should('be.visible');
});

Cypress.Commands.add('createTrial', (trialData) => {
  const defaultTrial = {
    name: 'Test Trial',
    description: 'A test trial',
    steps: []
  };
  
  const trial = { ...defaultTrial, ...trialData };
  
  cy.visit('/trials');
  cy.get('[data-testid="create-trial-button"]').click();
  cy.get('[data-testid="trial-name-input"]').type(trial.name);
  cy.get('[data-testid="trial-description-input"]').type(trial.description);
  
  // Add steps if provided
  trial.steps.forEach((step, index) => {
    cy.get('[data-testid="add-step-button"]').click();
    cy.get(`[data-testid="step-select-${index}"]`).select(step.stepId);
    cy.get(`[data-testid="step-order-${index}"]`).clear().type(step.order.toString());
  });
  
  cy.get('[data-testid="save-trial-button"]').click();
  cy.get('[data-testid="success-alert"]').should('be.visible');
});

Cypress.Commands.add('createExperiment', (experimentData) => {
  const defaultExperiment = {
    name: 'Test Experiment',
    description: 'A test experiment',
    trials: []
  };
  
  const experiment = { ...defaultExperiment, ...experimentData };
  
  cy.visit('/experiments');
  cy.get('[data-testid="create-experiment-button"]').click();
  cy.get('[data-testid="experiment-name-input"]').type(experiment.name);
  cy.get('[data-testid="experiment-description-input"]').type(experiment.description);
  
  // Add trials if provided
  experiment.trials.forEach((trial, index) => {
    cy.get('[data-testid="add-trial-button"]').click();
    cy.get(`[data-testid="trial-select-${index}"]`).select(trial.trialId);
    cy.get(`[data-testid="trial-order-${index}"]`).clear().type(trial.order.toString());
  });
  
  cy.get('[data-testid="save-experiment-button"]').click();
  cy.get('[data-testid="success-alert"]').should('be.visible');
});

Cypress.Commands.add('uploadFile', (fileName, selector = '[data-testid="file-input"]') => {
  cy.fixture(fileName).then(fileContent => {
    cy.get(selector).attachFile({
      fileContent: fileContent.toString(),
      fileName: fileName,
      mimeType: 'audio/mpeg'
    });
  });
});

Cypress.Commands.add('waitForAPI', (alias) => {
  cy.wait(alias).then((interception) => {
    expect(interception.response.statusCode).to.be.oneOf([200, 201, 204]);
  });
});

Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y();
});

// Custom command for checking alerts
Cypress.Commands.add('checkAlert', (type, message) => {
  cy.get(`[data-testid="${type}-alert"]`).should('be.visible');
  if (message) {
    cy.get(`[data-testid="${type}-alert"]`).should('contain.text', message);
  }
});

// Custom command for checking loading states
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-testid="loading"]').should('not.exist');
});

// Custom command for responsive testing
Cypress.Commands.add('testResponsive', (callback) => {
  const viewports = [
    { width: 320, height: 568 },   // Mobile
    { width: 768, height: 1024 },  // Tablet
    { width: 1280, height: 720 },  // Desktop
  ];
  
  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height);
    callback();
  });
});

// Before each test, reset the database state
beforeEach(() => {
  cy.task('log', `Starting test: ${Cypress.currentTest.title}`);
  
  // Reset any local storage
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Intercept API calls for monitoring
  cy.intercept('GET', '/api/**').as('getRequest');
  cy.intercept('POST', '/api/**').as('postRequest');
  cy.intercept('PUT', '/api/**').as('putRequest');
  cy.intercept('DELETE', '/api/**').as('deleteRequest');
});

// After each test, log results
afterEach(() => {
  cy.task('log', `Finished test: ${Cypress.currentTest.title}`);
});

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // on unhandled promise rejections or other errors
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  
  // Log the error but don't fail the test for certain types
  console.error('Uncaught exception:', err);
  return true;
});

// Add chai assertions
chai.use(require('chai-colors'));

// Configure Cypress behavior
Cypress.config('defaultCommandTimeout', 10000);
Cypress.config('requestTimeout', 10000);
Cypress.config('responseTimeout', 10000);