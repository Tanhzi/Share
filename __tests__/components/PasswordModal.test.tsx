import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PasswordModal } from '../PasswordModal';

describe('PasswordModal', () => {
  const mockOnVerify = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly when visible', () => {
    const { getByPlaceholderText } = render(
      <PasswordModal
        visible={true}
        onClose={mockOnClose}
        onVerify={mockOnVerify}
        isLoading={false}
      />
    );
    expect(getByPlaceholderText('Enter Password')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByPlaceholderText } = render(
      <PasswordModal
        visible={false}
        onClose={mockOnClose}
        onVerify={mockOnVerify}
        isLoading={false}
      />
    );
    expect(queryByPlaceholderText('Enter Password')).toBeNull();
  });

  it('calls onVerify with password when confirm button is pressed', async () => {
    const { getByText, getByPlaceholderText } = render(
      <PasswordModal
        visible={true}
        onClose={mockOnClose}
        onVerify={mockOnVerify}
        isLoading={false}
        docName="test.pdf"
      />
    );

    const passwordInput = getByPlaceholderText('Enter Password');
    fireEvent.changeText(passwordInput, '123456');

    const confirmButton = getByText('Unlock & Download');
    fireEvent.press(confirmButton);

    await waitFor(() => {
      expect(mockOnVerify).toHaveBeenCalledWith('123456');
    });
  });

  it('calls onClose when cancel button is pressed', () => {
    const { getByText } = render(
      <PasswordModal
        visible={true}
        onClose={mockOnClose}
        onVerify={mockOnVerify}
        isLoading={false}
      />
    );

    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows error when password is empty', () => {
    const { getByText } = render(
      <PasswordModal
        visible={true}
        onClose={mockOnClose}
        onVerify={mockOnVerify}
        isLoading={false}
      />
    );

    const confirmButton = getByText('Unlock & Download');
    fireEvent.press(confirmButton);

    // Should not call onVerify if password is empty
    expect(mockOnVerify).not.toHaveBeenCalled();
  });

  it('disables confirm button when loading', () => {
    const { getByText } = render(
      <PasswordModal
        visible={true}
        onClose={mockOnClose}
        onVerify={mockOnVerify}
        isLoading={true}
      />
    );

    const confirmButton = getByText('Unlock & Download');
    expect(confirmButton.props.disabled).toBe(true);
  });

  it('disables confirm button when locked after max attempts', async () => {
    const { getByText } = render(
      <PasswordModal
        visible={true}
        onClose={mockOnClose}
        onVerify={mockOnVerify}
        isLoading={false}
      />
    );

    // Simulate 5 failed attempts
    for (let i = 0; i < 5; i++) {
      const confirmButton = getByText('Unlock & Download');
      fireEvent.press(confirmButton);
    }

    await waitFor(() => {
      const confirmButton = getByText('Unlock & Download');
      expect(confirmButton.props.disabled).toBe(true);
    });
  });
});
