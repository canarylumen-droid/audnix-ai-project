# Meta/Facebook App Submission Guide - Audnix AI

This document contains all the required information to complete your Meta Developer App submission.

## Required Fields for Meta App Settings

### Basic Information
| Field | Value |
|-------|-------|
| **Display Name** | Audnix |
| **Namespace** | audnix |
| **App Domains** | audnixai.com |
| **Contact Email** | leadaasrith@gmail.com |
| **Privacy Policy URL** | https://audnixai.com/privacy-policy |
| **Terms of Service URL** | https://audnixai.com/terms-of-service |
| **Category** | Business and Pages |
| **User Data Deletion** | Data deletion instructions URL |
| **Data Deletion URL** | https://audnixai.com/data-deletion |

### App Icon Requirements
- **Size**: 1024 x 1024 pixels
- **Format**: PNG or JPG
- **Note**: Use the app logo/icon from your branding assets

### Data Protection Officer (DPO) Contact Information

**For GDPR Compliance:**

| Field | Suggested Value |
|-------|-----------------|
| **Name** | Aasrith (Optional) |
| **Email** | privacy@audnixai.com or leadaasrith@gmail.com |

### Address Information

| Field | Value |
|-------|-------|
| **Street Address** | 251 18th Street |
| **Apt/Suite/Other** | 7th Floor |
| **City/District** | New York |
| **State/Province/Region** | NY |
| **ZIP/Postal Code** | 10011 |
| **Country** | United States |

**Note**: This address matches the one in your Privacy Policy. If you need to change it, update both the Privacy Policy page and this guide to keep them consistent.

---

## Publishing Your App

### What "Published State" Means

An app in **"Published" state** means:
1. The app is visible to all Facebook users (not just developers/testers)
2. Users can authorize and use your app
3. Required for production use of Instagram Basic Display API, Messenger API, etc.

### Requirements to Publish

To move your app from "Unpublished" to "Published":

1. **Complete App Settings**:
   - App icon (1024x1024)
   - Privacy policy URL
   - Terms of service URL
   - Category selection
   - Contact email
   - Data Protection Officer info (for EU)
   - Business address

2. **App Review** (if applicable):
   - For certain permissions (instagram_basic, pages_manage_posts, etc.)
   - Submit for review with use case descriptions
   - Provide screencasts/videos showing how you use the permissions

3. **Business Verification** (sometimes required):
   - Verify your business entity
   - May require documents

### Steps to Publish

1. Go to **Meta for Developers** > **Your Apps** > **Audnix**
2. Complete all fields in **App Settings** > **Basic**
3. Upload your 1024x1024 app icon
4. Fill in Privacy Policy and Terms of Service URLs
5. Select appropriate Category (Business and Pages)
6. Fill in Data Protection Officer information
7. Add your business address
8. Go to **Publish** in the left sidebar
9. Click **Make Public** or toggle the app to Live mode

---

## Data Deletion Endpoint

You'll need a data deletion endpoint. Here's what to add to your Privacy Policy page or create a separate data deletion page:

**URL**: https://audnixai.com/data-deletion

**Content**: Instructions on how users can request deletion of their data from your app.

---

## Checklist Before Submission

- [ ] App icon uploaded (1024x1024 PNG/JPG)
- [ ] Privacy Policy URL added and accessible
- [ ] Terms of Service URL added and accessible
- [ ] Contact email verified
- [ ] Category selected (Business and Pages)
- [ ] Data deletion method configured
- [ ] DPO contact information filled (for GDPR)
- [ ] Business address completed
- [ ] All required permissions have use case descriptions

---

## Notes

- Make sure your Privacy Policy and Terms of Service pages are publicly accessible (not behind login)
- The URLs must use HTTPS
- Keep your app icon simple and recognizable
- Your contact email should be a monitored inbox
