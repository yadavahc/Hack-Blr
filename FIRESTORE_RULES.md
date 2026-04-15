# Firestore Security Rules for Legal Saathi

This document explains the Firestore security rules for the Legal Saathi project and how to deploy them.

## Overview

These rules enforce:

- **User isolation**: Users can only access their own documents, chat messages, and preferences
- **Data validation**: Field requirements and type checks on write operations
- **Immutability**: Certain fields cannot be changed after creation
- **Role-based access**: Authorization based on authenticated user UID

## Collections

### 1. `documents`

Stores uploaded legal documents with analysis results.

**Fields:**

- `userId` (string, required) - Owner of the document
- `fileName` (string, required) - Original filename
- `fileType` (string, required) - File MIME type (pdf, docx, image, etc.)
- `fileSize` (number, required) - Size in bytes
- `storageUrl` (string, optional) - Cloud Storage URL
- `extractedText` (string, optional) - OCR/extracted text
- `analysis` (object, optional) - AI analysis results
- `language` (string, required) - Document language
- `status` (string, required) - One of: uploading, processing, completed, error
- `createdAt` (timestamp) - Auto-set by server
- `updatedAt` (timestamp) - Auto-set on updates

**Rules:**

- ✅ Read: Own documents only
- ✅ Create: Must set userId to authenticated user's uid
- ✅ Update: Can update analysis, status, text fields; cannot change immutable fields
- ✅ Delete: Own documents only
- ✅ List: Queryable with userId == request.auth.uid filter

### 2. `chatMessages`

Stores chat conversation history for document analysis and questions.

**Fields:**

- `userId` (string, required) - Conversation owner
- `documentId` (string, optional) - Associated document (if null, general chat)
- `role` (string, required) - Either 'user' or 'assistant'
- `content` (string, required) - Message text
- `language` (string, required) - Message language
- `createdAt` (timestamp) - Auto-set by server

**Rules:**

- ✅ Read: Own messages only
- ✅ Create: Must set userId to authenticated user's uid
- ❌ Update: Messages are immutable (immutable by design for audit trail)
- ✅ Delete: Can delete own messages
- ✅ List: Queryable with userId == request.auth.uid filter

### 3. `userPreferences`

Stores per-user settings and preferences.

**Fields:**

- `userId` (string, required) - User identifier
- `language` (string, required) - Preferred language
- `voiceEnabled` (boolean, required) - Voice assistant enabled
- `lastActive` (timestamp) - Last activity timestamp

**Rules:**

- ✅ Read: Own preferences only
- ✅ Create: Must set userId to authenticated user's uid
- ✅ Update: Can update own preferences
- ❌ Delete: Cannot delete (instead update fields to defaults)
- 🔒 Note: Uses userId as document ID for 1:1 mapping

## Deployment

### Option 1: Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select the **hack-blr-e37bd** project
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the entire contents of `firestore.rules`
5. Paste into the editor
6. Click **Publish**

### Option 2: Firebase CLI

```bash
# Install Firebase CLI if not already done
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set the project
firebase use hack-blr-e37bd

# Deploy rules
firebase deploy --only firestore:rules

# Or deploy all (functions, rules, storage, etc)
firebase deploy
```

### Option 3: GitHub Actions (Recommended for CI/CD)

Create `.github/workflows/deploy-firestore-rules.yml`:

```yaml
name: Deploy Firestore Rules

on:
  push:
    branches: [main]
    paths:
      - "firestore.rules"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install -g firebase-tools
      - run: firebase deploy --only firestore:rules --token ${{ secrets.FIREBASE_TOKEN }}
```

## Security Considerations

### ✅ What these rules protect:

1. **User Isolation**: Users cannot read/modify other users' data
2. **Field Validation**: Invalid or malicious data cannot be written
3. **Immutable Fields**: Critical fields like userId, fileName cannot be changed
4. **Status Validation**: Document status must be one of allowed values
5. **No Wildcard Reads**: Users cannot use `get()` without knowing the exact document path
6. **Explicit Deny**: Any access not explicitly allowed is denied

