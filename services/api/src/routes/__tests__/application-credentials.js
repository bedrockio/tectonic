const { setupDb, teardownDb, request, createUser } = require('../../utils/testing');
const { ApplicationCredential } = require('../../models');

beforeAll(async () => {
  await setupDb();
});

afterAll(async () => {
  await teardownDb();
});

describe('/1/application-credentials', () => {
  describe('POST /', () => {
    it('should be able to create application-credential', async () => {
      await ApplicationCredential.deleteMany({});
      const user = await createUser();
      const name = 'application-credential-test';

      const response = await request('POST', '/1/application-credentials', { name }, { user });
      const data = response.body.data;
      if (response.error) console.error(response.error);
      expect(response.status).toBe(200);
      expect(data.name).toBe(name);
    });

    it('should not be able to create application-credential with existing name', async () => {
      await ApplicationCredential.deleteMany({});
      const user = await createUser();
      const name = 'application-credential-test';
      await ApplicationCredential.create({ name });

      const response = await request('POST', '/1/application-credentials', { name }, { user });
      // if (response.error) console.error(response.error);
      expect(response.status).toBe(401);
    });

    it('should be able to create application-credential with existing name on put', async () => {
      await ApplicationCredential.deleteMany({});
      const user = await createUser();
      const name = 'application-credential-test';
      await ApplicationCredential.create({ name });

      // pre-existing name:
      const response = await request('PUT', '/1/application-credentials', { name }, { user });
      if (response.error) console.error(response.error);
      expect(response.status).toBe(200);
      expect(response.error).toBe(false);

      // No pre-existing name:
      const name2 = name + '2';
      const response2 = await request('PUT', '/1/application-credentials', { name: name2 }, { user });
      expect(response2.error).toBe(false);
      expect(response2.status).toBe(200);
      expect(response2.body.data.name).toBe(name2);
    });
  });

  describe('GET /:applicationCredential', () => {
    it('should be able to get application credential', async () => {
      await ApplicationCredential.deleteMany({});
      const user = await createUser();
      const name = 'application-credential-test';
      const applicationCredential = await ApplicationCredential.create({ name });
      const response = await request('GET', `/1/application-credentials/${applicationCredential.id}`, {}, { user });
      const data = response.body.data;
      expect(response.status).toBe(200);
      expect(data.name).toBe(applicationCredential.name);
    });
  });

  describe('POST /search', () => {
    it('should list out application credentials', async () => {
      await ApplicationCredential.deleteMany({});
      const user = await createUser();
      const name = 'application-credential-test';
      const name1 = name + '-1';
      const name2 = name + '-2';
      const applicationCredential1 = await ApplicationCredential.create({ name: name1 });
      const applicationCredential2 = await ApplicationCredential.create({ name: name2 });
      const response = await request('POST', '/1/application-credentials/search', {}, { user });

      expect(response.status).toBe(200);
      const data = response.body.data;
      expect(data[1].name).toBe(applicationCredential1.name);
      expect(data[1].name).toBe(name1);
      expect(data[0].name).toBe(applicationCredential2.name);
      expect(data[0].name).toBe(name2);
      expect(response.body.meta.total).toBe(2);
    });
  });

  describe('PATCH /:credential', () => {
    it('admins should be able to update application credential', async () => {
      await ApplicationCredential.deleteMany({});
      const user = await createUser();
      const name = 'application-credential-test';
      const name1 = name + '-1';
      const name2 = name + '-2';
      const applicationCredential = await ApplicationCredential.create({ name: name1 });

      const response = await request(
        'PATCH',
        `/1/application-credentials/${applicationCredential.id}`,
        { name: name2 },
        { user }
      );
      if (response.error) console.error(response.error);
      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(name2);

      // pre-existing name
      await ApplicationCredential.create({ name: name1 });
      const response2 = await request(
        'PATCH',
        `/1/application-credentials/${applicationCredential.id}`,
        { name: name1 },
        { user }
      );
      expect(response2.status).toBe(401);
    });
  });

  describe('DELETE /:credential', () => {
    it('should be able to delete application credential', async () => {
      await ApplicationCredential.deleteMany({});
      const user = await createUser();
      const name = 'application-credential-test';
      const applicationCredential = await ApplicationCredential.create({ name });
      const response = await request('DELETE', `/1/application-credentials/${applicationCredential.id}`, {}, { user });
      expect(response.status).toBe(204);
      const dbApplicationCredential = await ApplicationCredential.findById(applicationCredential.id);
      expect(dbApplicationCredential).toBeNull();
    });
  });
});
