// Vercel Serverless Function for Logo Upload
// This handles logo uploads in production (Vercel)

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { logo, position, filename } = req.body;
        
        if (!logo || !position) {
            return res.status(400).json({ error: 'Logo and position required' });
        }

        // Extract base64 data
        const matches = logo.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!matches) {
            return res.status(400).json({ error: 'Invalid image data' });
        }

        const ext = matches[1];
        const imageData = matches[2];
        
        // For Vercel, we can use the public folder
        // Note: Vercel's serverless functions can't write to the file system directly
        // So we'll return the data URL and let the frontend handle it
        // OR use Vercel Blob Storage (recommended for production)
        
        // For now, return a reference URL
        // In production, you should:
        // 1. Use Vercel Blob Storage (@vercel/blob)
        // 2. Or upload to a cloud storage service (AWS S3, DigitalOcean Spaces, etc.)
        
        const timestamp = Date.now();
        const finalFilename = filename || `logo-${position}-${timestamp}.${ext}`;
        
        // Return the data URL for now
        // TODO: Implement actual file storage with Vercel Blob or cloud storage
        const logoUrl = logo; // Keep as data URL until storage is implemented
        
        return res.status(200).json({ 
            success: true, 
            url: logoUrl,
            filename: finalFilename,
            message: 'Logo processed (using data URL - implement storage for production)'
        });
        
    } catch (error) {
        console.error('Error in upload-logo:', error);
        return res.status(500).json({ 
            error: 'Failed to process logo',
            message: error.message 
        });
    }
}

