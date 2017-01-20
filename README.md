# ghost-express-router

[![Code Climate](https://codeclimate.com/github/ghostcreative/ghost-express-router/badges/gpa.svg)](https://codeclimate.com/github/ghostcreative/ghost-express-router) [![Downloads](http://img.shields.io/npm/dt/ghost-express-router.svg)](https://www.npmjs.com/package/ghost-express-router)

Router for [ghost-express-server](https://github.com/ghostcreative/ghost-express-server).

## Install

```bash
$ npm install ghost-express-router
```

## Usage

```js
const Config = require('config');
const Joi = require('joi');
const GhostExpressServer = require('ghost-express-server');
const GhostExpressRouter = require('ghost-express-router');
const GhostRouteController = require('ghost-route-controller');
const Router = new GhostExpressRouter();

Router.configure([
  {
    method: 'GET',
    path: '/:id',
    auth: {
      plugin: 'bearerJwt',
      permissions: ['addressSelfFullAccess', 'addressAllFullAccess']
    },
    handler: GhostRouteController.get,
    validate: {
      params: { id: Joi.number().integer() }
    }
  }, {
    method: 'POST',
    path: '/',
    auth: {
      plugin: 'bearerJwt',
      permissions: ['addressSelfFullAccess', 'addressAllFullAccess']
    },
    handler: GhostRouteController.create,
    validate: {
      body: {
        name: Joi.string().required(),
        line1: Joi.string().required(),
        line2: Joi.string(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        zip: Joi.string().regex(/^\d{5}(?:[-\s]\d{4})?$/).required(),
        phone: Joi.string(),
        allerganId: Joi.string()
      }
    }
  }, {
    method: 'PUT',
    path: '/:id',
    auth: {
      plugin: 'bearerJwt',
      permissions: ['addressSelfFullAccess', 'addressAllFullAccess']
    },
    handler: GhostRouteController.update,
    validate: {
      params: { id: Joi.number().integer().required() },
      body: {
        doc: {
          name: Joi.string().required(),
          line1: Joi.string().required(),
          line2: Joi.string(),
          city: Joi.string().required(),
          state: Joi.string().required(),
          zip: Joi.string().regex(/^\d{5}(?:[-\s]\d{4})?$/).required(),
          phone: Joi.string(),
          allerganId: Joi.string(),
          profileId: Joi.number().integer().required()
        }
      }
    }
  }, {
    method: 'DELETE',
    path: '/:id',
    auth: {
      plugin: 'bearerJwt',
      permissions: ['addressSelfFullAccess', 'addressAllFullAccess']
    },
    handler: GhostRouteController.delete,
    validate: {
      params: { id: Joi.number().integer().required() }
    }
  }
]);

GhostExpressServer.create(Config.get('server'))
.then(server => {
    server.useRouter(`/api/v1/addresses`, Router);
    return server
})
.then(server => server.start())

```