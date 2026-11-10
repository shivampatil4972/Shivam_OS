"use client";

import type { SearchAction } from "@/lib/searchIndex";
import { copyText, publishActivity } from "./state/activity";
import { switchTheme } from "./themeTransition";
import type { useOS } from "./OSContext";

type OS = ReturnType<typeof useOS>;

export function runSearchAction(os: OS, action: SearchAction, trigger?: HTMLElement | null) {
  switch (action.kind) {
    case "open":
      os.open(action.app, action.params, { trigger });
      break;
    case "external":
      window.open(action.href, "_blank", "noopener,noreferrer");
      break;
    case "copy":
      void copyText(action.text, action.label);
      break;
    case "download": {
      const a = document.createElement("a");
      a.href = action.href;
      a.download = action.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      publishActivity({ kind: "info", title: "Résumé download started", detail: action.fileName });
      break;
    }
    case "toggle-theme": {
      const dark = document.documentElement.dataset.theme !== "light";
      switchTheme(dark ? "light" : "dark");
      publishActivity({ kind: "info", title: `${dark ? "Light" : "Dark"} mode`, detail: `Theme preference: ${dark ? "light" : "dark"}` });
      break;
    }
  }
}
