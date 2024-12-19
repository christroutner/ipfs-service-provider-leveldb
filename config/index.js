import common from './env/common.js'

import development from './env/development.js'
import production from './env/production.js'
import test from './env/test.js'

const env = process.env.SVC_ENV || 'development'
console.log(`Loading config for this environment: ${env}`)

let config = development
if (env.includes('test')) {
  config = test
} else if (env.includes('prod')) {
  config = production
}

const finalConfig = Object.assign({}, common, config)
// console.log('finalConfig: ', finalConfig)

export default finalConfig
