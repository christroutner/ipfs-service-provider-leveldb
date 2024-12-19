/*
  List all users in the LevelDB.
*/

// Global npm libraries
import level from 'level'

// Hack to get __dirname back in ESM.
// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
import * as url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const userDb = level(`${__dirname.toString()}/../../leveldb-data/current/dev/users`, {
  valueEncoding: 'json'
})

async function getAllUsers () {
  try {
    const stream = userDb.createReadStream()

    stream.on('data', function (data) {
      // console.log('data: ', data)

      console.log(`user ${data.key}: ${JSON.stringify(data.value, null, 2)}`)
    })
    // .on('close', function () {
    //   console.log('Stream closed')
    // })
    // .on('end', function () {
    //   console.log('Stream ended')
    // })
  } catch (err) {
    console.error(err)
  }
}
getAllUsers()
