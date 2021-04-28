const { User, Collection, Datalake, Upload, Category } = require('./models');
const config = require('@bedrockio/config');
const { storeUploadedFile } = require('./utils/uploads');
const { logger } = require('@bedrockio/instrumentation');
const { ensureCollectionIndex } = require('./lib/analytics');

const adminConfig = {
  name: config.get('ADMIN_NAME'),
  email: config.get('ADMIN_EMAIL'),
  password: config.get('ADMIN_PASSWORD'),
};

const createUpload = async (owner, image) => {
  const path = `${__dirname}/../fixtures/images/${image}`;
  const file = { path, name: image, type: 'image/jpeg' };
  const object = await storeUploadedFile(file);
  return Upload.create({
    ...object,
    ownerId: owner._id,
  });
};

const createFixtures = async () => {
  if (await User.findOne({ email: adminConfig.email })) {
    return false;
  }

  logger.info('Creating DB fixtures');

  ['streaming', 'edge', 'IOT', 'metrics'].forEach(async (name) => {
    await Category.create({
      name,
    });
  });

  const adminUser = await User.create({
    ...adminConfig,
    roles: [{ scope: 'global', role: 'superAdmin' }],
  });
  console.info(`Added admin user ${adminUser.email} to database`);

  const testCategory = await Category.create({
    name: 'test',
  });

  const datalake = await Datalake.create({
    name: 'Bar',
    description: 'Demo Datalake with purchases',
    images: [await createUpload(adminUser, 'Datalake.jpg')],
    categories: [testCategory],
  });

  const collection = await Collection.create({
    name: `Purchases`,
    description: 'POS system purchases',
    datalake,
  });
  await ensureCollectionIndex(collection.id);
  //const events = loadJsonStreamFile(__dirname + './routes/policy/__tests__/fixtures/bar-purchases.ndjson');

  const datalake2 = await Datalake.create({
    name: 'EVSE',
    description: 'Demo Datalake with controllers & metervalues',
    images: [await createUpload(adminUser, 'Datalake.jpg')],
    categories: [testCategory],
  });

  const collection2 = await Collection.create({
    name: `EVSE controllers`,
    description: 'MongoDB EVSE controller data',
    datalake: datalake2,
  });
  await ensureCollectionIndex(collection2.id);

  const collection3 = await Collection.create({
    name: `EVSE meter values`,
    description: 'MongoDB EVSE meter value event data',
    datalake: datalake2,
  });
  await ensureCollectionIndex(collection3.id);

  return true;
};

module.exports = {
  createFixtures,
};
