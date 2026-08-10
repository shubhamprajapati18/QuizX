const supabase = require('../config/supabase');
const fs = require('fs');
const path = require('path');

async function testConnectionAndSchema() {
  console.log('Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('faculties').select('count', { count: 'exact', head: true });
    if (error && error.code === '42P01') {
      console.log('Tables do not exist yet in Supabase.');
      console.log('Please execute the SQL script in `supabase/schema.sql` via Supabase Dashboard -> SQL Editor.');
    } else if (error) {
      console.log('Supabase connection note:', error.message);
    } else {
      console.log('Supabase connected successfully! Database tables are ready.');
    }
  } catch (err) {
    console.error('Error testing connection:', err.message);
  }
}

testConnectionAndSchema();
