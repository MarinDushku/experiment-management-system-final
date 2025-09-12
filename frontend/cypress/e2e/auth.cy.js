describe('Authentication E2E Tests', () => {
  beforeEach(() => {
    // Visit the application
    cy.visit('http://localhost:3000');
    
    // Clear any existing auth data
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should display login page for unauthenticated users', () => {
    cy.visit('http://localhost:3000/login');
    
    cy.get('h2').should('contain.text', 'Login');
    cy.get('input[name="username"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain.text', 'Login');
  });

  it('should handle successful login flow', () => {
    // Mock the login API call
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'mock-jwt-token',
        user: {
          _id: 'user123',
          username: 'testuser',
          role: 'researcher'
        }
      }
    }).as('loginRequest');

    // Visit login page
    cy.visit('http://localhost:3000/login');

    // Fill in credentials
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('password123');

    // Submit form
    cy.get('button[type="submit"]').click();

    // Wait for the API call
    cy.wait('@loginRequest');

    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Check that token is stored (if accessible)
    cy.window().then((window) => {
      expect(window.localStorage.getItem('token')).to.equal('mock-jwt-token');
    });
  });

  it('should handle login failure', () => {
    // Mock failed login API call
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: {
        message: 'Invalid credentials'
      }
    }).as('failedLoginRequest');

    // Visit login page
    cy.visit('http://localhost:3000/login');

    // Fill in wrong credentials
    cy.get('input[name="username"]').type('wronguser');
    cy.get('input[name="password"]').type('wrongpassword');

    // Submit form
    cy.get('button[type="submit"]').click();

    // Wait for the API call
    cy.wait('@failedLoginRequest');

    // Should stay on login page and show error
    cy.url().should('include', '/login');
    cy.get('.error-message').should('contain.text', 'Invalid credentials');
  });

  it('should display register page', () => {
    cy.visit('http://localhost:3000/register');
    
    cy.get('h2').should('contain.text', 'Register');
    cy.get('input[name="username"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('input[name="confirmPassword"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain.text', 'Register');
  });

  it('should handle successful registration', () => {
    // Mock successful registration
    cy.intercept('POST', '/api/auth/register', {
      statusCode: 201,
      body: {
        message: 'Registration successful! Please login.'
      }
    }).as('registerRequest');

    // Visit register page
    cy.visit('http://localhost:3000/register');

    // Fill in registration form
    cy.get('input[name="username"]').type('newuser');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('password123');

    // Submit form
    cy.get('button[type="submit"]').click();

    // Wait for API call
    cy.wait('@registerRequest');

    // Should show success message
    cy.get('.success-message').should('contain.text', 'Registration successful! Please login.');
    
    // Form should be cleared
    cy.get('input[name="username"]').should('have.value', '');
    cy.get('input[name="password"]').should('have.value', '');
    cy.get('input[name="confirmPassword"]').should('have.value', '');
  });

  it('should validate password confirmation on registration', () => {
    cy.visit('http://localhost:3000/register');

    // Fill in form with mismatched passwords
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('differentpassword');

    // Submit form
    cy.get('button[type="submit"]').click();

    // Should show validation error
    cy.get('.error-message').should('contain.text', 'Passwords do not match');
  });

  it('should navigate between login and register pages', () => {
    cy.visit('http://localhost:3000/login');

    // Should have link to register
    cy.get('a').contains('Register').click();
    cy.url().should('include', '/register');

    // Should have link back to login
    cy.get('a').contains('Login').click();
    cy.url().should('include', '/login');
  });

  context('Authenticated Navigation', () => {
    beforeEach(() => {
      // Mock authenticated state
      const mockUser = {
        _id: 'user123',
        username: 'testuser',
        role: 'researcher'
      };

      // Set up localStorage before visiting pages
      cy.window().then((window) => {
        window.localStorage.setItem('token', 'mock-jwt-token');
        window.localStorage.setItem('user', JSON.stringify(mockUser));
      });
    });

    it('should display navigation for authenticated researchers', () => {
      cy.visit('http://localhost:3000/dashboard');
      
      // Should show researcher navigation
      cy.get('nav').within(() => {
        cy.get('a').should('contain.text', 'Dashboard');
        cy.get('a').should('contain.text', 'Experiments');
        cy.get('a').should('contain.text', 'Trials');
        cy.get('a').should('contain.text', 'Steps');
        cy.get('a').should('contain.text', 'Logout');
        
        // Should not show admin panel
        cy.get('a').should('not.contain.text', 'Admin Panel');
      });
    });

    it('should handle logout functionality', () => {
      cy.visit('http://localhost:3000/dashboard');
      
      // Click logout
      cy.get('a').contains('Logout').click();
      
      // Should redirect to login and clear storage
      cy.url().should('include', '/login');
      
      cy.window().then((window) => {
        expect(window.localStorage.getItem('token')).to.be.null;
        expect(window.localStorage.getItem('user')).to.be.null;
      });
    });
  });

  context('Admin Navigation', () => {
    beforeEach(() => {
      // Mock admin user
      const mockAdminUser = {
        _id: 'admin123',
        username: 'adminuser',
        role: 'admin'
      };

      cy.window().then((window) => {
        window.localStorage.setItem('token', 'mock-admin-token');
        window.localStorage.setItem('user', JSON.stringify(mockAdminUser));
      });
    });

    it('should display admin navigation for admin users', () => {
      cy.visit('http://localhost:3000/dashboard');
      
      // Should show admin navigation
      cy.get('nav').within(() => {
        cy.get('a').should('contain.text', 'Dashboard');
        cy.get('a').should('contain.text', 'Admin Panel');
        cy.get('a').should('contain.text', 'Experiments');
        cy.get('a').should('contain.text', 'Trials');
        cy.get('a').should('contain.text', 'Steps');
        cy.get('a').should('contain.text', 'Logout');
      });
    });
  });
});