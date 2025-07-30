import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggler from './ThemeToggler';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('ThemeToggler', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    document.documentElement.classList.remove('dark');
  });

  test('renders theme toggle button', () => {
    render(<ThemeToggler />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  test('shows moon icon initially when no theme is saved', () => {
    localStorageMock.getItem.mockReturnValue(null);
    render(<ThemeToggler />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Switch to dark mode');
  });

  test('shows sun icon when dark mode is active', () => {
    localStorageMock.getItem.mockReturnValue('dark');
    document.documentElement.classList.add('dark');
    render(<ThemeToggler />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Switch to light mode');
  });

  test('toggles theme when clicked', () => {
    localStorageMock.getItem.mockReturnValue('light');
    render(<ThemeToggler />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
}); 