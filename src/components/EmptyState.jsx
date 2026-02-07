import React from 'react';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';

export default function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack spacing={1.25} alignItems="center" sx={{ py: 2.5, textAlign: 'center' }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 999,
              bgcolor: 'action.hover',
            }}
          />
          <Typography sx={{ fontWeight: 900 }}>{title}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 520 }}>
            {description}
          </Typography>
          {actionLabel ? (
            <Button variant="contained" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
