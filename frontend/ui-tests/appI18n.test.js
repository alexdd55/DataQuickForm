import test from "node:test";
import assert from "node:assert/strict";

import {
  LOCALE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  detectInitialLocale,
  detectInitialThemePreference,
  detectSystemTheme,
  localeNames,
  translations
} from "../.tmp-tests/appI18n.js";

function withMockLocalStorage(storage, run) {
  const original = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
    writable: true
  });
  try {
    run();
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      value: original,
      configurable: true,
      writable: true
    });
  }
}

function withMockWindow(windowValue, run) {
  const original = globalThis.window;
  Object.defineProperty(globalThis, "window", {
    value: windowValue,
    configurable: true,
    writable: true
  });
  try {
    run();
  } finally {
    Object.defineProperty(globalThis, "window", {
      value: original,
      configurable: true,
      writable: true
    });
  }
}

test("detectInitialLocale reads valid locale from localStorage and falls back to en", () => {
  withMockLocalStorage(
    {
      getItem: (key) => (key === LOCALE_STORAGE_KEY ? "de" : null)
    },
    () => {
      assert.equal(detectInitialLocale(), "de");
    }
  );

  withMockLocalStorage(
    {
      getItem: () => "invalid"
    },
    () => {
      assert.equal(detectInitialLocale(), "en");
    }
  );
});

test("detectInitialThemePreference reads valid theme from localStorage and falls back to system", () => {
  withMockLocalStorage(
    {
      getItem: (key) => (key === THEME_STORAGE_KEY ? "dark" : null)
    },
    () => {
      assert.equal(detectInitialThemePreference(), "dark");
    }
  );

  withMockLocalStorage(
    {
      getItem: () => "invalid"
    },
    () => {
      assert.equal(detectInitialThemePreference(), "system");
    }
  );
});

test("detectSystemTheme returns dark/light based on matchMedia", () => {
  withMockWindow(
    {
      matchMedia: () => ({ matches: true })
    },
    () => {
      assert.equal(detectSystemTheme(), "dark");
    }
  );

  withMockWindow(
    {
      matchMedia: () => ({ matches: false })
    },
    () => {
      assert.equal(detectSystemTheme(), "light");
    }
  );
});

test("i18n resources include expected locale names and keys", () => {
  assert.equal(localeNames.en, "English");
  assert.equal(localeNames.de, "Deutsch");
  assert.ok(translations.appReady.en.length > 0);
  assert.ok(translations.actionCompareClipboard.fr.length > 0);
});
