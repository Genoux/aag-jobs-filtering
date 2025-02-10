import path from 'path'
import moduleAlias from 'module-alias'

const baseDir = path.resolve(__dirname, '../../')

moduleAlias.addAliases({
  '@config': path.join(baseDir, 'src/config'),
  '@services': path.join(baseDir, 'src/services'),
  '@localtypes': path.join(baseDir, 'src/types')
})