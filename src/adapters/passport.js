/*
  koa-passport is an authorization library used for different authentication schemes.
*/

import passport from 'koa-passport'

let _this
class Passport {
  constructor () {
    _this = this
    this.passport = passport
  }

  async authUser (ctx) {
    return new Promise((resolve, reject) => {
      try {
        if (!ctx) throw new Error('ctx is required')

        _this.passport.authenticate('local', (err, user) => {
          try {
            console.log('passport err: ', err)

            if (err) throw err
            console.log('passport user: ', user)

            resolve(user)
          } catch (err) {
            return reject(err)
          }
        })(ctx, null)
      } catch (err) {
        return reject(err)
      }
    })
  }
}

export default Passport
