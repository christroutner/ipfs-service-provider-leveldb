/*
  Adapter library for LevelDB.
*/

// Public npm libraries
import level from 'level'

// Local libraries
import config from '../../../config/index.js'

// Hack to get __dirname back in ESM.
// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
import * as url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

class LevelDb {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.level = level
    this.config = config

    // Bind 'this' object to all subfunctions.
    this.openDbs = this.openDbs.bind(this)
    this.closeDbs = this.closeDbs.bind(this)

    // State
    this.userDb = null // placeholder
  }

  // Open the Level databases. This function should be calld on startup.
  openDbs () {
    try {
      // If the database is already open, exit by returning the existing dbs.
      if (this.userDb) {
        return {
          userDb: this.userDb
        }
      }

      // Open the databases
      this.userDb = this.level(`${__dirname.toString()}/../../../leveldb-data/current/${this.config.database}/users`, {
        valueEncoding: 'json',
        cacheSize: 1024 * 1024 * 10 // 10 MB
      })

      return {
        userDb: this.userDb
      }
    } catch (err) {
      console.error('Error in adapters/leveldb/index.js openDbs()')
      throw err
    }
  }

  async closeDbs () {
    if (this.userDb) {
      await this.userDb.close()
    }

    // Signal that the databases were close successfully.
    return true
  }
}

export default LevelDb
