import { StyleSheet, Font } from '@react-pdf/renderer';

// Register Noto Sans to support Indian Rupee Symbol (₹) and other Unicode elements
Font.register({
  family: 'Noto Sans',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A99d.ttf',
      fontWeight: 400
    },
    {
      src: 'https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyDPA99d.ttf',
      fontWeight: 500
    },
    {
      src: 'https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyAjBN9d.ttf',
      fontWeight: 600
    },
    {
      src: 'https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyAaBN9d.ttf',
      fontWeight: 700
    }
  ]
});

export const formatIndianCurrency = (num: number): string => {
  const parts = Number(num || 0).toFixed(2).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Format integer part to Indian numbering format (e.g., 2,00,000.00)
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherParts = integerPart.substring(0, integerPart.length - 3);
  if (otherParts !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherParts.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return `₹${formattedInteger}.${decimalPart}`;
};

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
    fontFamily: 'Noto Sans',
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
