/* eslint-disable no-console */
// Adds deps to peerDependencies that we consider optional but parcel requires to be defined
// Only intended to run as part of the semantic-release workflow

const path = require('path')
const writeFileAtomic = require('write-file-atomic')

async function main() {
  try {
    console.group('preParcel')
    const pkg = require('../package.json')
    console.log('Modifying...')
    Object.assign(pkg.peerDependencies, {
      next: pkg.dependencies.next,
      sanity: pkg.dependencies.sanity,
      'styled-components': pkg.dependencies['styled-components'],
    })
    console.log('Writing package.json...')
    await writeFileAtomic(
      path.resolve(__dirname, '../package.json'),
      JSON.stringify(pkg, null, 2),
      'utf8'
    )
    console.log('Finished!')
  } finally {
    console.groupEnd()
  }
}

main().catch((err) => {
  console.error(err)
  // eslint-disable-next-line no-process-exit
  process.exit(1)
})
