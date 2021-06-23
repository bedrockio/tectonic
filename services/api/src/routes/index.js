const Router = require('@koa/router');
const auth = require('./auth');
const users = require('./users');
const collections = require('./collections');
const status = require('./status');
const events = require('./events');
const batches = require('./batches');
const accessPolicies = require('./access-policies');
const accessCredentials = require('./access-credentials');
const applicationCredentials = require('./application-credentials');
const analytics = require('./analytics');

const router = new Router();

router.use('/auth', auth.routes());
router.use('/users', users.routes());
router.use('/collections', collections.routes());
router.use('/status', status.routes());
router.use('/events', events.routes());
router.use('/batches', batches.routes());
router.use('/access-policies', accessPolicies.routes());
router.use('/access-credentials', accessCredentials.routes());
router.use('/application-credentials', applicationCredentials.routes());
router.use('/analytics', analytics.routes());

module.exports = router;
