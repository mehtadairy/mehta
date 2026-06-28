import React from 'react';
import { View, Text, StyleSheet, Svg, Path } from '@react-pdf/renderer';
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
    backgroundColor: '#FDFBF9',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#EAE3D2',
    alignItems: 'center',
  },
  icon: {
    width: 16,
    height: 16,
    marginBottom: 8,
    color: '#D97706',
  },
  contactValue: {
    fontSize: 9,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 2,
  },
  contactLabel: {
    fontSize: 8,
    color: '#4B5563',
  },
});

export const ContactCards = () => (
  <View style={localStyles.container} wrap={false}>
    <View style={localStyles.contactBox}>
      <Svg viewBox="0 0 24 24" style={localStyles.icon}>
        <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
      <Text style={localStyles.contactValue}>Call Us</Text>
      <Text style={localStyles.contactLabel}>+91 99132 52232</Text>
    </View>
    <View style={localStyles.contactBox}>
      <Svg viewBox="0 0 24 24" style={localStyles.icon}>
        <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
      <Text style={localStyles.contactValue}>WhatsApp</Text>
      <Text style={localStyles.contactLabel}>+91 99132 52232</Text>
    </View>
    <View style={localStyles.contactBox}>
      <Svg viewBox="0 0 24 24" style={localStyles.icon}>
        <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
      <Text style={localStyles.contactValue}>Email</Text>
      <Text style={localStyles.contactLabel}>orders@mehtadairy</Text>
    </View>
    <View style={localStyles.contactBox}>
      <Svg viewBox="0 0 24 24" style={localStyles.icon}>
        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M12 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
      <Text style={localStyles.contactValue}>Location</Text>
      <Text style={localStyles.contactLabel}>Palitana, Gujarat</Text>
    </View>
  </View>
);
