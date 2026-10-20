import { useState } from 'react'
import { useI18n } from '../../i18n'
import { AVAILABLE_SHOTS, SHOT_SIZES, type ShotId } from './shots'

/**
 * A screenshot with descriptive alt text. When the file fails to load, the alt text stays as a
 * plain sentence, so the step around it still makes sense.
 */
export function HelpShot({
  id,
  available = AVAILABLE_SHOTS,
}: {
  id: ShotId
  available?: ReadonlySet<ShotId>
}) {
  const { t } = useI18n()
  const [failed, setFailed] = useState(false)
  if (!available.has(id)) return null
  const alt = t(`help.shots.${id}`)
  return (
    <figure className="help-shot">
      {failed ? (
        <figcaption className="small muted">{alt}</figcaption>
      ) : (
        <img
          className="help-image"
          src={`${import.meta.env.BASE_URL}img/help/${id}.webp`}
          alt={alt}
          {...SHOT_SIZES[id]}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </figure>
  )
}
