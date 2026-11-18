import { next, rewrite } from '@vercel/functions';

// One public homepage: / stays / . home-pc.html and index-mobile.html are internal.
// Alias 301s live in vercel.json and must not run against this rewrite (matcher is only / and /product).
export const config = {
    matcher: ['/', '/product/:path*'],
};

function isPhoneUa(userAgent) {
    var ua = String(userAgent || '').toLowerCase();
    var isIPad = ua.indexOf('ipad') !== -1;
    var isIPhone = ua.indexOf('iphone') !== -1 || ua.indexOf('ipod') !== -1;
    var isAndroid = ua.indexOf('android') !== -1;
    var isAndroidTablet = isAndroid && ua.indexOf('mobile') === -1;
    var isTablet = isIPad || isAndroidTablet || ua.indexOf('tablet') !== -1 || ua.indexOf('silk') !== -1;
    if (isTablet) return false;
    if (isIPhone) return true;
    if (isAndroid && ua.indexOf('mobile') !== -1) return true;
    return false;
}

function wantsMobile(request) {
    var url = new URL(request.url);
    var force = (url.searchParams.get('force') || '').toLowerCase();
    var phone = isPhoneUa(request.headers.get('user-agent'));
    if (phone) return true;
    if (force === 'mobile') return true;
    return false;
}

export default function middleware(request) {
    var url = new URL(request.url);
    var parts = url.pathname.split('/').filter(Boolean);
    var mobile = wantsMobile(request);
    var target = new URL(request.url);

    if (parts[0] === 'product' && parts.length === 2 && parts[1]) {
        target.pathname = mobile ? '/mobile/customize-mobile' : '/shop-pc';
        return rewrite(target);
    }

    if (url.pathname === '/' || url.pathname === '') {
        target.pathname = mobile ? '/index-mobile' : '/home-pc';
        return rewrite(target);
    }

    return next();
}
