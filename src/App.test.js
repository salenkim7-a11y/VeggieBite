import { render, screen } from '@testing-library/react';
import App from './App';

test('renders home hero headline', () => {
  render(<App />);
  expect(screen.getByText(/healthy snacking starts here/i)).toBeInTheDocument();
});
