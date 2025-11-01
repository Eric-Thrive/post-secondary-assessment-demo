import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

async function verifyPippa() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const checkResult = await client.query(
      'SELECT id, username, email, email_verified, is_active, role FROM users WHERE username = $1',
      ['Pippa']
    );

    if (checkResult.rows.length === 0) {
      console.log('User Pippa not found');
      const allUsers = await client.query(
        'SELECT username, email, email_verified FROM users ORDER BY username'
      );
      console.log('\nAll users:');
      console.table(allUsers.rows);
      return;
    }

    const user = checkResult.rows[0];
    console.log('\nCurrent status:');
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Email Verified:', user.email_verified);
    console.log('Active:', user.is_active);
    console.log('Role:', user.role);

    if (user.email_verified) {
      console.log('\nEmail is already verified!');
      return;
    }

    console.log('\nVerifying email...');
    await client.query(
      `UPDATE users 
       SET email_verified = true,
           email_verification_token = NULL,
           email_verification_expiry = NULL
       WHERE username = $1`,
      ['Pippa']
    );

    console.log('Email verified successfully!');
    console.log('\nPippa can now log in with:');
    console.log('Username: Pippa');
    console.log('Password: 77Emily#77');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyPippa();
