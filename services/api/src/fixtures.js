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

  const datalake = await Datalake.create({
    name: 'Demo',
    images: [await createUpload(adminUser, 'Datalake.jpg')],
  });

  for (let i = 0; i < 1; i++) {
    let collection = await Collection.create({
      name: `Collection ${i + 1}`,
      datalake,
      images: [await createUpload(adminUser, `Collection ${i + 1}.jpg`)],
    });
    await ensureCollectionIndex(collection.id);
  }
  return true;
};

module.exports = {
  createFixtures,
};
