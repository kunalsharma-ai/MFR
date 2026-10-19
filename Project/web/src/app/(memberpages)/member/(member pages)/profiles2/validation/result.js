// Shared result helpers. Every validator returns:
//   { ok: true, value, flags: [] }                       PASS (flags = soft risk signals)
//   { ok: false, key, vars, value }                      fix needed (shown to the respondent)
// Four outcome levels used across the platform (see VALIDATION.md):
//   PASS  ·  SOFT_FLAG (allowed, monitored)  ·  STEP_UP (OTP / CAPTCHA)  ·  BLOCK (strong fraud signals only)
export const LEVEL = { PASS: 'pass', SOFT: 'soft', STEP_UP: 'step-up', BLOCK: 'block' };
export const ok = (value, flags = []) => ({ ok: true, value, flags });
export const bad = (key, vars, value) => ({ ok: false, key, vars, value });
export const flag = (code, weight = 0, detail) => ({ code, weight, detail });
export const clean = (v) => String(v ?? '').normalize('NFC').replace(/[​-‍﻿]/g, '').replace(/\s+/g, ' ').trim();
