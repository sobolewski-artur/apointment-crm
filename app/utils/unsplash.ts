const UTM = 'utm_source=aura_beauty&utm_medium=referral'

/** Resized/cropped image URL from the Unsplash (imgix) CDN */
export const unsplashUrl = (id: string, width: number, aspect?: number, quality = 75) => {
  // crop=faces keeps faces in frame when cropping to a different aspect ratio (falls back to center)
  const params = new URLSearchParams({ auto: 'format', fit: 'crop', crop: 'faces,center', w: String(width), q: String(quality) })
  if (aspect) params.set('h', String(Math.round(width / aspect)))
  return `https://images.unsplash.com/${id}?${params}`
}

export const unsplashSrcset = (id: string, widths: number[], aspect?: number) =>
  widths.map(w => `${unsplashUrl(id, w, aspect)} ${w}w`).join(', ')

/** Attribution links as recommended by Unsplash */
export const unsplashPhotoPage = (slug: string) => `https://unsplash.com/photos/${slug}?${UTM}`
export const unsplashProfile = (username: string) => `https://unsplash.com/@${username}?${UTM}`
