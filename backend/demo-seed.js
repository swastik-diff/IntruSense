'use strict';

const { v4: uuidv4 } = require('uuid');
const db = require('./database');

// Data arrays cleared to ensure zero entries are created
const DEMO_PROFILES = [];
const COMMON_PASSWORDS = [];
const COMMON_USERNAMES = [];

/**
 * Seed the database with 15 realistic demo attacker profiles.
 * This is now a no-op function that prevents data insertion while maintaining compatibility.
 */
function seedDemoData() {
  // Logic disabled: Function will return immediately without executing any database operations.
  return;
}

module.exports = { seedDemoData };