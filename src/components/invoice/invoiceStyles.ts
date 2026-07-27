import { StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Poppins',
  fonts: [
    { src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf', fontWeight: 400 },
    { src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Medium.ttf', fontWeight: 500 },
    { src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-SemiBold.ttf', fontWeight: 600 },
    { src: 'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Bold.ttf', fontWeight: 700 }
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
    fontFamily: 'Poppins',
    paddingBottom: 40,
    fontSize: 9,
    color: COLORS.textDark,
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
  textBold: { fontWeight: 700 },
  textMedium: { fontWeight: 500 },
  textSemiBold: { fontWeight: 600 },
  textPrimary: { color: COLORS.primary },
  textSecondary: { color: COLORS.textLight },
  textDark: { color: COLORS.textDark },

  // Cards
  cardTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 10,
    fontWeight: 700,
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
    backgroundColor: '#FDFBF9',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EAE3D2',
  },
  
  // Specific sections
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 6,
  },
});
