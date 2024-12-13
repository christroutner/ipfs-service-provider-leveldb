/*
  Adapter library for LevelDB.
*/

// Public npm libraries
import { Level } from 'level'

// Hack to get __dirname back.
// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
import * as url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

class LevelDb {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.Level = Level

    // Bind 'this' object to all subfunctions.
    this.openDbs = this.openDbs.bind(this)
    this.closeDbs = this.closeDbs.bind(this)
  }

  // Open the Level databases. This function should be calld on startup.
  openDbs () {
    try {
      this.userDb = new this.Level(`${__dirname.toString()}/../../../leveldb-data/current/users`, {
        valueEncoding: 'json',
        cacheSize: 1024 * 1024 * 10 // 10 MB
      })

      console.log('All Level Databases loaded.')

      return {
        userDb: this.userDb
      }
    } catch (err) {
      console.error('Error in adapters/leveldb/index.js openDbs()')
      throw err
    }
  }

  async closeDbs () {
    await this.userDb.close()

    // Signal that the databases were close successfully.
    return true
  }
}

export default LevelDb
