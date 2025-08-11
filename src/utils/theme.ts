import { ThemeClasses } from '../types';

export const themeClasses: Record<'light' | 'dark', ThemeClasses> = {
  light: {
    bg: 'bg-gray-50',
    cardBg: 'bg-white',
    headerBg: 'bg-white',
    text: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-500',
    border: 'border-gray-200',
    hover: 'hover:bg-gray-50',
    sidebar: 'bg-white',
    input: 'bg-white border-gray-300'
  },
  dark: {
    bg: 'bg-gray-900',
    cardBg: 'bg-gray-800',
    headerBg: 'bg-gray-800',
    text: 'text-white',
    textSecondary: 'text-gray-300',
    textMuted: 'text-gray-400',
    border: 'border-gray-700',
    hover: 'hover:bg-gray-700',
    sidebar: 'bg-gray-800',
    input: 'bg-gray-700 border-gray-600 text-white'
  }
}; 