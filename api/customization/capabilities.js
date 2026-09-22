'use strict';

const {
    resolveDecorationStatus,
    resolveAllDecorationMethods,
} = require('../../server/customization/resolve-decoration-status');

function requestInput(req) {
    if (req.method === 'GET') return req.query || {};
    return req.body && typeof req.body === 'object' ? req.body : {};
}

module.exports = function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const input = requestInput(req);
    if (!input.productType || !input.position) {
        return res.status(400).json({
            message: 'productType and position are required',
        });
    }

    try {
        const data = input.method
            ? resolveDecorationStatus(input)
            : resolveAllDecorationMethods(input);
        return res.status(200).json(data);
    } catch (error) {
        if (error.code === 'INVALID_METHOD') {
            return res.status(400).json({ message: error.message });
        }
        console.error('[customization-capabilities]', error);
        return res.status(500).json({ message: 'Unable to resolve decoration capabilities' });
    }
};
