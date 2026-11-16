/**
 * POST /api/prechat-upload — sign a private artwork upload after verifying the
 * existing customer session. File bytes go directly to Spaces (10 MB maximum).
 * Reuses DO_SPACES_KEY/SECRET/REGION/BUCKET; never uses public-read ACLs.
 */
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID, createHash } from 'node:crypto';

const MAX_BYTES = 10 * 1024 * 1024;
const TYPES = {png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',pdf:'application/pdf',ai:'application/postscript',eps:'application/postscript',svg:'image/svg+xml'};
const ORIGINS = new Set(['https://brandeduk.com','https://www.brandeduk.com']);

export function validateArtwork(body) {
    const name = String(body?.name || '').replace(/[\x00-\x1f\x7f/\\]/g, '_').slice(0,180);
    const ext = name.split('.').pop().toLowerCase();
    if (!name || !Object.hasOwn(TYPES,ext)) throw new Error('Please select PNG, JPG, PDF, AI, EPS or SVG.');
    if (!Number.isInteger(body.size) || body.size < 1 || body.size > MAX_BYTES) throw new Error('Maximum artwork size: 10 MB.');
    return {name,ext,type:TYPES[ext],size:body.size};
}

export default async function handler(req,res) {
    res.setHeader('Cache-Control','no-store');
    if (req.method !== 'POST') {res.setHeader('Allow','POST');return res.status(405).json({success:false,error:'Method not allowed.'});}
    if (req.headers.origin && !ORIGINS.has(req.headers.origin)) return res.status(403).json({success:false,error:'Origin not allowed.'});
    const authorization = req.headers.authorization || '';
    if (!/^Bearer [^\s]+$/.test(authorization)) return res.status(401).json({success:false,error:'Sign in before uploading your logo.'});
    let artwork;
    try {artwork=validateArtwork(typeof req.body==='string'?JSON.parse(req.body):req.body);} catch(error) {return res.status(400).json({success:false,error:error.message});}
    try {
        const auth = await fetch('https://api.brandeduk.com/api/auth/me',{
            headers:{Authorization:authorization,Origin:'https://www.brandeduk.com'},
            signal:AbortSignal.timeout(8000)
        });
        if (!auth.ok) return res.status(401).json({success:false,error:'Your session has expired. Please sign in again.'});
        const json = await auth.json();
        const user = json.user || json.data?.user || json.data || json;
        if (json.success===false || !user.email) return res.status(401).json({success:false,error:'Please sign in again.'});
        if (!process.env.DO_SPACES_KEY || !process.env.DO_SPACES_SECRET) return res.status(503).json({success:false,error:'Artwork upload is unavailable. Go Back to send your logo later.'});
        const region = process.env.DO_SPACES_REGION || 'lon1';
        const bucket = process.env.DO_SPACES_BUCKET || 'brandeduk';
        const s3 = new S3Client({endpoint:`https://${region}.digitaloceanspaces.com`,region,
            credentials:{accessKeyId:process.env.DO_SPACES_KEY,secretAccessKey:process.env.DO_SPACES_SECRET}});
        const owner = createHash('sha256').update(String(user.email).toLowerCase()).digest('hex').slice(0,24);
        const key = `prechat/${owner}/${randomUUID()}.${artwork.ext}`;
        const disposition = `attachment; filename="artwork.${artwork.ext}"; filename*=UTF-8''${encodeURIComponent(artwork.name).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16))}`;
        const upload = await createPresignedPost(s3,{
            Bucket:bucket,Key:key,Expires:300,
            Fields:{'Content-Type':artwork.type,'Content-Disposition':disposition,acl:'private',success_action_status:'204'},
            Conditions:[['content-length-range',artwork.size,artwork.size],
                ['eq','$Content-Type',artwork.type],['eq','$acl','private'],
                ['eq','$Content-Disposition',disposition],['eq','$success_action_status','204']]
        });
        const url = await getSignedUrl(s3,new GetObjectCommand({Bucket:bucket,Key:key,ResponseContentDisposition:disposition}),{expiresIn:604800});
        return res.status(200).json({success:true,upload,url,expiresAt:Date.now()+604800000});
    } catch(error) {
        // Do not log credentials, customer metadata or signed URLs.
        console.error('Prechat upload signing failed:',error.name);
        return res.status(503).json({success:false,error:'Artwork upload is unavailable. Try again, or go Back to send your logo later.'});
    }
}
