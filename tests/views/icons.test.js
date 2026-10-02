import { describe, it, expect } from 'vitest'
import * as icons from '../../src/views/icons.js'

describe('views/icons.js', () => {
  it('exporta todos los iconos requeridos como cadenas SVG vectoriales válidas', () => {
    const requiredIcons = [
      'iconPlus',
      'iconEdit',
      'iconSave',
      'iconTrash',
      'iconArrowLeft',
      'iconPlay',
      'iconPause',
      'iconMic',
      'iconClock',
      'iconSearch',
      'iconClose',
      'iconSettings',
      'iconChevronUp',
      'iconChevronDown',
      'iconUpload',
      'iconDownload',
      'iconMusic',
      'iconFileText',
      'iconVolume',
      'iconVolumeMute',
      'iconGlobe',
      'iconLink',
      'iconMusicNote',
      'iconPalette',
      'iconCheck',
      'iconRotateCcw',
      'iconSparkles',
      'iconGrid',
      'iconList',
      'iconFolder',
      'iconFolderPlus',
      'iconSkipBack',
      'iconSkipForward',
      'iconShuffle',
      'iconListMusic',
      'iconListPlus'
    ]

    requiredIcons.forEach(iconName => {
      const iconContent = icons[iconName]
      expect(iconContent, `El icono ${iconName} debe estar definido`).toBeDefined()
      expect(typeof iconContent).toBe('string')
      expect(iconContent.trim().startsWith('<svg')).toBe(true)
      expect(iconContent.trim().endsWith('</svg>')).toBe(true)
      expect(iconContent).toContain('viewBox=')
    })
  })
})
