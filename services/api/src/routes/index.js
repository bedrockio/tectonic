const Router = require('@koa/router');
const auth = require('./auth');
const users = require('./users');
const collections = require('./collections');
const datalakes = require('./datalakes');
const uploads = require('./uploads');
const invites = require('./invites');
const categories = require('./categories');
const status = require('./status');
const events = require('./events');

const router = new Router();

router.use('/auth', auth.routes());
router.use('/users', users.routes());
router.use('/collections', collections.routes());
router.use('/datalakes', datalakes.routes());
router.use('/uploads', uploads.routes());
router.use('/invites', invites.routes());
router.use('/categories', categories.routes());
router.use('/status', status.routes());
router.use('/events', events.routes());

module.exports = router;
