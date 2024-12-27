export const themes: any = {
  default: {
    name: "default",
    className: "default-theme",
  },
  dark: {
    name: "dark",
    className: "dark-theme",
  },
  custom: {
    name: "custom",
    className: "custom-theme",
  },
} as const;

export type ThemeType = keyof typeof themes;
