'use strict';
const _ = require('lodash');


class GhostExpressRouter {

  /**
   * @param {BadRequest} BadRequestError
   * @param {Forbidden} ForbiddenError
   * @param {Router} Router
   * @param {Router} AuthRouter
   * @param {AuthService} AuthService
   * @param {PermissionService} PermissionService
   */
  constructor (BadRequestError, ForbiddenError, Router, AuthRouter, AuthService, PermissionService) {
    this.BadRequest = BadRequestError;
    this.Forbidden = ForbiddenError;
    this.AuthService = AuthService;
    this.PermissionService = PermissionService;
    this.Router = Router;
    this.AuthRouter = AuthRouter(AuthService);
  }

  getAuthRouter () {
    return this.AuthRouter;
  }

  setAuthRouter (Router) {
    this.AuthRouter = Router;
    return this;
  }

  getRouter () {
    return this.Router;
  }

  setRouter (Router) {
    this.Router = Router;
    return this;
  }

  handle (method, path, routeOptions) {
    if (_.isObject(routeOptions)) this.Router[method.toLowerCase()](path, this.validatePermissions.bind(this), this._resolveRouterHandler.bind({ routeOptions }));
    else this.Router[method.toLowerCase()](path, routeOptions);
  }

  validatePermissions (req, res, next) {
    this.AuthService.authorized(req, res)
    .tap(creds => req.creds = creds)
    .then(() => this.PermissionService.attachRolePermissionsToRequest(req, res))
    .then(() => next())
    .catch(err => next(err))
  }

  _resolveRouterHandler (req, res, next) {
    if (!req.creds) return next(new res.Forbidden());

    const permissions = _.map(req.creds.permissions, 'permissionName');
    const assignedPermissions = _.keys(this.routeOptions);
    const assignedHandler = this.routeOptions[_.head(_.intersection(permissions, assignedPermissions))];

    assignedHandler ? assignedHandler(req, res, next) : next(this.Forbidden);
  }

}

module.exports = GhostExpressRouter;