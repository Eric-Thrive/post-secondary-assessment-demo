# PI Redactor Integration Setup

## Overview
The PI Redactor is now the ONLY method for uploading documents to the assessment application. This ensures all documents are properly de-identified before processing, maintaining HIPAA/FERPA compliance.

## New Redactor URL
Your new PI Redactor is hosted at:
- **Live URL**: https://rewrk-929-text-redactor-eric677.replit.app/
- **Replit Project**: https://replit.com/@eric677/REwrk929TextRedactor

## Setup Instructions

### Step 1: Add Environment Variable in Replit

Since you're running this on Replit, you need to add the environment variable through the Replit Secrets interface:

1. **Open Secrets Manager**:
   - Click on the "Tools" menu in the left sidebar
   - Select "Secrets" (or look for the lock icon 🔒)

2. **Add New Secret**:
   - Click "New Secret" or "Add Secret"
   - **Key**: `VITE_PI_REDACTOR_URL`
   - **Value**: `https://rewrk-929-text-redactor-eric677.replit.app/`
   - Click "Save" or "Add Secret"

### Step 2: Restart the Application

After adding the secret, restart your application:
- Stop the current workflow (if running)
- Start the "Start application" workflow again
- Or simply click "Run" in Replit

The application will automatically pick up the new environment variable.

### Step 3: Verify the Integration

1. Navigate to the assessment form in your application
2. Look for the "PI Redactor Tool" section in the Document Upload area
3. Click "Open PI Redactor Tool"
4. A popup window should open with your redactor application
5. Test the redaction workflow:
   - Upload a document in the redactor
   - Redact any sensitive information
   - Click "Send to Assessment App"
   - The redacted files should appear in your document list

## How It Works

### Communication Flow
1. **Main App → Redactor**: Opens redactor in popup via `window.open()`
2. **Redactor → Main App**: Sends redacted files via `window.opener.postMessage()`
3. **Message Format**:
   ```javascript
   {
     type: 'REDACTED_FILES',
     files: [
       {
         name: 'document.pdf',
         type: 'application/pdf',
         dataUrl: 'data:application/pdf;base64,...'
       }
     ]
   }
   ```

### Security
- The redactor origin is validated before accepting messages
- Only messages from your configured redactor URL are processed
- All file processing happens client-side (no data sent to servers)

## Troubleshooting

### Issue: "PI redactor URL is not configured"
**Solution**: Make sure you've added `VITE_PI_REDACTOR_URL` to Replit Secrets and restarted the app.

### Issue: Popup window is blocked
**Solution**: Allow popups for your Replit domain in browser settings.

### Issue: Files not appearing after redaction
**Solution**: 
1. Check browser console for errors
2. Verify the redactor URL is accessible
3. Ensure popup blockers aren't interfering
4. Make sure you're clicking "Send to Assessment App" in the redactor

### Issue: Wrong redactor version opens
**Solution**: 
1. Clear browser cache
2. Verify the `VITE_PI_REDACTOR_URL` value in Replit Secrets
3. Restart the application

## Environment Variable Reference

The variable must be prefixed with `VITE_` to be accessible in the frontend:

```bash
VITE_PI_REDACTOR_URL=https://rewrk-929-text-redactor-eric677.replit.app/
```

This is accessed in the code as:
```javascript
const redactorUrl = import.meta.env.VITE_PI_REDACTOR_URL;
```

## Privacy & Compliance Notes

- ✅ **Direct uploads have been removed** - Users MUST use the PI Redactor
- ✅ **All processing is client-side** - No documents are sent to servers until redacted
- ✅ **Unique ID enforcement** - Strong privacy warnings guide users to create non-identifiable IDs
- ✅ **Demo mode optimization** - Demo environments auto-select "Simple Analysis" pathway

## Next Steps

After setup, the PI Redactor will be fully integrated and ready for use. All document uploads will flow through the redactor, ensuring proper de-identification before AI analysis.
