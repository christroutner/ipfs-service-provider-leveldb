/*
  This library contains business-logic for dealing with users. Most of these
  functions are called by the /user REST API endpoints.
*/

// Global libraries
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Local libraries
import UserEntity from '../entities/user.js'
import wlogger from '../adapters/wlogger.js'
import config from '../../config/index.js'

class UserLib {
  constructor (localConfig = {}) {
    // console.log('User localConfig: ', localConfig)
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of adapters must be passed in when instantiating User Use Cases library.'
      )
    }

    // Encapsulate dependencies
    this.UserEntity = new UserEntity()
    // this.UserModel = this.adapters.localdb.Users
    this.jwt = jwt
    this.config = config
    this.bcrypt = bcrypt

    // Bind 'this' object to all subfunctions
    this.createUser = this.createUser.bind(this)
    this.getAllUsers = this.getAllUsers.bind(this)
    this.getUser = this.getUser.bind(this)
    this.updateUser = this.updateUser.bind(this)
    this.deleteUser = this.deleteUser.bind(this)
    this.authUser = this.authUser.bind(this)
    this.generateToken = this.generateToken.bind(this)
    this.hashPassword = this.hashPassword.bind(this)
    this.validatePassword = this.validatePassword.bind(this)
  }

  // DEPRECATED
  // Create a new user model and add it to the Mongo database.
  // async createUser (userObj) {
  //   try {
  //     // Input Validation

  //     const userEntity = this.UserEntity.validate(userObj)
  //     const user = new this.UserModel(userEntity)

  //     // Enforce default value of 'user'
  //     user.type = 'user'
  //     // console.log('user: ', user)

  //     // Save the new user model to the database.
  //     await user.save()

  //     // Generate a JWT token for the user.
  //     const token = user.generateToken()

  //     // Convert the database model to a JSON object.
  //     const userData = user.toJSON()
  //     // console.log('userData: ', userData)

  //     // Delete the password property.
  //     delete userData.password

  //     return { userData, token }
  //   } catch (err) {
  //     // console.log('createUser() error: ', err)
  //     wlogger.error('Error in lib/users.js/createUser()')
  //     throw err
  //   }
  // }

  // createUser() but using LevelDB.
  async createUser (userObj) {
    try {
      // Input Validation
      let userEntity = this.UserEntity.validate(userObj)
      console.log('userEntity: ', userEntity)

      // Replace the password with a hash
      userEntity = await this.hashPassword(userEntity)
      console.log('userEntity: ', userEntity)

      // Enforce default value of 'user'
      userEntity.type = 'user'

      // Generate a JWT token for the user.
      const token = this.generateToken({ user: userEntity })
      userEntity.token = token

      // Save the user to the database.
      // Note: Users are looked up by their email. Email addresses must be unique,
      // e.g. there can not be two users with the same email address.
      await this.adapters.levelDb.userDb.put(userEntity.email, userEntity)

      return { userData: userEntity, token }
    } catch (err) {
      console.log('Error in use-cases/user.js createUserLevel(): ', err)
      wlogger.error('Error in use-cases/user.js createUserLevel()')
      throw err
    }
  }

  // Returns an array of all user models in the User level database.
  async getAllUsers () {
    try {
      console.log('getAllUsersLevel() called')
      const users = []

      const userDb = this.adapters.levelDb.userDb
      const stream = userDb.createReadStream()

      return new Promise((resolve, reject) => {
        stream.on('data', function (data) {
          // console.log('data: ', data)

          // console.log(`user ${data.key}: ${JSON.stringify(data.value, null, 2)}`)
          users.push(data.value)
        })

        stream.on('end', function () {
          resolve(users)
        })

        stream.on('error', function (err) {
          reject(err)
        })
      })
    } catch (err) {
      wlogger.error('Error in lib/users.js/getAllUsersLevel()')
      throw err
    }
  }

  // Get the model for a specific user.
  // async getUser (params) {
  //   try {
  //     const { id } = params
  //
  //     const user = await this.UserModel.findById(id, '-password')
  //
  //     // Throw a 404 error if the user isn't found.
  //     if (!user) {
  //       const err = new Error('User not found')
  //       err.status = 404
  //       throw err
  //     }
  //
  //     return user
  //   } catch (err) {
  //     // console.log('Error in getUser: ', err)
  //
  //     if (err.status === 404) throw err
  //
  //     // Return 422 for any other error
  //     err.status = 422
  //     err.message = 'Unprocessable Entity'
  //     throw err
  //   }
  // }

  // Get the model for a specific user.
  async getUser (params) {
    try {
      const { email } = params

      // const user = await this.UserModel.findById(id, '-password')
      const userDb = this.adapters.levelDb.userDb
      const user = await userDb.get(email)

      delete user.password

      // Throw a 404 error if the user isn't found.
      if (!user) {
        const err = new Error('User not found')
        err.status = 404
        throw err
      }

      return user
    } catch (err) {
      console.log('Error in getUser: ', err)

      if (err.status === 404) throw err

      // Return 422 for any other error
      err.status = 422
      err.message = 'Unprocessable Entity'
      throw err
    }
  }

  async updateUser (existingUser, newData) {
    try {
      // console.log('existingUser: ', existingUser)
      // console.log('newData: ', newData)

      // Input Validation
      // Optional inputs, but they must be strings if included.
      if (newData.email && typeof newData.email !== 'string') {
        throw new Error("Property 'email' must be a string!")
      }
      if (newData.name && typeof newData.name !== 'string') {
        throw new Error("Property 'name' must be a string!")
      }
      if (newData.password && typeof newData.password !== 'string') {
        throw new Error("Property 'password' must be a string!")
      }

      // Save a copy of the original user type.
      const userType = existingUser.type
      // console.log('userType: ', userType)

      // If user 'type' property is sent by the client
      if (newData.type) {
        if (typeof newData.type !== 'string') {
          throw new Error("Property 'type' must be a string!")
        }

        // Unless the calling user is an admin, they can not change the user type.
        if (userType !== 'admin') {
          throw new Error("Property 'type' can only be changed by Admin user")
        }
      }

      // If the user changes the email, then the old user record needs to be
      // deleted and new one created. This is because email is used as the
      // key in LevelDB.
      if (newData.email) {
        console.log('TODO: delete old user and create new user with new email')
      }

      // Overwrite any existing data with the new data.
      Object.assign(existingUser, newData)

      // Replace the password with a hash
      const userEntity = await this.hashPassword({ password: newData.password })
      // console.log('userEntity: ', userEntity)
      existingUser.password = userEntity.password
      // console.log('existingUser: ', existingUser)

      // Save the user to the database.
      // Note: Users are looked up by their email. Email addresses must be unique,
      // e.g. there can not be two users with the same email address.
      await this.adapters.levelDb.userDb.put(existingUser.email, existingUser)

      // Delete the password property.
      delete existingUser.password

      return existingUser
    } catch (err) {
      wlogger.error('Error in lib/users.js/updateUser(): ', err)
      throw err
    }
  }

  async deleteUser (user) {
    try {
      if (!user.email) {
        throw new Error('User email not provided.')
      }

      console.log('deleteUser() user: ', user)

      // Delete the user from the database.
      await this.adapters.levelDb.userDb.del(user.email)

      return true
    } catch (err) {
      wlogger.error('Error in lib/users.js/deleteUser()')
      throw err
    }
  }

  // Used to authenticate a user. If the login and password salt match a user in
  // the database, then it returns the user model. The Koa REST API uses the
  // Passport library for this functionality. This function is used to
  // authenticate users who login via the JSON RPC.
  async authUser (login, password) {
    try {
      console.log('login: ', login)
      console.log('password: ', password)

      // Retrieve the user model from the database.
      const user = await this.adapters.levelDb.userDb.get(login)
      console.log('authUser() user model: ', user)

      // Hash the provided password
      const result = await this.hashPassword({ password })
      console.log('result: ', result)
      const hashedPswd = result.password

      console.log('user.password: ', user.password)
      console.log('hashedPswd: ', hashedPswd)

      // Validate the password
      // const passwordIsValid = user.password === hashedPswd
      const passwordIsValid = await this.bcrypt.compare(password, user.password)

      if (!passwordIsValid) {
        return false
      }

      const token = this.generateToken({ user })

      return { token, user }

      // const user = await this.UserModel.findOne({ email: login })
      // if (!user) {
      //   throw new Error('User not found')
      // }
      //
      // const isMatch = await user.validatePassword(passwd)
      //
      // if (!isMatch) {
      //   throw new Error('Login credential do not match')
      // }
      //
      // return user
    } catch (err) {
      // console.error('Error in users.js/authUser()')
      console.log('Error in use-cases/user.js authUser(): ', err)
      throw err
    }
  }

  // Generate a JWT token for the user to authenticate when making REST API calls.
  generateToken (inObj = {}) {
    try {
      const { user } = inObj

      const token = jwt.sign({ email: user.email }, this.config.token)
      // console.log(`config.token: ${config.token}`)
      // console.log(`generated token: ${token}`)
      return token
    } catch (err) {
      wlogger.error('Error in use-cases/user.js generateToken()')
      throw err
    }
  }

  // Rather than storing the raw password in the database, we store a hash
  // of the password.
  async hashPassword (user) {
    try {
      const salt = await this.bcrypt.genSalt(10)
      const hash = await this.bcrypt.hash(user.password, salt)

      user.password = hash

      return user
    } catch (err) {
      wlogger.error('Error in use-cases/user.js hashPassword()')
      throw err
    }
  }

  // Validate that the submitted password matches what is saved in the database.
  async validatePassword () {
    try {
      console.log('validatePassword() called')
    } catch (err) {
      console.log('Error in use-cases/user.js validatePassword()')
      throw err
    }
  }
}

export default UserLib
