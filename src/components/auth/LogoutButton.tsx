import React from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

interface LogoutButtonProps {
  variant?: 'button' | 'icon';
  size?: 'small' | 'medium' | 'large';
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  variant = 'button', 
  size = 'medium' 
}) => {
  const { logout, loading } = useSupabaseAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (variant === 'icon') {
    return (
      <Tooltip title="Sign Out">
        <IconButton 
          onClick={handleLogout} 
          disabled={loading}
          size={size}
        >
          <LogoutIcon />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={loading}
      variant="outlined"
      size={size}
      startIcon={<LogoutIcon />}
    >
      {loading ? 'Signing Out...' : 'Sign Out'}
    </Button>
  );
};

export default LogoutButton;