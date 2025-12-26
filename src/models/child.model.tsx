import React, { useState } from 'react';
import { Modal, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ChildModelProps {
  children: React.ReactNode;
}

export const ChildModel: React.FC<ChildModelProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Modal open={isOpen} onClose={() => setIsOpen(false)}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 1,
        }}
      >
        <IconButton
          onClick={() => setIsOpen(false)}
          sx={{ position: 'absolute', top: 8, right: 8 }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
        {children}
      </Box>
    </Modal>
  );
};

export default ChildModel;