import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { styles as globalStyles, COLORS } from './invoiceStyles';

const localStyles = StyleSheet.create({
  container: {
    ...globalStyles.row,
    ...globalStyles.spaceBetween,
    ...globalStyles.container,
    marginTop: 20,
  },
  contactBox: {
    width: '23%',
    backgroundColor: COLORS.lightBg,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  contactValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  contactLabel: {
    fontSize: 8,
    color: COLORS.textLight,
  },
});

export const ContactCards = () => (
  <View style={localStyles.container} wrap={false}>
    <View style={localStyles.contactBox}>
      <Text style={localStyles.contactValue}>📞 Call Us</Text>
      <Text style={localStyles.contactLabel}>+91 99132 52232</Text>
    </View>
    <View style={localStyles.contactBox}>
      <Text style={localStyles.contactValue}>💬 WhatsApp</Text>
      <Text style={localStyles.contactLabel}>+91 99132 52232</Text>
    </View>
    <View style={localStyles.contactBox}>
      <Text style={localStyles.contactValue}>🌐 Website</Text>
      <Text style={localStyles.contactLabel}>mehtadairy.com</Text>
    </View>
    <View style={localStyles.contactBox}>
      <Text style={localStyles.contactValue}>📍 Location</Text>
      <Text style={localStyles.contactLabel}>Palitana, Gujarat</Text>
    </View>
  </View>
);
