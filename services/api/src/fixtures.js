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
    collections: [{ collectionId: collection.id }],
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

  // const collection2 = await Collection.create({
  //   name: `evse-controllers`,
  //   description: 'MongoDB EVSE controller data',
  // });

  // await ensureCollectionIndex(collection2);

  // // const policy2 = await Policy.create({
  // //   name: 'Access for Maintenance Account 5f15901ef8909f9ea57425b9',
  // //   collections: [
  // //     {
  // //       collectionId: collection2.id,
  // //       scope: {
  // //         maintenanceAccountId: '5f15901ef8909f9ea57425b9',
  // //       },
  // //     },
  // //   ],
  // // });
  // // logger.info(`Created policy: '${policy2.name}'`);

  // const collection3 = await Collection.create({
  //   name: `evse-metervalues`,
  //   description: 'MongoDB EVSE meter value event data',
  // });

  // await ensureCollectionIndex(collection3);

  // // const policy3 = await Policy.create({
  // //   name: 'MeterValues for EVSE Controller 5fd6036fccd06f4d6b1d8bd2',
  // //   collections: [
  // //     {
  // //       collectionId: collection3.id,
  // //       scope: {
  // //         evseControllerId: '5fd6036fccd06f4d6b1d8bd2',
  // //         method: 'MeterValues',
  // //       },
  // //     },
  // //   ],
  // // });
  // // logger.info(`Created policy: '${policy3.name}'`);

  return true;
};

module.exports = {
  createFixtures,
};
