import { alpha } from '@mui/material/styles';

export const ui = {
  pageRoot: {
    minHeight: '100vh',
    bgcolor: '#F6F7FB',
    backgroundImage: `
      radial-gradient(900px 450px at 12% 0%, ${alpha('#60A5FA', 0.16)} 0%, transparent 55%),
      radial-gradient(900px 450px at 88% 0%, ${alpha('#A78BFA', 0.16)} 0%, transparent 55%)
    `,
  },

  container: { py: 3 },

  headerStack: {
    mb: 2,
    direction: { xs: 'column', sm: 'row' },
    spacing: 1,
    alignItems: { sm: 'center' },
  },

  title: { fontWeight: 900, color: '#0F172A' },
  subtitle: { color: 'rgba(15, 23, 42, 0.65)', mt: 0.5 },

  glassCard: {
    borderRadius: 3,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    bgcolor: alpha('#fff', 0.9),
  },

  errorCard: {
    mb: 2,
    borderRadius: 3,
    borderColor: alpha('#EF4444', 0.35),
    bgcolor: alpha('#fff', 0.9),
  },

  pillBtn: (bg, hoverBg) => ({
    borderRadius: 999,
    px: 2.2,
    bgcolor: bg,
    '&:hover': { bgcolor: hoverBg },
  }),
};
