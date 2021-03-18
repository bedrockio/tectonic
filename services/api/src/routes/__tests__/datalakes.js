const { setupDb, teardownDb, request, createUser } = require('../../utils/testing');

// --- Generator: requires
const { Datalake, Upload } = require('../../models');
// --- Generator: end

beforeAll(async () => {
  await setupDb();
});

afterAll(async () => {
  await teardownDb();
});

// --- Generator: vars
const createUpload = () => {
  return Upload.create({
    filename: 'logo.png',
    rawUrl: 'logo.png',
    hash: 'test',
    storageType: 'local',
    mimeType: 'image/png',
    ownerId: 'none',
  });
};
// --- Generator: end

describe('/1/datalakes', () => {
  describe('POST /search', () => {
    it('should list out datalakes', async () => {
      // --- Generator: test-search
      const user = await createUser();

      const datalake1 = await Datalake.create({
        name: 'test 1',
        description: 'Some description',
      });

      const datalake2 = await Datalake.create({
        name: 'test 2',
        description: 'Some description',
      });

      const response = await request('POST', '/1/datalakes/search', {}, { user });

      expect(response.status).toBe(200);
      const body = response.body;
      expect(body.data[1].name).toBe(datalake1.name);
      expect(body.data[0].name).toBe(datalake2.name);
      expect(body.meta.total).toBe(2);
      // --- Generator: end
    });
  });

  describe('GET /:datalake', () => {
    it('should be able to access datalake', async () => {
      // --- Generator: test-get
      const user = await createUser();
      const datalake = await Datalake.create({
        name: 'new datalake',
      });
      const response = await request('GET', `/1/datalakes/${datalake.id}`, {}, { user });
      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe(datalake.name);
      // --- Generator: end
    });
  });

  describe('POST /', () => {
    it('should be able to create datalake', async () => {
      // --- Generator: test-post
      const user = await createUser();
      const upload = await createUpload();
      const response = await request(
        'POST',
        '/1/datalakes',
        {
          name: 'datalake name',
          images: [upload.id],
        },
        { user }
      );
      const data = response.body.data;
      expect(response.status).toBe(200);
      expect(data.name).toBe('datalake name');
      expect(data.images[0].id).toBe(upload.id);
      expect(data.images[0].hash).toBe('test');
      // --- Generator: end
    });
  });

  describe('DELETE /:datalake', () => {
    it('should be able to delete datalake', async () => {
      // --- Generator: test-delete
      const user = await createUser();
      let datalake = await Datalake.create({
        name: 'test 1',
        description: 'Some description',
      });
      const response = await request('DELETE', `/1/datalakes/${datalake.id}`, {}, { user });
      expect(response.status).toBe(204);
      datalake = await Datalake.findById(datalake.id);
      expect(datalake.deletedAt).toBeDefined();
      // --- Generator: end
    });
  });

  describe('PATCH /:datalake', () => {
    it('should be able to update datalake', async () => {
      // --- Generator: test-patch
      const user = await createUser();
      let datalake = await Datalake.create({
        name: 'datalake name',
        description: 'Some description',
      });
      datalake.name = 'new name';
      const response = await request('PATCH', `/1/datalakes/${datalake.id}`, datalake.toJSON(), { user });
      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('new name');
      datalake = await Datalake.findById(datalake.id);
      expect(datalake.name).toEqual('new name');
      // --- Generator: end
    });
  });
});
