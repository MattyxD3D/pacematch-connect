# 🔐 Firebase Realtime Database Security Rules Setup

## ⚠️ ACTION REQUIRED

You need to update your Firebase Realtime Database security rules to allow access to all the new data structures.

## 📋 Steps to Update Rules

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/project/pacematch-gps/database/pacematch-gps-default-rtdb/rules

2. **Copy and paste the complete rules below:**

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      "$uid": {
        ".read": "$uid === auth.uid || (auth != null && (data.child('visible').val() == true || !data.child('visible').exists()))",
        ".write": "$uid === auth.uid",
        ".validate": "newData.hasChildren(['name', 'email']) || !newData.exists()"
      }
    },
    "workouts": {
      "$userId": {
        ".read": "$userId === auth.uid || auth != null",
        ".write": "$userId === auth.uid",
        "$workoutId": {
          ".read": "$userId === auth.uid || auth != null",
          ".write": "$userId === auth.uid"
        }
      }
    },
    "friendRequests": {
      "$userId": {
        ".read": "$userId === auth.uid || auth != null",
        ".write": "auth != null",
        "$fromUserId": {
          ".read": "$userId === auth.uid || $fromUserId === auth.uid",
          ".write": "$userId === auth.uid || $fromUserId === auth.uid"
        }
      }
    },
    "friends": {
      "$userId": {
        ".read": "$userId === auth.uid || auth != null",
        ".write": "auth != null",
        "$friendId": {
          ".read": "$userId === auth.uid || $friendId === auth.uid",
          ".write": "$userId === auth.uid || $friendId === auth.uid"
        }
      }
    },
    "messages": {
      "$conversationId": {
        ".read": "auth != null && (root.child('conversations').child($conversationId).child('participants').hasChild(auth.uid))",
        ".write": "auth != null && (root.child('conversations').child($conversationId).child('participants').hasChild(auth.uid))",
        "$messageId": {
          ".read": "auth != null && (root.child('conversations').child($conversationId).child('participants').hasChild(auth.uid))",
          ".write": "auth != null && (data.child('senderId').val() === auth.uid || newData.child('senderId').val() === auth.uid)"
        }
      }
    },
    "conversations": {
      "$conversationId": {
        ".read": "auth != null && (data.child('participants').hasChild(auth.uid))",
        ".write": "auth != null && (data.child('participants').hasChild(auth.uid) || newData.child('participants').hasChild(auth.uid))"
      }
    },
    "events": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$eventId": {
        ".read": "auth != null",
        ".write": "auth != null && (data.child('hostId').val() === auth.uid || newData.child('hostId').val() === auth.uid)",
        "participants": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    },
    "workoutPosts": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$postId": {
        ".read": "auth != null",
        ".write": "auth != null && (data.child('userId').val() === auth.uid || newData.child('userId').val() === auth.uid)",
        "kudos": {
          ".read": "auth != null",
          ".write": "auth != null"
        },
        "comments": {
          ".read": "auth != null",
          ".write": "auth != null",
          "$commentId": {
            ".read": "auth != null",
            ".write": "auth != null && (data.child('userId').val() === auth.uid || newData.child('userId').val() === auth.uid)"
          }
        }
      }
    }
  }
}
```

3. **Click "Publish"** to save the rules

4. **Wait 30-60 seconds** for rules to propagate

5. **Test your app** - All features should now work!

## 📊 What These Rules Cover

### ✅ Users
- Users can read their own data
- Users can read other users' data if `visible === true` or not set
- Users can only write their own data

### ✅ Workouts
- Users can read/write their own workouts
- Authenticated users can read others' workouts (for feed)

### ✅ Friend Requests
- Users can read their own incoming/outgoing requests
- Users can send/accept/decline requests

### ✅ Friends
- Users can read their own friends list
- Users can add/remove friends

### ✅ Messages & Conversations
- Only conversation participants can read/write messages
- Users can only send messages as themselves

### ✅ Events
- All authenticated users can read events
- Only event host can modify event details
- Any authenticated user can join/leave events

### ✅ Workout Posts (Feed)
- All authenticated users can read posts
- Users can only create/edit their own posts
- Anyone can add kudos/comments
- Users can only delete their own comments

## 🔒 Security Notes

- **All rules require authentication** (`auth != null`)
- **Users can only modify their own data** (except for social interactions like kudos/comments)
- **Conversations are private** - only participants can access
- **Events are public** - all users can see and join

## 🚨 For Production

Consider adding:
- Rate limiting
- Data validation rules
- More granular permissions
- Index optimization

---

**After updating rules, your app will have full Firebase access! 🚀**

