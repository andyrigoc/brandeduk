/**
 * Google Ads Script (paste into Tools > Bulk actions > Scripts).
 *
 * Points every landing page in the account to TARGET_URL:
 *   - ad final URLs / final mobile URLs (ads in non-removed campaigns/ad groups)
 *   - keyword-level final URLs (only where one is set)
 *   - asset final URLs (sitelinks, promotions, etc.) and price asset offerings
 *   - Performance Max asset group final URLs
 *   - final URL suffixes (account, campaign, ad group, ad, keyword, asset) that
 *     contain a full URL instead of query parameters; Google appends them after
 *     the landing page, producing URLs like /page{ignore}?https://brandeduk.com/contact
 *
 * Entities already pointing to TARGET_URL are left alone, so they do not go back
 * into review. Tracking templates, valid suffixes, bids, budgets, statuses and
 * targeting are never touched.
 *
 * Preview  = backup + dry run (logs the full backup JSON in BACKUP| chunks).
 * Run      = backup + apply, then re-queries and logs VERIFY results.
 */
var TARGET_URL = 'https://www.brandeduk.com/';
var CHUNK = 4000;

function main() {
  var backup = collect();
  logChunks('BACKUP', JSON.stringify(backup));
  Logger.log('SUMMARY ' + JSON.stringify(summarise(backup)));

  var ops = buildOperations(backup);
  Logger.log('PLANNED_OPERATIONS ' + ops.length + ' ' + JSON.stringify(countByType(ops)));
  ops.forEach(function (o) { Logger.log('OP ' + o.label + ' :: ' + JSON.stringify(o.operation)); });

  if (AdsApp.getExecutionInfo().isPreview()) {
    Logger.log('PREVIEW: no changes applied');
    return;
  }

  ops.forEach(function (o) {
    var result = AdsApp.mutate(o.operation);
    Logger.log('RESULT ' + (result.isSuccessful() ? 'OK ' + o.label
      : 'FAIL ' + o.label + ' :: ' + result.getErrorMessages().join(' | ')));
  });

  var after = collect();
  logChunks('VERIFY', JSON.stringify(after));
  Logger.log('VERIFY_REMAINING ' + JSON.stringify(remaining(after)));
}

function rows(query) {
  var out = [];
  var it = AdsApp.search(query);
  while (it.hasNext()) out.push(it.next());
  return out;
}

function safeRows(label, query) {
  try {
    return rows(query);
  } catch (e) {
    Logger.log('QUERY_ERROR ' + label + ' :: ' + e);
    return [];
  }
}

function collect() {
  var data = {
    target: TARGET_URL,
    customerId: AdsApp.currentAccount().getCustomerId(),
    accountName: AdsApp.currentAccount().getName(),
    takenAt: new Date().toISOString()
  };

  data.customer = safeRows('customer',
    'SELECT customer.resource_name, customer.id, customer.tracking_url_template, customer.final_url_suffix ' +
    'FROM customer');

  data.campaigns = safeRows('campaigns',
    'SELECT campaign.id, campaign.resource_name, campaign.name, campaign.status, ' +
    'campaign.advertising_channel_type, campaign.advertising_channel_sub_type, ' +
    'campaign.tracking_url_template, campaign.final_url_suffix, ' +
    'campaign.dynamic_search_ads_setting.domain_name, campaign.shopping_setting.merchant_id ' +
    'FROM campaign WHERE campaign.status != REMOVED');

  data.campaignUrlExpansion = safeRows('campaignUrlExpansion',
    'SELECT campaign.id, campaign.name, campaign.url_expansion_opt_out ' +
    'FROM campaign WHERE campaign.status != REMOVED');

  data.campaignAssetAutomation = safeRows('campaignAssetAutomation',
    'SELECT campaign.id, campaign.name, campaign.asset_automation_settings ' +
    'FROM campaign WHERE campaign.status != REMOVED');

  data.smartCampaigns = safeRows('smartCampaigns',
    'SELECT campaign.id, campaign.name, smart_campaign_setting.final_url ' +
    'FROM smart_campaign_setting WHERE campaign.status != REMOVED');

  data.adGroups = safeRows('adGroups',
    'SELECT campaign.id, campaign.name, ad_group.id, ad_group.resource_name, ad_group.name, ad_group.status, ' +
    'ad_group.tracking_url_template, ad_group.final_url_suffix ' +
    'FROM ad_group WHERE ad_group.status != REMOVED AND campaign.status != REMOVED');

  data.ads = safeRows('ads',
    'SELECT campaign.id, campaign.name, campaign.status, ad_group.id, ad_group.name, ad_group.status, ' +
    'ad_group_ad.status, ad_group_ad.ad.id, ad_group_ad.ad.resource_name, ad_group_ad.ad.type, ' +
    'ad_group_ad.ad.final_urls, ad_group_ad.ad.final_mobile_urls, ' +
    'ad_group_ad.ad.tracking_url_template, ad_group_ad.ad.final_url_suffix, ' +
    'ad_group_ad.policy_summary.approval_status, ad_group_ad.policy_summary.review_status ' +
    'FROM ad_group_ad WHERE ad_group_ad.status != REMOVED AND ad_group.status != REMOVED ' +
    'AND campaign.status != REMOVED');

  data.keywords = safeRows('keywords',
    'SELECT campaign.id, campaign.name, ad_group.id, ad_group.name, ad_group_criterion.resource_name, ' +
    'ad_group_criterion.criterion_id, ad_group_criterion.type, ad_group_criterion.status, ' +
    'ad_group_criterion.negative, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ' +
    'ad_group_criterion.final_urls, ad_group_criterion.final_mobile_urls, ' +
    'ad_group_criterion.tracking_url_template, ad_group_criterion.final_url_suffix ' +
    'FROM ad_group_criterion WHERE ad_group_criterion.status != REMOVED AND ad_group.status != REMOVED ' +
    'AND campaign.status != REMOVED');

  data.assets = safeRows('assets',
    'SELECT asset.resource_name, asset.id, asset.name, asset.type, asset.final_urls, ' +
    'asset.final_mobile_urls, asset.tracking_url_template, asset.final_url_suffix, ' +
    'asset.sitelink_asset.link_text, asset.promotion_asset.promotion_target, ' +
    'asset.price_asset.price_offerings FROM asset').filter(function (r) {
      var a = r.asset;
      return nonEmpty(a.finalUrls) || nonEmpty(a.finalMobileUrls) || a.finalUrlSuffix ||
        a.trackingUrlTemplate || (a.priceAsset && nonEmpty(a.priceAsset.priceOfferings));
    });

  data.customerAssets = safeRows('customerAssets',
    'SELECT customer_asset.asset, customer_asset.field_type, customer_asset.status FROM customer_asset ' +
    'WHERE customer_asset.status != REMOVED');

  data.campaignAssets = safeRows('campaignAssets',
    'SELECT campaign.id, campaign.name, campaign_asset.asset, campaign_asset.field_type, campaign_asset.status ' +
    'FROM campaign_asset WHERE campaign_asset.status != REMOVED AND campaign.status != REMOVED');

  data.adGroupAssets = safeRows('adGroupAssets',
    'SELECT campaign.id, campaign.name, ad_group.id, ad_group.name, ad_group_asset.asset, ' +
    'ad_group_asset.field_type, ad_group_asset.status FROM ad_group_asset ' +
    'WHERE ad_group_asset.status != REMOVED AND ad_group.status != REMOVED AND campaign.status != REMOVED');

  data.assetGroups = safeRows('assetGroups',
    'SELECT campaign.id, campaign.name, asset_group.resource_name, asset_group.id, asset_group.name, ' +
    'asset_group.status, asset_group.final_urls, asset_group.final_mobile_urls ' +
    'FROM asset_group WHERE asset_group.status != REMOVED AND campaign.status != REMOVED');

  return data;
}

function nonEmpty(list) {
  return list && list.length > 0;
}

function allTarget(list) {
  return nonEmpty(list) && list.every(function (u) { return u === TARGET_URL; });
}

function needsUpdate(finalUrls, mobileUrls) {
  return (nonEmpty(finalUrls) && !allTarget(finalUrls)) ||
    (nonEmpty(mobileUrls) && !allTarget(mobileUrls));
}

function badSuffix(suffix) {
  return !!suffix && suffix.indexOf('://') !== -1;
}

function urlUpdate(resourceName, entity) {
  var update = { resourceName: resourceName };
  var mask = [];
  if (needsUpdate(entity.finalUrls, entity.finalMobileUrls)) {
    update.finalUrls = [TARGET_URL];
    mask.push('final_urls');
    if (nonEmpty(entity.finalMobileUrls)) {
      update.finalMobileUrls = [TARGET_URL];
      mask.push('final_mobile_urls');
    }
  }
  if (badSuffix(entity.finalUrlSuffix)) {
    update.finalUrlSuffix = '';
    mask.push('final_url_suffix');
  }
  return mask.length ? { update: update, updateMask: mask.join(',') } : null;
}

function describe(entity) {
  var parts = [];
  if (needsUpdate(entity.finalUrls, entity.finalMobileUrls)) {
    parts.push((entity.finalUrls || []).concat(entity.finalMobileUrls || []).join(' ') + ' -> ' + TARGET_URL);
  }
  if (badSuffix(entity.finalUrlSuffix)) parts.push('suffix "' + entity.finalUrlSuffix + '" -> ""');
  return parts.join('; ');
}

