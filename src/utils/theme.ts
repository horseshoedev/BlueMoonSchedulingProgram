import { ThemeClasses } from '../types';

export const themeClasses: Record<'light' | 'dark', ThemeClasses> = {
  light: {
    bg: 'bg-app-light-bg',
    cardBg: 'bg-app-light-card',
    headerBg: 'bg-app-light-card',
    text: 'text-app-light-text',
    textSecondary: 'text-gray-700',
    textMuted: 'text-gray-600',
    border: 'border-app-light-border',
    hover: 'hover:bg-gray-50',
    sidebar: 'bg-app-light-card',
    input: 'bg-white border-gray-300'
  },
  dark: {
    bg: 'bg-app-dark-bg',
    cardBg: 'bg-app-dark-card-bg',
    headerBg: 'bg-app-dark-card-bg',
    text: 'text-app-dark-text',
    textSecondary: 'text-gray-300',
    textMuted: 'text-gray-400',
    border: 'border-app-dark-border',
    hover: 'hover:bg-gray-700',
    sidebar: 'bg-app-dark-card-bg',
    input: 'bg-gray-700 border-gray-600 text-white'
  }
};