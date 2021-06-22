const { User, Collection, Category, AccessPolicy, AccessCredential, ApplicationCredential } = require('./models');
const config = require('@bedrockio/config');
const { logger } = require('@bedrockio/instrumentation');
const { ensureCollectionIndex, ensureAlias, getCollectionIndex } = require('./lib/analytics');
// const { createPolicyToken } = require('./lib/tokens');

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
  });

  await ensureCollectionIndex(collection.id);
  await ensureAlias(getCollectionIndex(collection.id), collection.name);
  //const events = loadJsonStreamFile(__dirname + './routes/policy/__tests__/fixtures/bar-purchases.ndjson');

  const accessPolicy = await AccessPolicy.create({
    name: 'bar-purchases-collection-access',
    collections: [{ collectionId: collection.id }],
  });

  const accessCredential = await AccessCredential.create({
    name: 'bar-purchases-full-access',
    accessPolicy,
  });
  console.info(`Created accessCredential ${accessCredential.id}`);

  const applicationCredential = await ApplicationCredential.create({
    name: 'default-application',
  });
  console.info(`Created applicationCredential ${applicationCredential.id}`);

  // const evseCategory = await Category.create({ name: 'evse' });

  // const collection2 = await Collection.create({
  //   name: `evse-controllers`,
  //   description: 'MongoDB EVSE controller data',
  //   categories: [demoCategory, evseCategory],
  // });

  // await ensureCollectionIndex(collection2.id);
  // await ensureAlias(getCollectionIndex(collection2.id), collection2.name);

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
  // // logger.info(`Policy token: ${createPolicyToken(policy2)}`);

  // const collection3 = await Collection.create({
  //   name: `evse-metervalues`,
  //   description: 'MongoDB EVSE meter value event data',
  //   categories: [demoCategory, evseCategory],
  // });

  // await ensureCollectionIndex(collection3.id);
  // await ensureAlias(getCollectionIndex(collection3.id), collection3.name);

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
  // // logger.info(`Policy token: ${createPolicyToken(policy3)}`);

  return true;
};

module.exports = {
  createFixtures,
};
