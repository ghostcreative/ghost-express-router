'use strict';

class GhostExpressRouterErrorHandler {

  /**
   *  @name GhostExpressRouter_ErrorHandlerConfig
   *  @type {Object}
   *  @property {Object} options
   */

  /**
   *  @param {Logger} Logger
   *  @param {NewRelicService} NewRelicService
   */
  constructor (Logger, NewRelicService) {
    return this.handler.bind({
      _logError: this._logError,
      _logger: Logger,
      _newRelicService: NewRelicService
    })
  }

  /**
   * @param {Error} err
   * @param {Request} req
   * @param {Response} res
   * @param {Function} next
   */
  handler (err, req, res, next) {
    const errorMessage = GhostExpressRouterErrorHandler._buildErrorMessage(err);
    this._logError(err, errorMessage, req.params, req.body, req.query);
    res.status(err.status);

    return res.format({
      json: () => {
        res.json({
          code: err.code,
          message: errorMessage
        });
      },
      html: () => {
        res.render('error', {
          status: err.status,
          code: err.code,
          message: errorMessage
        });
      }
    });
  }

  /**
   * @param {Error} err
   * @return {String} errorMessage
   * @private
   */
  static _buildErrorMessage (err) {
    let errorMessage;
    if (err.status == 500) errorMessage = 'Internal Server Error';
    else if (!err.message) errorMessage = 'Unknown Error';
    else if (err.message.message) errorMessage = err.message.message;
    else if (err.message.body) errorMessage = err.message.body;
    else if (err.message.msg) errorMessage = err.message.msg;
    else errorMessage = 'Unknown Error';
    return errorMessage;
  }

  /**
   * @param {Error} err
   * @param {String} errorMessage
   * @param {Request.params} params
   * @param {Request.body} body
   * @param {Request.query} query
   * @private
   */
  _logError (err, errorMessage, params, body, query) {
    this._logger ? this._logger.error('GhostExpressRouterError', { error: err, message: errorMessage, params, body, query }) : null;
    this._newRelicService ? this._newRelicServide.logError(err, { message: errorMessage, params, body, query }) : null;
  }

}

module.exports = GhostExpressRouterErrorHandler;