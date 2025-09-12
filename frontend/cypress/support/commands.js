// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for file uploads
import 'cypress-file-upload';

// Custom command for accessibility testing
import 'cypress-axe';

// Custom authentication commands
Cypress.Commands.add('loginAsUser', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      username: 'testuser',
      password: 'password123'
    }
  }).then((response) => {
    window.localStorage.setItem('token', response.body.token);
    window.localStorage.setItem('user', JSON.stringify(response.body.user));
  });
});

Cypress.Commands.add('loginAsResearcher', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      username: 'researcher',
      password: 'password123'
    }
  }).then((response) => {
    window.localStorage.setItem('token', response.body.token);
    window.localStorage.setItem('user', JSON.stringify(response.body.user));
  });
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      username: 'admin',
      password: 'password123'
    }
  }).then((response) => {
    window.localStorage.setItem('token', response.body.token);
    window.localStorage.setItem('user', JSON.stringify(response.body.user));
  });
});

// Custom commands for API interactions
Cypress.Commands.add('createStepAPI', (stepData) => {
  const token = window.localStorage.getItem('token');
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/steps`,
    body: stepData,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
});

Cypress.Commands.add('createTrialAPI', (trialData) => {
  const token = window.localStorage.getItem('token');
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/trials`,
    body: trialData,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
});

