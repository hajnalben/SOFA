import { makeExecutableSchema } from 'graphql-tools';
import * as supertest from 'supertest';
import * as express from 'express';
import { schema, models } from './schema';
import { createRouter } from '../src/express';
import { createSofa } from '../src';

test('should work with Query and variables', async () => {
  const sofa = createSofa({
    schema,
  });

  sofa.models = models;

  const router = createRouter(sofa);
  const found = router.stack.find(r => r.route && r.route.path === '/user/:id');

  expect(found).toBeDefined();

  const route: {
    path: string;
    methods: {
      get: boolean;
      post: boolean;
    };
  } = found.route;

  expect(Object.keys(route.methods).length).toEqual(1);
  expect(route.methods.get).toEqual(true);
});

test('should work with Mutation', async () => {
  const sofa = createSofa({
    schema,
  });

  sofa.models = models;

  const router = createRouter(sofa);
  const found = router.stack.find(
    r => r.route && r.route.path === '/add-random-food'
  );

  expect(found).toBeDefined();

  const route: {
    path: string;
    methods: {
      get: boolean;
      post: boolean;
    };
  } = found.route;

  expect(Object.keys(route.methods).length).toEqual(1);
  expect(route.methods.post).toEqual(true);
});

test('should parse InputTypeObject', done => {
  const users = [
    {
      id: 'user:foo',
      name: 'Foo',
    },
  ];
  const sofa = createSofa({
    schema: makeExecutableSchema({
      typeDefs: /* GraphQL */ `
        input PageInfoInput {
          offset: Int
          limit: Int!
        }
    
        type User {
          id: ID
          name: String
        }
        
        type Query {
          users(pageInfo: PageInfoInput!): [User]
        }
      `,
      resolvers: {
        Query: {
          users: () => users,
        },
      },
    }),
  });

  const router = createRouter(sofa);
  const app = express();

  app.use('/api', router);

  supertest(app)
    .get('/api/users?pageInfo={"limit": 5}')
    .expect(200, (err, res) => {
      if (err) {
        done.fail(err);
      } else {
        expect(res.body).toEqual(users);
        done();
      }
    });
});
