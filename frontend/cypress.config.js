const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      apiUrl: 'http://localhost:5000/api',
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
      });
      
      // Clear downloads folder before each test run
      on('before:run', () => {
        return new Promise((resolve) => {
          const fs = require('fs');
          const path = require('path');
          const downloadsFolder = path.join(__dirname, 'cypress', 'downloads');
          
          if (fs.existsSync(downloadsFolder)) {
            fs.rmSync(downloadsFolder, { recursive: true, force: true });
          }
          
          resolve();
        });
      });
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    downloadsFolder: 'cypress/downloads',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
  },
  
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    setupNodeEvents(on, config) {
      // component testing node events
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js',
  },
});