Cypress.Commands.add('createExperimentAPI', (experimentData) => {
  const token = window.localStorage.getItem('token');
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/experiments`,
    body: experimentData,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
});

// Custom commands for form interactions
Cypress.Commands.add('fillStepForm', (stepData) => {
  cy.get('[data-testid="step-name-input"]').clear().type(stepData.name);
  cy.get('[data-testid="step-type-select"]').select(stepData.type);
  cy.get('[data-testid="step-duration-input"]').clear().type(stepData.duration.toString());
  
  if (stepData.type === 'Music') {
    if (stepData.details?.volume) {
      cy.get('[data-testid="volume-input"]').clear().type(stepData.details.volume.toString());
    }
    if (stepData.details?.file) {
      cy.get('[data-testid="file-input"]').attachFile(stepData.details.file);
    }
  } else if (stepData.type === 'Question') {
    if (stepData.details?.questionText) {
      cy.get('[data-testid="question-text-input"]').clear().type(stepData.details.questionText);
    }
    if (stepData.details?.options) {
      stepData.details.options.forEach((option, index) => {
        cy.get(`[data-testid="option-${index}-input"]`).clear().type(option);
      });
    }
  } else if (stepData.type === 'Rest') {
    if (stepData.details?.instructions) {
      cy.get('[data-testid="instructions-input"]').clear().type(stepData.details.instructions);
    }
  }
});

// Custom commands for navigation
Cypress.Commands.add('navigateToSteps', () => {
  cy.get('[data-testid="steps-nav"]').click();
  cy.url().should('include', '/steps');
});

Cypress.Commands.add('navigateToTrials', () => {
  cy.get('[data-testid="trials-nav"]').click();
  cy.url().should('include', '/trials');
});

Cypress.Commands.add('navigateToExperiments', () => {
  cy.get('[data-testid="experiments-nav"]').click();
  cy.url().should('include', '/experiments');
});

Cypress.Commands.add('navigateToAdmin', () => {
  cy.get('[data-testid="admin-nav"]').click();
  cy.url().should('include', '/admin');
});

// Custom commands for data table interactions
Cypress.Commands.add('sortTableBy', (column) => {
  cy.get(`[data-testid="sort-${column}"]`).click();
});

Cypress.Commands.add('filterTableBy', (column, value) => {
  cy.get(`[data-testid="filter-${column}"]`).type(value);
});

Cypress.Commands.add('selectTableRow', (index) => {
  cy.get(`[data-testid="table-row-${index}"] input[type="checkbox"]`).check();
});

// Custom commands for modal interactions
Cypress.Commands.add('openModal', (modalType) => {
  cy.get(`[data-testid="open-${modalType}-modal"]`).click();
  cy.get(`[data-testid="${modalType}-modal"]`).should('be.visible');
});

Cypress.Commands.add('closeModal', (modalType) => {
  cy.get(`[data-testid="close-${modalType}-modal"]`).click();
  cy.get(`[data-testid="${modalType}-modal"]`).should('not.exist');
});

Cypress.Commands.add('confirmModal', (modalType) => {
  cy.get(`[data-testid="confirm-${modalType}-modal"]`).click();
});

// Custom commands for drag and drop
Cypress.Commands.add('dragAndDrop', (sourceSelector, targetSelector) => {
  cy.get(sourceSelector).trigger('mousedown', { button: 0 });
  cy.get(targetSelector).trigger('mousemove').trigger('mouseup');
});

// Custom commands for file uploads with specific types
Cypress.Commands.add('uploadAudioFile', (fileName = 'test-audio.mp3') => {
  cy.fixture(fileName, 'base64').then(fileContent => {
    cy.get('[data-testid="file-input"]').attachFile({
      fileContent,
      fileName,
      mimeType: 'audio/mpeg',
      encoding: 'base64'
    });
  });
});

Cypress.Commands.add('uploadImageFile', (fileName = 'test-image.jpg') => {
  cy.fixture(fileName, 'base64').then(fileContent => {
    cy.get('[data-testid="file-input"]').attachFile({
      fileContent,
      fileName,
      mimeType: 'image/jpeg',
      encoding: 'base64'
    });
  });
});

// Custom commands for waiting and validation
Cypress.Commands.add('waitForApiCall', (method, endpoint) => {
  cy.wait(`@${method.toLowerCase()}Request`).then((interception) => {
    expect(interception.request.url).to.include(endpoint);
    expect(interception.response.statusCode).to.be.oneOf([200, 201, 204]);
  });
});

Cypress.Commands.add('validateFormError', (fieldName, errorMessage) => {
  cy.get(`[data-testid="${fieldName}-error"]`).should('be.visible');
  if (errorMessage) {
    cy.get(`[data-testid="${fieldName}-error"]`).should('contain.text', errorMessage);
  }
});

Cypress.Commands.add('validateSuccessMessage', (message) => {
  cy.get('[data-testid="success-alert"]').should('be.visible');
  if (message) {
    cy.get('[data-testid="success-alert"]').should('contain.text', message);
  }
});

Cypress.Commands.add('validateErrorMessage', (message) => {
  cy.get('[data-testid="error-alert"]').should('be.visible');
  if (message) {
    cy.get('[data-testid="error-alert"]').should('contain.text', message);
  }
});

// Custom commands for responsive testing
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 667); // iPhone 6/7/8
});

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport(768, 1024); // iPad
});

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720); // Standard desktop
});

// Custom commands for experiment execution
Cypress.Commands.add('runExperiment', (experimentId) => {
  cy.get(`[data-testid="run-experiment-${experimentId}"]`).click();
  cy.get('[data-testid="experiment-runner"]').should('be.visible');
});

Cypress.Commands.add('answerQuestionStep', (answer) => {
  cy.get('[data-testid="question-step"]').should('be.visible');
  cy.get(`[data-testid="answer-option"]`).contains(answer).click();
  cy.get('[data-testid="next-step-button"]').click();
});

Cypress.Commands.add('waitForMusicStep', (duration) => {
  cy.get('[data-testid="music-step"]').should('be.visible');
  cy.get('[data-testid="music-player"]').should('be.visible');
  // Wait for the music step duration (convert seconds to milliseconds)
  cy.wait(duration * 1000);
});

Cypress.Commands.add('completeRestStep', () => {
  cy.get('[data-testid="rest-step"]').should('be.visible');
  cy.get('[data-testid="rest-timer"]').should('be.visible');
  // Click skip if available, or wait for completion
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="skip-rest-button"]').length > 0) {
      cy.get('[data-testid="skip-rest-button"]').click();
    }
  });
});

// Custom commands for OpenBCI integration testing
Cypress.Commands.add('connectOpenBCI', (serialPort = 'COM3') => {
  cy.get('[data-testid="openbci-connect-button"]').click();
  cy.get('[data-testid="serial-port-select"]').select(serialPort);
  cy.get('[data-testid="confirm-connect-button"]').click();
  cy.get('[data-testid="connection-status"]').should('contain.text', 'Connected');
});

Cypress.Commands.add('startEEGRecording', (experimentName) => {
  cy.get('[data-testid="start-recording-button"]').click();
  if (experimentName) {
    cy.get('[data-testid="experiment-name-input"]').clear().type(experimentName);
  }
  cy.get('[data-testid="confirm-start-recording"]').click();
  cy.get('[data-testid="recording-status"]').should('contain.text', 'Recording');
});

Cypress.Commands.add('stopEEGRecording', () => {
  cy.get('[data-testid="stop-recording-button"]').click();
  cy.get('[data-testid="confirm-stop-recording"]').click();
  cy.get('[data-testid="recording-status"]').should('contain.text', 'Stopped');
});

// Overwrite the visit command to include authentication state
Cypress.Commands.overwrite('visit', (originalFn, url, options = {}) => {
  const { authenticate, ...otherOptions } = options;
  
  if (authenticate) {
    // Set up authentication before visiting the page
    const authData = {
      token: 'mock-jwt-token',
      user: {
        _id: '64f8b123456789abcdef0003',
        username: 'testuser',
        role: 'researcher'
      }
    };
    
    window.localStorage.setItem('token', authData.token);
    window.localStorage.setItem('user', JSON.stringify(authData.user));
  }
  
  return originalFn(url, otherOptions);
});

// Add a command to clear all test data
Cypress.Commands.add('clearTestData', () => {
  const token = window.localStorage.getItem('token');
  
  // This would ideally call a test-only API endpoint to clear test data
  // For now, we'll just clear localStorage
  cy.clearLocalStorage();
  cy.clearCookies();
});