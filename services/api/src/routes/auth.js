const Router = require('@koa/router');
const Joi = require('@hapi/joi');
const validate = require('../utils/middleware/validate');
const tokens = require('../utils/tokens');
const { UnauthorizedError } = require('../utils/errors');
const { User } = require('../models');

const router = new Router();

router.post(
  '/login',
  validate({
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  }),
  async (ctx) => {
    const { email, password } = ctx.request.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw new UnauthorizedError('email password combination does not match');
    }
    const isSame = await user.verifyPassword(password);
    if (!isSame) {
      throw new UnauthorizedError('email password combination does not match');
    }
    ctx.body = { data: { token: tokens.createUserToken(user) } };
  }
);

module.exports = router;
