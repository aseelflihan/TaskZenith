// Debug script for Google Calendar Integration
// Run this with: node debug-google-calendar.js

console.log('🔍 ===============================================');
console.log('🔍 DEBUG: Google Calendar Integration Analysis');
console.log('🔍 ===============================================');

// تحقق من متغيرات البيئة
require('dotenv').config({ path: '.env.local' });

console.log('\n📋 Environment Variables Check:');
console.log('✓ GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : '❌ Missing');
console.log('✓ GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : '❌ Missing');
console.log('✓ NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ Missing');
console.log('✓ NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set' : '❌ Missing');

// تحليل المشاكل المحتملة
console.log('\n🔍 Potential Issues Analysis:');

const potentialIssues = [
  {
    issue: 'Google Calendar API not enabled',
    description: 'Google Calendar API might not be enabled in Google Cloud Console',
    solution: 'Enable Google Calendar API in Google Cloud Console for your project'
  },
  {
    issue: 'Insufficient OAuth Scopes',
    description: 'The OAuth scope might not include calendar.events',
    solution: 'Ensure scope includes: https://www.googleapis.com/auth/calendar.events'
  },
  {
    issue: 'Access Token Expired',
    description: 'The access token might be expired and refresh failed',
    solution: 'Check refresh token logic and re-authenticate if needed'
  },
  {
    issue: 'Invalid Date Format',
    description: 'The date format sent to Google Calendar API might be invalid',
    solution: 'Ensure dates are in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)'
  },
  {
    issue: 'Calendar ID Issues',
    description: 'Using wrong calendar ID or user has no primary calendar',
    solution: 'Verify calendar ID and user calendar access'
  }
];

potentialIssues.forEach((issue, index) => {
  console.log(`\n${index + 1}. ${issue.issue}`);
  console.log(`   Problem: ${issue.description}`);
  console.log(`   Solution: ${issue.solution}`);
});

// محاكاة بيانات طلب Google Calendar
console.log('\n📋 Sample Calendar Event Data:');
const sampleEvent = {
  title: "Test Task from Knowledge Hub",
  startTime: "2025-07-30T09:00:00.000Z",
  endTime: "2025-07-30T09:30:00.000Z",
  notes: "Task from Knowledge Hub: Test Document"
};

console.log('Sample Event:', JSON.stringify(sampleEvent, null, 2));

// فحص تنسيق التاريخ
console.log('\n📅 Date Format Validation:');
const testDate = "2025-07-30";
const startTime = new Date(`${testDate}T09:00:00`);
const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutes

console.log('Input Date:', testDate);
console.log('Start Time:', startTime.toISOString());
console.log('End Time:', endTime.toISOString());
console.log('Valid ISO Format:', !isNaN(startTime.getTime()) && !isNaN(endTime.getTime()));

console.log('\n🔍 ===============================================');
console.log('🔍 Debug Analysis Complete');
console.log('🔍 ===============================================');
