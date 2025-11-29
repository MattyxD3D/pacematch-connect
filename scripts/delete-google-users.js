/**
 * Script to delete Google-authenticated regular users (excluding admins)
 * 
 * This script:
 * 1. Lists all Firebase Authentication users
 * 2. Identifies users who signed in with Google
 * 3. Checks if they are admins (by checking adminEmails in Realtime Database)
 * 4. Deletes only non-admin Google users
 * 5. Optionally deletes their data from Realtime Database
 * 
 * IMPORTANT: 
 * - This script requires Firebase Admin SDK
 * - Run this in a Node.js environment, not in the browser
 * - Backup your data before running
 * - Test in a development environment first
 * 
 * Usage:
 *   node scripts/delete-google-users.js [--dry-run] [--delete-db-data]
 * 
 * Options:
 *   --dry-run: Show what would be deleted without actually deleting
 *   --delete-db-data: Also delete user data from Realtime Database
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin SDK
// You need to set GOOGLE_APPLICATION_CREDENTIALS environment variable
// or provide service account key file
if (!admin.apps.length) {
  try {
    // Try to initialize with default credentials
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: 'https://pacematch-gps-default-rtdb.asia-southeast1.firebasedatabase.app/'
    });
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:');
    console.error('   Make sure you have:');
    console.error('   1. Installed firebase-admin: npm install firebase-admin');
    console.error('   2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
    console.error('   3. Or provide service account key file');
    console.error('\n   Example:');
    console.error('   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"');
    console.error('   node scripts/delete-google-users.js');
    process.exit(1);
  }
}

const auth = admin.auth();
const database = admin.database();

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const deleteDbData = args.includes('--delete-db-data');

/**
 * Get admin key format (same as adminService.ts)
 */
const getAdminKey = (email) => {
  if (!email) return null;
  return email.trim().toLowerCase().replace(/[.#$[\]]/g, '_');
};

/**
 * Check if email is an admin
 */
async function isAdmin(email) {
  if (!email) return false;
  
  try {
    const adminKey = getAdminKey(email);
    const adminRef = database.ref(`adminEmails/${adminKey}`);
    const snapshot = await adminRef.once('value');
    return snapshot.exists() && snapshot.val() === true;
  } catch (error) {
    console.error(`Error checking admin status for ${email}:`, error);
    return false; // Err on the side of caution - don't delete if we can't verify
  }
}

/**
 * Check if user signed in with Google
 */
function hasGoogleProvider(user) {
  if (!user.providerData || !Array.isArray(user.providerData)) {
    return false;
  }
  return user.providerData.some(provider => provider.providerId === 'google.com');
}

/**
 * Delete user data from Realtime Database
 */
async function deleteUserData(uid) {
  try {
    const userRef = database.ref(`users/${uid}`);
    await userRef.remove();
    
    // Also remove user's workouts
    const workoutsRef = database.ref(`workouts/${uid}`);
    await workoutsRef.remove();
    
    // Remove from friends lists
    const friendsRef = database.ref(`friends/${uid}`);
    await friendsRef.remove();
    
    // Remove friend requests
    const friendRequestsRef = database.ref(`friendRequests/${uid}`);
    await friendRequestsRef.remove();
    
    console.log(`   ✅ Deleted database data for user ${uid}`);
  } catch (error) {
    console.error(`   ⚠️  Error deleting database data for ${uid}:`, error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\n🔍 Scanning Firebase Authentication users...\n');
  
  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No users will be deleted\n');
  }
  
  try {
    // List all users
    let nextPageToken;
    const googleUsers = [];
    const adminUsers = [];
    const regularUsers = [];
    
    do {
      const listUsersResult = await auth.listUsers(1000, nextPageToken);
      
      for (const userRecord of listUsersResult.users) {
        const user = userRecord.toJSON();
        
        if (hasGoogleProvider(user)) {
          const email = user.email;
          const isUserAdmin = await isAdmin(email);
          
          if (isUserAdmin) {
            adminUsers.push({ uid: user.uid, email: email || 'No email' });
          } else {
            regularUsers.push({ uid: user.uid, email: email || 'No email' });
          }
          
          googleUsers.push({
            uid: user.uid,
            email: email || 'No email',
            displayName: user.displayName || 'No name',
            isAdmin: isUserAdmin
          });
        }
      }
      
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);
    
    // Display summary
    console.log('📊 Summary:');
    console.log(`   Total Google-authenticated users: ${googleUsers.length}`);
    console.log(`   Admin users (will be preserved): ${adminUsers.length}`);
    console.log(`   Regular users (will be deleted): ${regularUsers.length}`);
    console.log('');
    
    if (adminUsers.length > 0) {
      console.log('👑 Admin users (preserved):');
      adminUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.uid})`);
      });
      console.log('');
    }
    
    if (regularUsers.length === 0) {
      console.log('✅ No regular Google users to delete!\n');
      return;
    }
    
    console.log('🗑️  Regular users to be deleted:');
    regularUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.uid})`);
    });
    console.log('');
    
    if (isDryRun) {
      console.log('✅ Dry run complete. No users were deleted.');
      console.log('   Run without --dry-run to actually delete users.\n');
      return;
    }
    
    // Confirm deletion
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question(`⚠️  Are you sure you want to delete ${regularUsers.length} regular Google users? (yes/no): `, resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Deletion cancelled.\n');
      return;
    }
    
    // Delete users
    console.log('\n🗑️  Deleting users...\n');
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const user of regularUsers) {
      try {
        // Delete from Authentication
        await auth.deleteUser(user.uid);
        console.log(`   ✅ Deleted: ${user.email} (${user.uid})`);
        
        // Optionally delete database data
        if (deleteDbData) {
          await deleteUserData(user.uid);
        }
        
        deletedCount++;
      } catch (error) {
        console.error(`   ❌ Error deleting ${user.email}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Deletion Summary:');
    console.log(`   ✅ Successfully deleted: ${deletedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   👑 Admin users preserved: ${adminUsers.length}`);
    console.log('');
    
    if (deleteDbData) {
      console.log('✅ Database data was also deleted for all users.');
    } else {
      console.log('ℹ️  Database data was NOT deleted (use --delete-db-data to delete it).');
    }
    
    console.log('\n✅ Script completed!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

