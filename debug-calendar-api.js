// Test script for Google Calendar API endpoint
// This will help debug the calendar integration

import { NextRequest } from 'next/server';

console.log('🔍 Testing Google Calendar API Route');

// Mock session data for testing
const mockSession = {
  user: { id: 'test-user', email: 'test@example.com' },
  accessToken: 'mock-token',
  expires: '2024-12-31'
};

// Mock request data
const mockRequestData = {
  title: "Test Task from Knowledge Hub",
  startTime: "2025-07-30T09:00:00.000Z",
  endTime: "2025-07-30T09:30:00.000Z",
  notes: "Task from Knowledge Hub: Test Document"
};

console.log('📋 Mock Session:', JSON.stringify(mockSession, null, 2));
console.log('📋 Mock Request Data:', JSON.stringify(mockRequestData, null, 2));

// Common issues and their solutions
const commonIssues = [
  {
    issue: "401 Unauthorized",
    causes: [
      "Access token is missing or expired",
      "Refresh token is invalid",
      "User not authenticated with Google",
      "Session data is corrupted"
    ],
    solutions: [
      "Check if user is signed in with Google provider",
      "Verify access token exists in session",
      "Implement proper token refresh logic",
      "Re-authenticate user if needed"
    ]
  },
  {
    issue: "403 Forbidden", 
    causes: [
      "Google Calendar API not enabled",
      "Insufficient OAuth scopes",
      "API quota exceeded",
      "Project configuration issues"
    ],
    solutions: [
      "Enable Google Calendar API in Google Cloud Console",
      "Add 'https://www.googleapis.com/auth/calendar.events' scope",
      "Check API quotas and limits",
      "Verify OAuth consent screen configuration"
    ]
  },
  {
    issue: "400 Bad Request",
    causes: [
      "Invalid date format",
      "Missing required fields",
      "Invalid calendar ID",
      "Malformed request body"
    ],
    solutions: [
      "Use proper ISO 8601 date format",
      "Validate all required fields",
      "Use 'primary' as calendar ID",
      "Validate request schema"
    ]
  },
  {
    issue: "Event not appearing",
    causes: [
      "Timezone issues",
      "Event created in wrong calendar",
      "Date/time parsing problems",
      "Calendar sync delays"
    ],
    solutions: [
      "Specify timezone explicitly",
      "Verify calendar ID is correct",
      "Use proper date parsing",
      "Allow time for calendar sync"
    ]
  }
];

console.log('\n🚨 Common Issues and Solutions:');
commonIssues.forEach((issue, index) => {
  console.log(`\n${index + 1}. ${issue.issue}`);
  console.log('   Causes:');
  issue.causes.forEach(cause => console.log(`     - ${cause}`));
  console.log('   Solutions:');
  issue.solutions.forEach(solution => console.log(`     - ${solution}`));
});

// Check OAuth scope configuration
console.log('\n🔐 OAuth Scope Configuration Check:');
console.log('Required scope: https://www.googleapis.com/auth/calendar.events');
console.log('Make sure this scope is included in your Google OAuth configuration');

// Date format validation
console.log('\n📅 Date Format Validation:');
const testDate = "2025-07-30";
try {
  const startTime = new Date(`${testDate}T09:00:00`);
  const endTime = new Date(startTime.getTime() + 30 * 60000);
  
  console.log('✅ Date parsing successful:');
  console.log('   Start:', startTime.toISOString());
  console.log('   End:', endTime.toISOString());
} catch (error) {
  console.log('❌ Date parsing failed:', error.message);
}

console.log('\n🔍 Debug Analysis Complete');
