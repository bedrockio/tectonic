const jwt = require('jsonwebtoken');
const { setupDb, teardownDb, request, createUser } = require('../../utils/testing');

beforeAll(async () => {
  await setupDb();
});

afterAll(async () => {
  await teardownDb();
});

describe('/1/auth', () => {
  describe('POST login', () => {
    it('should log in a user in', async () => {
      const password = '123password!';
      const user = await createUser({
        password,
      });
      const response = await request('POST', '/1/auth/login', { email: user.email, password });
      expect(response.status).toBe(200);

      const { payload } = jwt.decode(response.body.data.token, { complete: true });
      expect(payload).toHaveProperty('kid', 'user');
      expect(payload).toHaveProperty('type', 'user');
    });
  });
});
