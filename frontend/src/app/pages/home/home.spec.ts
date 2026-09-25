import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Home } from './home';
import { provideRouter } from '@angular/router';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should indicate that the user is not logged in when there is no access token', () => {
    expect(component.isLoggedIn).toBe(false);
  });

  it('should indicate that the user is logged in when an access token exists', () => {
    localStorage.setItem('accessToken', 'test-token');

    const fixture = TestBed.createComponent(Home);
    const home = fixture.componentInstance;

    expect(home.isLoggedIn).toBe(true);
  });
});