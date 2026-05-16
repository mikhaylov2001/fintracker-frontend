import React, { useCallback, useEffect, useRef, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  "1096583300191-ecs88krahb9drbhbs873ma4mieb7lihj.apps.googleusercontent.com";

const GIS_SRC = "https://accounts.google.com/gsi/client";

let gisInitialized = false;

function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(true);

    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.56 2.96-2.26 5.48-4.82 7.18l7.73 6c4.51-4.16 7.12-10.27 7.12-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

/**
 * Кастомный вид + официальный GIS-клик поверх (прозрачный слой).
 * @see https://developers.google.com/identity/gsi/web/guides/display-button#custom-button
 */
export default function GoogleSignInButton({
  onCredential,
  label = "Войти через Google",
  disabled = false,
}) {
  const containerRef = useRef(null);
  const googleRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  callbackRef.current = onCredential;

  const renderGoogleButton = useCallback(() => {
    if (!googleRef.current || !window.google?.accounts?.id) return;

    const width = Math.max(
      240,
      Math.floor(containerRef.current?.getBoundingClientRect().width || 400)
    );

    googleRef.current.innerHTML = "";

    window.google.accounts.id.renderButton(googleRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "rectangular",
      text: "signin_with",
      logo_alignment: "left",
      width,
      locale: "ru",
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadGisScript();
        if (cancelled || !window.google?.accounts?.id) return;

        if (!gisInitialized) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => callbackRef.current?.(response),
            auto_select: false,
            cancel_on_tap_outside: true,
            itp_support: true,
          });
          gisInitialized = true;
        }

        renderGoogleButton();
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();

    const onResize = () => {
      if (ready) renderGoogleButton();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
    };
  }, [renderGoogleButton, ready]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        width: "100%",
        minHeight: 48,
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      {/* Визуальная кнопка — клики проходят сквозь неё */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          py: 1.25,
          px: 2,
          borderRadius: 1,
          bgcolor: "#fff",
          border: "1px solid #dadce0",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {!ready && !loadError ? (
          <CircularProgress size={20} sx={{ color: "#9aa0a6" }} />
        ) : (
          <GoogleLogo />
        )}
        <Typography
          component="span"
          sx={{
            fontSize: 15,
            fontWeight: 500,
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            color: loadError ? "#d93025" : "#3c4043",
          }}
        >
          {loadError ? "Google недоступен" : label}
        </Typography>
      </Box>

      {/* Официальная кнопка Google поверх — принимает клики */}
      {!loadError && (
        <Box
          ref={googleRef}
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            opacity: 0.0001,
            overflow: "hidden",
            display: "flex",
            alignItems: "stretch",
            justifyContent: "center",
            cursor: "pointer",
            "& > div": {
              width: "100% !important",
              height: "100% !important",
              display: "flex !important",
              alignItems: "center !important",
              justifyContent: "center !important",
            },
            "& iframe": {
              width: "100% !important",
              minHeight: "48px !important",
              margin: "0 !important",
            },
          }}
        />
      )}
    </Box>
  );
}
