'use strict';

const {
    RULESET_VERSION,
    STATUSES,
    DECORATION_METHODS,
    GLOBAL_CAPABILITIES,
    PRODUCT_CAPABILITIES,
    POSITION_CAPABILITIES,
    FALLBACK_PRIORITY,
    SKU_OVERRIDES,
} = require('./capability-rules');

const STATUS_WEIGHT = Object.freeze({
    [STATUSES.AVAILABLE]: 0,
    [STATUSES.POA]: 1,
    [STATUSES.UNAVAILABLE]: 2,
    [STATUSES.HIDDEN]: 3,
});

function normalizeKey(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

function normalizeMethod(value) {
    const method = normalizeKey(value);
    if (method === 'screen' || method === 'screenprinting') return 'screen_print';
    if (method === 'dtf_print') return 'dtf';
    return method;
}

function getMostRestrictiveStatus(...statuses) {
    const validStatuses = statuses.filter((status) => Object.hasOwn(STATUS_WEIGHT, status));
    if (validStatuses.length === 0) return STATUSES.POA;
    return validStatuses.reduce((current, status) => (
        STATUS_WEIGHT[status] > STATUS_WEIGHT[current] ? status : current
    ), STATUSES.AVAILABLE);
}

function getSkuOverride(sku, position, method, overrides) {
    if (!sku) return undefined;
    const override = overrides[String(sku).trim().toUpperCase()];
    return override?.positions?.[position]?.[method]
        || override?.methods?.[method]
        || override?.status;
}

function statusMessage(status) {
    if (status === STATUSES.AVAILABLE) return 'This decoration method is available for online purchase.';
    if (status === STATUSES.POA) return 'This option may be available depending on the garment, artwork and quantity. Please contact us for confirmation.';
    if (status === STATUSES.UNAVAILABLE) return 'This decoration method is not available for the selected product and position.';
    return 'This decoration method is not shown for the selected product and position.';
}

function statusBehaviour(status) {
    return {
        buttonEnabled: status === STATUSES.AVAILABLE || status === STATUSES.POA,
        allowAddToBasket: status === STATUSES.AVAILABLE,
        requiresApproval: status === STATUSES.POA,
        visible: status !== STATUSES.HIDDEN,
    };
}

function resolveDecorationStatus(input, options = {}) {
    const productType = normalizeKey(input?.productType);
    const position = normalizeKey(input?.position);
    const method = normalizeMethod(input?.method);
    const sku = String(input?.sku || '').trim().toUpperCase();

    if (!Object.hasOwn(DECORATION_METHODS, method)) {
        const error = new Error(`Unknown decoration method: ${method || '(empty)'}`);
        error.code = 'INVALID_METHOD';
        throw error;
    }

    const productStatus = PRODUCT_CAPABILITIES[productType]?.[method] || STATUSES.POA;
    const positionStatus = POSITION_CAPABILITIES[position]?.[method] || STATUSES.POA;
    const globalStatus = GLOBAL_CAPABILITIES[method];
    const skuStatus = getSkuOverride(sku, position, method, options.skuOverrides || SKU_OVERRIDES);
    const evaluatedStatuses = Array.isArray(options.evaluatedStatuses)
        ? options.evaluatedStatuses
        : [];
    const status = getMostRestrictiveStatus(
        globalStatus,
        productStatus,
        positionStatus,
        ...evaluatedStatuses,
        skuStatus
    );

    return {
        rulesetVersion: RULESET_VERSION,
        productType,
        position,
        sku,
        method,
        methodLabel: DECORATION_METHODS[method].label,
        status,
        ...statusBehaviour(status),
        message: statusMessage(status),
        sources: {
            global: globalStatus || null,
            product: productStatus || null,
            position: positionStatus || null,
            evaluated: evaluatedStatuses,
            skuOverride: skuStatus || null,
        },
    };
}

function resolveAllDecorationMethods(input, options = {}) {
    const methods = Object.keys(DECORATION_METHODS).map((method) => (
        resolveDecorationStatus({ ...input, method }, options)
    ));
    const byMethod = Object.fromEntries(methods.map((result) => [result.method, result]));

    methods.forEach((result) => {
        result.alternatives = (FALLBACK_PRIORITY[result.method] || [])
            .map((method) => byMethod[method])
            .filter((alternative) => alternative.status === STATUSES.AVAILABLE)
            .map((alternative) => ({
                method: alternative.method,
                label: alternative.methodLabel,
                status: alternative.status,
            }));
    });

    return {
        rulesetVersion: RULESET_VERSION,
        productType: normalizeKey(input?.productType),
        position: normalizeKey(input?.position),
        sku: String(input?.sku || '').trim().toUpperCase(),
        methods: byMethod,
    };
}

module.exports = {
    normalizeKey,
    normalizeMethod,
    getMostRestrictiveStatus,
    resolveDecorationStatus,
    resolveAllDecorationMethods,
};
