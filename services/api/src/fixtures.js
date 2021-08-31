const { User, Collection, AccessPolicy, AccessCredential, ApplicationCredential } = require('./models');
const config = require('@bedrockio/config');
const { logger } = require('@bedrockio/instrumentation');
const { ensureCollectionIndex } = require('./lib/analytics');

const adminConfig = {
  name: config.get('ADMIN_NAME'),
  email: config.get('ADMIN_EMAIL'),
  password: config.get('ADMIN_PASSWORD'),
};

const createFixtures = async () => {
  if (await User.findOne({ email: adminConfig.email })) {
    return false;
  }

  logger.info('Creating DB fixtures');

  const adminUser = await User.create({
    ...adminConfig,
    roles: [{ scope: 'global', role: 'superAdmin' }],
  });
  logger.info(`Added admin user ${adminUser.email} to database`);

  const collection = await Collection.create({
    name: `bar-purchases`,
    description: "Example data from a cocktail bar's point-of-sale system",
    timeField: 'orderedAt',
  });

  await ensureCollectionIndex(collection);
  //const events = loadJsonStreamFile(__dirname + './routes/policy/__tests__/fixtures/bar-purchases.ndjson');

  const accessPolicy = await AccessPolicy.create({
    name: 'bar-purchases-collection-access',
    collections: [{ collectionName: collection.name }],
  });

  const accessCredential = await AccessCredential.create({
    name: 'bar-purchases-full-access',
    accessPolicy,
  });
  logger.info(`Created accessCredential ${accessCredential.id}`);

  const applicationCredential = await ApplicationCredential.create({
    name: 'default-application',
  });
  logger.info(`Created applicationCredential ${applicationCredential.id}`);

  return true;
};

module.exports = {
  createFixtures,
};
