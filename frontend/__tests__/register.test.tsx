import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from '../src/app/register/page';

// Mock apiService methods used in the register page
jest.mock('../src/lib/api-service', () => ({
  apiService: {
    register: jest.fn().mockResolvedValue({ data: {}, error: null }),
    login: jest.fn().mockResolvedValue({ data: { token: 'fake-token' }, error: null }),
    uploadLicenseFile: jest.fn(),
    submitNgoLicense: jest.fn(),
  },
}));

describe('RegisterPage', () => {
  it('renders basic fields for NGO registration', () => {
    render(<RegisterPage />);

    expect(screen.getByText(/Partner Registration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Organization Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/Organization Name/i), {
      target: { value: 'Test NGO' },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'ngo@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+910000000000' },
    });
    fireEvent.change(screen.getByLabelText(/Address/i), {
      target: { value: '123 Street' },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: 'Password123!' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: 'Mismatch123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Passwords do not match/i),
      ).toBeInTheDocument();
    });
  });
});

