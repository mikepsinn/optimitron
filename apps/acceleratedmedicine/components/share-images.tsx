import { Download } from "lucide-react"
import Image from "next/image"

import { Button } from "@optimitron/neobrutalist-ui/ui/button"

import socialImages from "@/lib/social-images.json"

// Rendered by design/social/render.mjs: a PNG to download and a WebP thumbnail for each size.
const FOLDER = "/assets/acceleratedmedicine/social"

type SocialImage = (typeof socialImages)[number]

function ShareImage({ image }: { image: SocialImage }) {
  return (
    <li className="flex flex-col rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex h-44 items-center justify-center rounded-md bg-muted p-3">
        <Image
          alt={`${image.title}: the initiative's name, its goal and the four-step loop`}
          className="max-h-full w-auto rounded-sm object-contain shadow-sm"
          height={image.height}
          src={`${FOLDER}/thumbs/${image.file}.webp`}
          width={image.width}
        />
      </div>
      <h4 className="mt-4 font-semibold">{image.title}</h4>
      <p className="mt-1 flex-1 text-sm text-muted-foreground">
        {image.width} × {image.height} · {image.use}
      </p>
      <Button asChild className="mt-4 self-start" variant="outline">
        <a download={`acceleratedmedicine-${image.file}.png`} href={`${FOLDER}/${image.file}.png`}>
          <Download aria-hidden="true" className="mr-2 h-4 w-4" /> Download
        </a>
      </Button>
    </li>
  )
}

const GROUPS = [
  { kind: "post", title: "Posts" },
  { kind: "header", title: "Profile headers and covers" },
]

export function ShareImages() {
  return (
    <section aria-labelledby="share-images" className="mx-auto max-w-5xl pb-12">
      <h2 id="share-images" className="text-2xl font-bold tracking-tight md:text-3xl">Images to share</h2>
      <p className="mt-2 text-muted-foreground">Each image is sized for the places listed under it.</p>
      {GROUPS.map(group => (
        <div key={group.kind}>
          <h3 className="mt-8 text-lg font-semibold">{group.title}</h3>
          <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {socialImages.filter(image => image.kind === group.kind).map(image => (
              <ShareImage image={image} key={image.file} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}
