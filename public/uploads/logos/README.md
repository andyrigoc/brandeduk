# Logo Uploads Folder

This folder stores uploaded logos from the quote customization process.

## How It Works

1. **Localhost/Development:**
   - Logos are stored as base64 data URLs in localStorage
   - No actual files are saved (works immediately)

2. **Production (Vercel):**
   - Logos are processed through `/api/upload-logo` serverless function
   - Currently returns data URLs (implement cloud storage for production)

## Future Implementation

For production, you should implement one of these:

1. **Vercel Blob Storage** (Recommended)
   ```bash
   npm install @vercel/blob
   ```

2. **DigitalOcean Spaces** (S3-compatible)
   - Use AWS SDK with Spaces endpoint

3. **Cloudinary** or **ImageKit**
   - Image optimization and CDN

## File Structure

- `logo-{position}-{timestamp}-{randomId}.{ext}`
- Example: `logo-left-breast-1704902400000-abc123.png`

## Access

Logos are accessible via:
- Localhost: Data URLs (embedded in HTML)
- Production: URLs from cloud storage service

