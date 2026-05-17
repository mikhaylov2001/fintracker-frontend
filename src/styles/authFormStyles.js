/** Стили форм входа/регистрации — светлая карточка, контрастные поля и кнопки */

import { ftHex } from "./ftColors";

export const authPaperSx = {
  p: { xs: 3, md: 4 },
  width: "100%",
  maxWidth: 420,
  mx: "auto",
  borderRadius: 5,
  background: "#ffffff",
  border: "1px solid rgba(15, 23, 42, 0.1)",
  boxShadow:
    "0 24px 56px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06) inset",
};

export const authTitleSx = {
  fontSize: { xs: 24, sm: 28 },
  fontWeight: 900,
  letterSpacing: -0.3,
  color: "#0f172a",
};

export const authSubtitleSx = {
  mt: 1,
  fontSize: 14,
  lineHeight: 1.5,
  color: "#475569",
};

export const authTextFieldSx = {
  mt: 1,
  mb: 0.5,
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    "& fieldset": {
      borderColor: "#cbd5e1",
      borderWidth: "1.5px",
    },
    "&:hover fieldset": {
      borderColor: "#94a3b8",
    },
    "&.Mui-focused fieldset": {
      borderColor: ftHex.primary,
      borderWidth: "2px",
    },
    "&.Mui-error fieldset": {
      borderColor: ftHex.danger,
    },
    "& input": {
      color: "#0f172a",
      fontSize: "16px",
      fontWeight: 500,
      padding: "14px 14px",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#64748b",
    fontWeight: 600,
    fontSize: "14px",
    "&.Mui-focused": {
      color: ftHex.primary,
    },
    "&.Mui-error": {
      color: ftHex.danger,
    },
  },
  "& .MuiFormHelperText-root": {
    marginLeft: 0,
    marginTop: "6px",
    fontSize: "13px",
    color: "#64748b",
  },
  "& .MuiFormHelperText-root.Mui-error": {
    color: ftHex.danger,
    fontWeight: 500,
  },
};

export const authSubmitBtnSx = {
  mt: 2.5,
  mb: 1.5,
  borderRadius: "999px",
  py: 1.35,
  minHeight: 48,
  fontWeight: 800,
  textTransform: "none",
  fontSize: 16,
  letterSpacing: 0.2,
  backgroundColor: ftHex.primary,
  color: "#ffffff",
  boxShadow: "0 0 28px rgba(0, 198, 129, 0.45)",
  "&:hover": {
    backgroundColor: ftHex.primaryHover,
    boxShadow: "0 0 36px rgba(0, 198, 129, 0.55)",
  },
  "&.Mui-disabled": {
    backgroundColor: "#f1f5f9",
    color: "#94a3b8",
    boxShadow: "none",
    border: "1.5px solid #e2e8f0",
  },
};

export const authLinkSx = {
  fontWeight: 700,
  color: ftHex.primary,
  textDecoration: "none",
  "&:hover": {
    textDecoration: "underline",
    color: ftHex.primaryHover,
  },
};

export const authFooterTextSx = {
  mt: 0.5,
  color: "#475569",
  fontSize: 14,
};

export const authErrorSx = {
  mt: 1.5,
  mb: 0.5,
  p: 1.25,
  borderRadius: 2,
  fontSize: 14,
  fontWeight: 500,
  color: ftHex.danger,
  backgroundColor: "rgba(245, 71, 72, 0.08)",
  border: "1px solid rgba(245, 71, 72, 0.25)",
};

export const authDividerLabelSx = {
  color: "#94a3b8",
  textTransform: "uppercase",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
};

export const authHeroTitleSx = {
  color: "#ffffff",
  fontWeight: 950,
  textShadow: "0 2px 24px rgba(0,0,0,0.35)",
};

export const authHeroTextSx = {
  color: "rgba(255, 255, 255, 0.88)",
  lineHeight: 1.45,
};
