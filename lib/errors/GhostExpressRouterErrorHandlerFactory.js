'use strict';

const GhostExpressRouterErrorHandler = require('./GhostExpressRouterErrorHandler');

class GhostExpressRouterErrorHandlerFactory {

  /**
   *  @name GhostExpressRouter_ErrorHandlerConfig
   *	@type {Object}
   *  @property {Object} options
   *	@property {Logger} Logger
   *	@property {NewRelicService} NewRelicService
   */

  /**
   * @param {GhostExpressRouter_ErrorHandlerConfig} options
   */
  static create (options = {}) {
    return new GhostExpressRouterErrorHandler(options.Logger, options.NewRelicService);
  }

}

module.exports = GhostExpressRouterErrorHandlerFactory;