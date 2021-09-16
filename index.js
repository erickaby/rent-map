require('dotenv').config();
const axios = require('axios').default;
const moment = require('moment');

console.log(`⚡️ Starting Rent Map`);
console.log(`API KEY: ${process.env.DOMAIN_API_KEY}`);

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'rent-listings.csv',
  header: [
    { id: 'address', title: 'Address' },
    { id: 'price', title: 'Price' },
    { id: 'url', title: 'Url' },
    { id: 'latitude', title: 'Lat' },
    { id: 'longitude', title: 'Lng' },
  ],
});

const instance = axios.create({
  baseURL: 'https://api.domain.com.au/',
  timeout: 1000,
  headers: { 'X-API-Key': process.env.DOMAIN_API_KEY },
});

const params = {
  pageNumber: 1,
  pageSize: 100,
  listingType: 'Rent',
  propertyTypes: ['House'],
  minBedrooms: 2,
  minBathrooms: 1,
  minCarspaces: 1,
  minPrice: 400,
  maxPrice: 600,
  listedSince: moment().subtract(12, 'hours').format(),
  locations: [
    {
      state: 'SA',
      region: '',
      area: '',
      suburb: '',
      postCode: '',
      includeSurroundingSuburbs: false,
    },
  ],
};

const pages = [...Array(10)].map((_, i) =>
  instance.post('/v1/listings/residential/_search', {
    ...params,
    pageNumber: i + 1,
  })
);

Promise.all(pages)
  .then(function (response) {
    console.log(response);

    const data = response.flatMap((v) => v.data.map(convertCSV));

    csvWriter
      .writeRecords(data)
      .then(() => console.log('The CSV file was written successfully'));
  })
  .catch(function (error) {
    console.log(error.data);
  })
  .then(function () {
    console.log(`Finished`);
  });

const convertCSV = (propertyListing) => {
  return {
    address: propertyListing.listing.propertyDetails.displayableAddress,
    price: propertyListing.listing.priceDetails.displayPrice,
    url: `https://www.domain.com.au/${propertyListing.listing.listingSlug}`,
    latitude: propertyListing.listing.propertyDetails.latitude,
    longitude: propertyListing.listing.propertyDetails.longitude,
  };
};
