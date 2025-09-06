const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function checkResponses() {
  try {
    await client.connect();
    
    // Get last 68 responses ordered by date
    const result = await client.query(
      'SELECT id, full_name, identification, created_at, exit_reason_category, exit_reason_detail FROM responses ORDER BY created_at DESC LIMIT 68'
    );
    
    console.log('Total responses found:', result.rows.length);
    
    // Count responses without exit_reason_detail
    const withoutReason = result.rows.filter(r => !r.exit_reason_detail || r.exit_reason_detail === '');
    console.log('Responses without exit_reason_detail:', withoutReason.length);
    
    // Show first few examples
    console.log('\nFirst 10 responses without exit_reason_detail:');
    withoutReason.slice(0, 10).forEach(r => {
      console.log('ID:', r.id, 'Name:', r.full_name, 'Date:', r.created_at);
      console.log('Exit reason category:', r.exit_reason_category || 'EMPTY');
      console.log('Exit reason detail:', r.exit_reason_detail || 'EMPTY');
      console.log('---');
    });
    
    // Show all recent responses to understand the pattern
    console.log('\n\nALL 68 recent responses summary:');
    result.rows.forEach((r, index) => {
      const hasDetail = r.exit_reason_detail && r.exit_reason_detail !== '';
      console.log(`${index + 1}. ID: ${r.id}, Name: ${r.full_name}, Has detail: ${hasDetail ? 'YES' : 'NO'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkResponses();