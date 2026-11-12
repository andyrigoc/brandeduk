/**
 * Bundle shape. The builder reads this object, then loads any productCode
 * from the catalogue. Do not put colour lists, size lists, or prices here
 * for catalogue lines — those come from the product response.
 */
(function (window) {
  'use strict';

  var COLOURS = [
    { colourId: 'navy', label: 'Navy', hex: '#273469' },
    { colourId: 'black', label: 'Black', hex: '#1a1a1a' },
    { colourId: 'white', label: 'White', hex: '#f7f7f7' },
    { colourId: 'grey', label: 'Grey', hex: '#8d93a0' }
  ];

  var TOP_SIZES = ['S', 'M', 'L', 'XL', '2XL'];

  window.BrandedBundleConfig = {
    source: 'local-preview',
    bundles: [
      {
        bundleId: 'logistics',
        bundleName: 'Logistics',
        bundleSlug: 'logistics',
        bundleDescription: 'Move with confidence. Built for every delivery.',
        banner: '/brandedukv15-child/assets/images/bundles/logistics-banner.jpg',
        bundlePrice: null,
        currency: 'GBP',
        vatExcluded: true,
        includedLogo: true,
        logoUploadEnabled: true,
        customerNotesEnabled: true,
        activeStatus: true,
        hideFromList: true,
        logoMethod: 'dtf',
        printColourCount: 1,
        groups: [
          {
            groupId: 'pieces',
            groupName: 'Pieces',
            selectionMode: 'FIXED',
            requiredQuantity: 4,
            allowMixedOptions: false,
            allowMultipleColours: true,
            options: [
              { optionId: 'rg478', productCode: 'RG478', quantity: 1, preferredColour: 'Black/Yellow' },
              { optionId: 'rg465', productCode: 'RG465', quantity: 1 },
              { optionId: 'ss224', productCode: 'SS224', quantity: 1, preferredColour: 'Navy' },
              { optionId: 'uc905', productCode: 'UC905', quantity: 1 }
            ]
          }
        ]
      },
      {
        bundleId: 'preview-workwear-bundle',
        bundleName: 'Preview Workwear Bundle',
        bundleSlug: 'preview-workwear-bundle',
        bundleDescription: 'Local preview so the bundle windows can be clicked through. This is not a live deal.',
        bundlePrice: null,
        currency: 'GBP',
        vatExcluded: true,
        includedLogo: true,
        logoUploadEnabled: true,
        customerNotesEnabled: true,
        activeStatus: true,
        logoMethod: 'dtf',
        printColourCount: 1,
        groups: [
          {
            groupId: 'garments',
            groupName: 'Garments',
            selectionMode: 'FIXED',
            requiredQuantity: 8,
            allowMixedOptions: false,
            allowMultipleColours: true,
            options: [
              { optionId: 'tee', label: 'T-shirts', quantity: 2, silhouette: 'tee', colours: COLOURS, sizes: TOP_SIZES },
              { optionId: 'polo', label: 'Polos', quantity: 3, silhouette: 'polo', colours: COLOURS, sizes: TOP_SIZES },
              { optionId: 'hoodie', label: 'Hoodies', quantity: 1, silhouette: 'hoodie', colours: COLOURS, sizes: TOP_SIZES },
              { optionId: 'sweat', label: 'Sweatshirts', quantity: 1, silhouette: 'sweat', colours: COLOURS, sizes: TOP_SIZES },
              { optionId: 'jacket', label: 'Jackets', quantity: 1, silhouette: 'jacket', colours: COLOURS, sizes: TOP_SIZES }
            ]
          },
          {
            groupId: 'headwear',
            groupName: 'Headwear',
            selectionMode: 'EXCLUSIVE',
            requiredQuantity: 6,
            allowMixedOptions: false,
            allowMultipleColours: true,
            options: [
              { optionId: 'caps', label: 'Caps', silhouette: 'cap', colours: COLOURS, sizes: ['One size'] },
              { optionId: 'beanies', label: 'Beanies', silhouette: 'beanie', colours: COLOURS, sizes: ['One size'] }
            ]
          }
        ]
      }
    ]
  };
})(window);
