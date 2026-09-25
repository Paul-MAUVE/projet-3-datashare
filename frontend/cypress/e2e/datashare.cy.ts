describe('DataShare', () => {
  it('affiche la page d’accueil', () => {
    cy.visit('/');
    cy.contains('DataShare').should('be.visible');
    cy.contains('Tu veux partager un fichier?').should('be.visible');
  });
});

describe('DataShare - authentification', () => {
  it('permet de créer un compte puis de se connecter', () => {
    const email = `cypress-${Date.now()}@example.com`;
    const password = 'Test1234!';

    cy.visit('/register');

    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('#confirmPassword').type(password);

    cy.contains('button', 'Créer mon compte').click();

    cy.url().should('include', '/login');

    cy.get('#email').type(email);
    cy.get('#password').type(password);

    cy.contains('button', 'Se connecter').click();

    cy.url().should('eq', 'http://localhost:4200/');
  });

  it('redirige vers la connexion si l’utilisateur n’est pas authentifié', () => {
    cy.clearLocalStorage();

    cy.visit('/my-space');

    cy.url().should('include', '/login');
  });
});

describe('DataShare - téléversement', () => {
  it('permet de téléverser un fichier', () => {
    const email = `cypress-upload-${Date.now()}@example.com`;
    const password = 'Test1234!';

    cy.visit('/register');

    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('#confirmPassword').type(password);

    cy.contains('button', 'Créer mon compte').click();

    cy.url().should('include', '/login');

    cy.get('#email').type(email);
    cy.get('#password').type(password);

    cy.contains('button', 'Se connecter').click();

    cy.url().should('eq', 'http://localhost:4200/');

    cy.visit('/upload');

    cy.get('#file').selectFile('cypress/fixtures/test-upload.txt', {
      force: true,
    });

    cy.contains('test-upload.txt').should('be.visible');

    cy.contains('button', 'Téléverser').click();

    cy.contains('.upload-success', 'Félicitations')
      .should('be.visible');

    cy.get('.download-link')
      .should('be.visible')
      .and('have.attr', 'href');
  });
});

describe('DataShare - téléchargement', () => {
  it('permet d’accéder à un fichier à télécharger', () => {
    const email = `cypress-download-${Date.now()}@example.com`;
    const password = 'Test1234!';

    cy.visit('/register');

    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('#confirmPassword').type(password);

    cy.contains('button', 'Créer mon compte').click();

    cy.url().should('include', '/login');

    cy.get('#email').type(email);
    cy.get('#password').type(password);

    cy.contains('button', 'Se connecter').click();

    cy.url().should('eq', 'http://localhost:4200/');

    cy.visit('/upload');

    cy.get('#file').selectFile('cypress/fixtures/test-upload.txt', {
      force: true,
    });

    cy.contains('button', 'Téléverser').click();

    cy.contains('.upload-success', 'Félicitations')
      .should('be.visible');

    cy.visit('/my-space');

    cy.contains('.file-item', 'test-upload.txt')
      .within(() => {
        cy.contains('a', 'Accéder').click();
      });

    cy.url().should('match', /\/download\/.+/);

    cy.contains('h1', 'Télécharger un fichier')
      .should('be.visible');

    cy.contains('.file-info', 'test-upload.txt')
      .should('be.visible');

    cy.contains('button', 'Télécharger')
      .should('be.visible');
  });
});

describe('DataShare - suppression', () => {
  it('permet de supprimer un fichier', () => {
    const email = `cypress-delete-${Date.now()}@example.com`;
    const password = 'Test1234!';

    cy.visit('/register');

    cy.get('#email').type(email);
    cy.get('#password').type(password);
    cy.get('#confirmPassword').type(password);

    cy.contains('button', 'Créer mon compte').click();

    cy.url().should('include', '/login');

    cy.get('#email').type(email);
    cy.get('#password').type(password);

    cy.contains('button', 'Se connecter').click();

    cy.url().should('eq', 'http://localhost:4200/');

    cy.visit('/upload');

    cy.get('#file').selectFile('cypress/fixtures/test-upload.txt', {
      force: true,
    });

    cy.contains('button', 'Téléverser').click();

    cy.contains('.upload-success', 'Félicitations')
      .should('be.visible');

    cy.visit('/my-space');

    cy.contains('.file-item', 'test-upload.txt')
      .should('be.visible');

    cy.on('window:confirm', () => true);

    cy.contains('.file-item', 'test-upload.txt')
      .within(() => {
        cy.contains('button', 'Supprimer').click();
      });

    cy.contains('.file-item', 'test-upload.txt')
      .should('not.exist');

    cy.contains('Aucun fichier pour le moment.')
      .should('be.visible');
  });
});