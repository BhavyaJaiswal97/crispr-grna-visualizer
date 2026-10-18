import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('user loads example, runs search, sees guides', () => {
  render(<App />);
  fireEvent.click(screen.getByText('Load example'));
  fireEvent.click(screen.getByText('Find guides'));
  expect(screen.getByRole('heading', { name: 'Guides' })).toBeInTheDocument();
  expect(screen.getByText('Guides found')).toBeInTheDocument();
});

test('short sequence shows an error', () => {
  render(<App />);
  fireEvent.change(screen.getByPlaceholderText(/Paste DNA/), { target: { value: 'ACGT' } });
  fireEvent.click(screen.getByText('Find guides'));
  expect(screen.getByRole('alert')).toHaveTextContent('Add at least');
});