function addOp(ops, type, operationKey, where, entity, resourceName) {
  var op = urlUpdate(resourceName, entity);
  if (!op) return;
  var operation = {};
  operation[operationKey] = op;
  ops.push({ type: type, label: type + ' | ' + where + ' | ' + describe(entity), operation: operation });
}

function countByType(ops) {
  var counts = {};
  ops.forEach(function (o) { counts[o.type] = (counts[o.type] || 0) + 1; });
  return counts;
}

function linkedAssetNames(data) {
  var names = {};
  data.customerAssets.forEach(function (r) { names[r.customerAsset.asset] = true; });
  data.campaignAssets.forEach(function (r) { names[r.campaignAsset.asset] = true; });
  data.adGroupAssets.forEach(function (r) { names[r.adGroupAsset.asset] = true; });
  return names;
}

function buildOperations(data) {
  var ops = [];

  data.customer.forEach(function (r) {
    addOp(ops, 'account', 'customerOperation', r.customer.id, { finalUrlSuffix: r.customer.finalUrlSuffix },
      r.customer.resourceName);
  });

  data.campaigns.forEach(function (r) {
    addOp(ops, 'campaign', 'campaignOperation', r.campaign.name, { finalUrlSuffix: r.campaign.finalUrlSuffix },
      r.campaign.resourceName);
  });

  data.adGroups.forEach(function (r) {
    addOp(ops, 'adGroup', 'adGroupOperation', r.campaign.name + ' > ' + r.adGroup.name,
      { finalUrlSuffix: r.adGroup.finalUrlSuffix }, r.adGroup.resourceName);
  });

  data.ads.forEach(function (r) {
    var ad = r.adGroupAd.ad;
    addOp(ops, 'ad', 'adOperation', r.campaign.name + ' > ' + r.adGroup.name + ' > ' + ad.type + ' ' + ad.id,
      ad, ad.resourceName);
  });

  data.keywords.forEach(function (r) {
    var c = r.adGroupCriterion;
    addOp(ops, 'keyword', 'adGroupCriterionOperation', r.campaign.name + ' > ' + r.adGroup.name + ' > ' +
      ((c.keyword && c.keyword.text) || c.type + ' ' + c.criterionId), c, c.resourceName);
  });

  var linked = linkedAssetNames(data);
  data.assets.forEach(function (r) {
    var a = r.asset;
    if (!linked[a.resourceName]) return;
    addOp(ops, 'asset', 'assetOperation',
      a.type + ' ' + ((a.sitelinkAsset && a.sitelinkAsset.linkText) || a.name || a.id), a, a.resourceName);
    var offerings = a.priceAsset && a.priceAsset.priceOfferings;
    if (nonEmpty(offerings) && offerings.some(function (o) {
      return o.finalUrl !== TARGET_URL || (o.finalMobileUrl && o.finalMobileUrl !== TARGET_URL);
    })) {
      var updated = offerings.map(function (o) {
        var copy = JSON.parse(JSON.stringify(o));
        copy.finalUrl = TARGET_URL;
        if (copy.finalMobileUrl) copy.finalMobileUrl = TARGET_URL;
        return copy;
      });
      ops.push({
        type: 'priceOfferings',
        label: 'priceOfferings | ' + (a.name || a.id) + ' | ' + offerings.length + ' offerings -> ' + TARGET_URL,
        operation: { assetOperation: {
          update: { resourceName: a.resourceName, priceAsset: { priceOfferings: updated } },
          updateMask: 'price_asset.price_offerings'
        } }
      });
    }
  });

  data.assetGroups.forEach(function (r) {
    var g = r.assetGroup;
    addOp(ops, 'assetGroup', 'assetGroupOperation', r.campaign.name + ' > ' + g.name, g, g.resourceName);
  });

  return ops;
}

function summarise(data) {
  var linked = linkedAssetNames(data);
  return {
    campaigns: data.campaigns.length,
    ads: data.ads.length,
    adsWithUrls: data.ads.filter(function (r) { return nonEmpty(r.adGroupAd.ad.finalUrls); }).length,
    keywords: data.keywords.length,
    keywordsWithUrls: data.keywords.filter(function (r) { return nonEmpty(r.adGroupCriterion.finalUrls); }).length,
    assets: data.assets.length,
    linkedAssetsWithUrls: data.assets.filter(function (r) {
      return linked[r.asset.resourceName] && nonEmpty(r.asset.finalUrls);
    }).length,
    assetGroups: data.assetGroups.length
  };
}

function remaining(data) {
  return buildOperations(data).map(function (o) { return o.label; });
}

function logChunks(prefix, text) {
  var total = Math.ceil(text.length / CHUNK);
  for (var i = 0; i < total; i++) {
    Logger.log(prefix + '|' + (i + 1) + '/' + total + '|' + text.substr(i * CHUNK, CHUNK));
  }
}
