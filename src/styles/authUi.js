/** Общие MUI-стили для страниц авторизации — в духе Lovable / ft-theme */

export const authHeroSx = {
  borderRadius: "calc(var(--radius) + 8px)",
  border: "1px solid oklch(1 0 0 / 8%)",
  backgroundColor: "oklch(0.205 0.008 285 / 0.55)",
  backdropFilter: "blur(12px)",
};

export const authPaperSx = {
  p: { xs: 3, md: 4 },
  width: "100%",
  maxWidth: 420,
  mx: "auto",
  borderRadius: "calc(var(--radius) + 8px)",
  backgroundColor: "oklch(0.205 0.008 285)",
  border: "1px solid oklch(1 0 0 / 7%)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
  color: "oklch(0.96 0.005 285)",
};

export const authTitleSx = {
  fontSize: 26,
  fontWeight: 900,
  letterSpacing: 0.2,
  color: "oklch(0.96 0.005 285)",
};

export const authSubtitleSx = {
  mt: 0.8,
  fontSize: 13,
  color: "oklch(0.62 0.012 285)",
};

export const authHeroTitleSx = {
  color: "oklch(0.96 0.005 285)",
  fontWeight: 950,
};

export const authHeroTextSx = {
  color: "oklch(0.62 0.012 285)",
};

export const authPrimaryButtonSx = {
  mt: 1.5,
  py: 1.2,
  fontWeight: 800,
  borderRadius: 999,
  backgroundColor: "oklch(0.72 0.18 162)",
  color: "oklch(0.18 0.04 162)",
  "&:hover": {
    backgroundColor: "oklch(0.76 0.18 162)",
  },
};
