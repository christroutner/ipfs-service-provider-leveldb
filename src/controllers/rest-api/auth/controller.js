import Passport from '../../../adapters/passport.js'
const passport = new Passport()

// let _this

class AuthRESTController {
  constructor (localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating Auth REST Controller.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating Auth REST Controller.'
      )
    }

    // _this = this
    this.passport = passport

    // Bind 'this' object to all subfunctions
    this.authUser = this.authUser.bind(this)
  }

  /**
   * @apiDefine TokenError
   * @apiError Unauthorized Invalid JWT token
   *
   * @apiErrorExample {json} Unauthorized-Error:
   *     HTTP/1.1 401 Unauthorized
   *     {
   *       "status": 401,
   *       "error": "Unauthorized"
   *     }
   */

  /**
   * @api {post} /auth Authenticate user
   * @apiName AuthUser
   * @apiGroup Auth
   * @apiDescription Login a user and retrieve a JWT token, used to access
   * API endpoints that require authentication.
   *
   * @apiParam {String} username  User username.
   * @apiParam {String} password  User password.
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X POST -d '{ "email": "email@format.com", "password": "secretpasas" }' localhost:5020/auth
   *
   * @apiSuccess {Object}   user           User object
   * @apiSuccess {ObjectId} user._id       User id
   * @apiSuccess {String}   user.name      User name
   * @apiSuccess {String}   user.username  User username
   * @apiSuccess {String}   token          Encoded JWT
   *
   * @apiSuccessExample {json} Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "user": {
   *          "_id": "56bd1da600a526986cf65c80"
   *          "username": "johndoe"
   *        },
   *       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ"
   *     }
   *
   * @apiError Unauthorized Incorrect credentials
   *
   * @apiErrorExample {json} Error-Response:
   *     HTTP/1.1 401 Unauthorized
   *     {
   *       "status": 401,
   *       "error": "Unauthorized"
   *     }
   */
  async authUser (ctx, next) {
    try {
      console.log('ctx.request.body: ', ctx.request.body)
      const { email, password } = ctx.request.body

      const { token, user } = await this.useCases.user.authUser(email, password)

      // If the password was not authenticated, return a 401 error.
      if (!token) {
        ctx.throw(401)
      }

      delete user.password

      ctx.body = {
        token,
        user
      }
    } catch (err) {
      ctx.throw(401)
    }
  }
}

export default AuthRESTController
