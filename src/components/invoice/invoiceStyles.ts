import { StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts to support the ₹ (Rupee) symbol and premium look
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfChc9AMP6lbBP.ttf', fontWeight: 'bold' }
  ]
});

export const COLORS = {
  background: '#ffffff',
  primary: '#D97706',
  secondary: '#8B5A2B',
  border: '#F5D8AE',
  lightBg: '#FFF9F3',
  goldenAccent: '#D4A017',
  textDark: '#3b2a1a',
  textLight: '#646464',
  success: '#10A314', // Green
  warning: '#F59E0B', // Orange
  danger: '#DC3545',  // Red
};

export const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.background,
    fontFamily: 'Roboto',
    paddingBottom: 50,
  },
  topStrip: {
    height: 12,
    backgroundColor: COLORS.primary,
    width: '100%',
  },
  
  // Layout utilities
  row: {
    flexDirection: 'row',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  alignCenter: {
    alignItems: 'center',
  },
  alignStart: {
    alignItems: 'flex-start',
  },
  container: {
    paddingHorizontal: 35,
  },

  // Typography
  textBold: {
    fontWeight: 'bold',
  },
  textPrimary: {
    color: COLORS.primary,
  },
  textSecondary: {
    color: COLORS.textLight,
  },
  textDark: {
    color: COLORS.textDark,
  },

  // Cards
  cardTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 9,
    color: COLORS.textLight,
    marginBottom: 3,
    lineHeight: 1.4,
  },
  standardCard: {
    backgroundColor: COLORS.lightBg,
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  
  // Specific sections
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 6,
  },
});
