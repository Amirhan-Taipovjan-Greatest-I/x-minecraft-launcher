import { LibraryInfo, MinecraftFolder } from '@xmcl/core'
import { DownloadTask } from '@xmcl/installer'
import { ExternalAuthSkinServiceKey, ExternalAuthSkinService as IExternalAuthSkinService } from '@xmcl/runtime-api'
import { readFile, writeFile } from 'fs/promises'
import { request } from 'undici'
import LauncherApp from '../app/LauncherApp'
import { LauncherAppKey } from '../app/utils'
import { validateSha256 } from '../util/fs'
import { Inject } from '../util/objectRegistry'
import { BaseService } from './BaseService'
import { AbstractService, ExposeServiceKey } from './Service'

const AUTHLIB_ORG_NAME = 'org.to2mbn:authlibinjector'

/**
 * Majorly support the third party skin using authlib injector
 */
@ExposeServiceKey(ExternalAuthSkinServiceKey)
export class ExternalAuthSkinService extends AbstractService implements IExternalAuthSkinService {
  constructor(@Inject(LauncherAppKey) app: LauncherApp,
    @Inject(BaseService) private baseService: BaseService,
  ) {
    super(app)

    this.networkManager.registerDispatchInterceptor((options) => {
      const origin = options.origin instanceof URL ? options.origin : new URL(options.origin!)
      if (origin.hostname === 'authlib-injector.yushi.moe') {
        if (baseService.shouldOverrideApiSet()) {
          const api = baseService.state.apiSets.find(a => a.name === baseService.state.apiSetsPreference) || baseService.state.apiSets[0]
          options.origin = new URL(api.url).origin
          options.path = `/mirrors/authlib-injector${options.path}`
        }
      }
    })
  }

  async installAuthLibInjector(): Promise<string> {
    const jsonPath = this.getPath('authlib-injection.json')
    const root = this.getPath()
    const mc = new MinecraftFolder(root)

    const download = async (content: any) => {
      const name = `${AUTHLIB_ORG_NAME}:${content.version}`
      const info = LibraryInfo.resolve(name)
      const path = mc.getLibraryByPath(info.path)

      const url = new URL(content.download_url)
      const allSets = this.baseService.getApiSets()
      const urls = allSets.map(s => new URL(url.pathname.startsWith('/mirrors') ? url.pathname : `/mirrors/authlib-injector${url.pathname}`, new URL(s.url).origin)).map(u => u.toString())

      if (urls.indexOf(url.toString()) === -1) {
        urls.unshift(url.toString())
      }

      await this.submit(new DownloadTask({
        url: urls,
        validator: {
          algorithm: 'sha256',
          hash: content.checksums.sha256,
        },
        destination: path,
        ...this.networkManager.getDownloadBaseOptions(),
      }).setName('installAuthlibInjector'))

      return path
    }

    let path: string

    try {
      const response = await request('https://authlib-injector.yushi.moe/artifact/latest.json', { throwOnError: true })
      const body = await response.body.json()
      await writeFile(jsonPath, JSON.stringify(body))
      path = await download(body)
    } catch (e) {
      const content = await readFile(jsonPath, 'utf-8').then(JSON.parse).catch(() => undefined)
      if (content) {
        path = await download(content)
      } else {
        throw e
      }
    }

    return path
  }

  async isAuthLibInjectorReady() {
    const jsonPath = this.getPath('authlib-injection.json')
    const content = await readFile(jsonPath, 'utf-8').then(JSON.parse).catch(() => undefined)
    if (!content) return false
    const info = LibraryInfo.resolve(`${AUTHLIB_ORG_NAME}:${content.version}`)
    const mc = new MinecraftFolder(this.getPath())
    const libPath = mc.getLibraryByPath(info.path)
    return validateSha256(libPath, content.checksums.sha256)
  }
}