### ⚠️ Still need backend validation:

1. **File integrity**: Backend should validate file content, virus scan
2. **AI analysis**: Backend processes before storing (Firestore rules don't execute code)
3. **Storage permissions**: Configure Cloud Storage rules separately
4. **Document deletion cascade**: Firestore doesn't auto-delete chat messages when document is deleted
5. **Rate limiting**: Implement in Cloud Functions or API layer
6. **Quota enforcement**: Monitor user storage/document limits at application level

### 🔐 Additional recommendations:

1. **Enable Firestore audit logging** in Google Cloud Console
2. **Set up Cloud Monitoring alerts** for suspicious activity patterns
3. **Implement backend rate limiting** on `/api/upload`, `/api/analyze`, `/api/chat`
4. **Add function-level authentication** to Cloud Functions that modify Firestore
5. **Encrypt sensitive fields** at application level before storing (PII, credit card info, etc.)
6. **Set up Firestore backup** with automated daily snapshots
7. **Document retention policy**: Consider auto-deleting old documents after N days

## Testing the Rules

### Using Firestore Emulator (Local Development)

1. Install emulator:

```bash
firebase init emulators
```

2. Start emulator:

```bash
firebase emulators:start
```

3. In your code, connect to emulator:

```typescript
// In development
if (process.env.NODE_ENV === "development") {
  connectFirestoreEmulator(db, "localhost", 8080);
}
```

4. Test with Firestore Emulator Suite UI (http://localhost:4000)

### Unit Testing with Rules Testing Library

Create `firestore.test.ts`:

```typescript
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

let testEnv: RulesTestEnvironment;
const userId = "test-user-123";
const otherUserId = "other-user-456";

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "hack-blr-e37bd",
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Documents Collection", () => {
  test("User can create own document", async () => {
    const db = testEnv.authenticatedContext(userId).firestore();
    await assertSucceeds(
      setDoc(doc(collection(db, "documents"), "doc1"), {
        userId,
        fileName: "test.pdf",
        fileType: "application/pdf",
        fileSize: 1024,
        language: "en",
        status: "completed",
      }),
    );
  });

  test("User cannot create document for another user", async () => {
    const db = testEnv.authenticatedContext(userId).firestore();
    await assertFails(
      setDoc(doc(collection(db, "documents"), "doc1"), {
        userId: otherUserId,
        fileName: "test.pdf",
        fileType: "application/pdf",
        fileSize: 1024,
        language: "en",
        status: "completed",
      }),
    );
  });
});
```

## Monitoring & Troubleshooting

### Common Errors:

| Error                        | Cause                             | Solution                                        |
| ---------------------------- | --------------------------------- | ----------------------------------------------- |
| `Permission denied` on read  | Accessing another user's data     | Verify userId matches request.auth.uid          |
| `Invalid argument` on create | Missing required field            | Check all required fields are present           |
| `Document already exists`    | Trying to create with explicit ID | Let Firestore auto-generate IDs with `addDoc()` |
| `Failed to write document`   | Invalid field value type          | Verify field types match schema                 |

### Monitoring Queries:

Query suspicious access patterns in Cloud Logging:

```
resource.type="cloud_firestore_database"
severity="NOTICE"
protoPayload.authenticationInfo.principalEmail!="system"
protoPayload.methodName=~".*Firestore.*"
```

## File Location

- **Rules file**: `/firestore.rules`
- **Config file**: `firebase.json` (add after deploying)

Example `firebase.json`:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

## Version History

| Date       | Changes                                                    |
| ---------- | ---------------------------------------------------------- |
| 2026-04-15 | Initial rules for documents, chatMessages, userPreferences |

---

**Last Updated:** April 15, 2026
