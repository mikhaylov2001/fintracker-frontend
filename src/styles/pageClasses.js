import { alpha } from '@mui/material/styles';

export const page = {
  root: {
    minHeight: '100vh',
    bgcolor: '#F6F7FB',
    backgroundImage: `
      radial-gradient(900px 450px at 12% 0%, ${alpha('#60A5FA', 0.16)} 0%, transparent 55%),
      radial-gradient(900px 450px at 88% 0%, ${alpha('#A78BFA', 0.16)} 0%, transparent 55%)
    `,
  },

  container: { py: 3 },

  headerRow: {
    mb: 2,
    display: 'flex',
    gap: 1,
    flexDirection: { xs: 'column', sm: 'row' },
    alignItems: { sm: 'center' },
    justifyContent: 'space-between',
  },

  title: { fontWeight: 900, color: '#0F172A' },
  subtitle: { color: 'rgba(15, 23, 42, 0.65)', mt: 0.5 },

  card: {
    borderRadius: 3,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    bgcolor: alpha('#fff', 0.9),
  },

  errorCard: {
    borderRadius: 3,
    borderColor: alpha('#EF4444', 0.35),
    bgcolor: alpha('#fff', 0.9),
    mb: 2,
  },

  btnOrange: {
    borderRadius: 999,
    px: 2.2,
    bgcolor: '#F97316',
    '&:hover': { bgcolor: '#EA580C' },
  },

  btnBlue: {
    borderRadius: 999,
    px: 2.2,
    bgcolor: '#2563EB',
    '&:hover': { bgcolor: '#1D4ED8' },
  },
};
