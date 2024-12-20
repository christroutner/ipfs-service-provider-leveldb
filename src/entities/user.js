/*
  User Entity
*/

// Global npm libraries
import { v4 as uuidv4 } from 'uuid'

class User {
  validate ({ name, email, password } = {}) {
    // Input Validation
    if (!email || typeof email !== 'string') {
      throw new Error("Property 'email' must be a string!")
    }
    if (!password || typeof password !== 'string') {
      throw new Error("Property 'password' must be a string!")
    }
    if (!name || typeof name !== 'string') {
      throw new Error("Property 'name' must be a string!")
    }

    const userData = { name, email, password }

    // Generate a unique ID for the user.
    userData.id = uuidv4()

    return userData
  }
}

export default User
