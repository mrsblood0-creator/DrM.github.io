# Publishing a smaller website

Publish only the CONTENTS of `dist`, replacing the previous deployment files. Do not upload the whole working folder, a nested `dist`, source decks, source images, reports, ZIP archives, or `.git`.

`npm run build` now includes lossless image optimization, broken-link checks, and a conservative 1,000,000,000-byte published-size budget. `npm run optimize:images` can optimize an existing complete build. Requires Python with Pillow/WebP (the bundled runtime is detected automatically; otherwise set PYTHON).

Image conversions are accepted only when smaller and after decoded RGBA pixels, dimensions, ICC profiles and EXIF metadata match. Original files outside `dist` are preserved. Animations and unsupported formats remain unchanged. Do not manually overwrite optimized images with the original source assets after a build.

When updating GitHub, remove superseded asset filenames too; simply adding the new files leaves obsolete files occupying deployment space. Retain the repository's `.git` folder. Git history may remain large even when the published site is small; no history rewrite is performed by these tools.

The size check warns at 800 MB and fails at 1,000 MB. To grow beyond this budget, place lecture images on a separate object-storage/image-hosting service and use their HTTPS URLs in the published pages. That requires choosing and configuring an external service. No external media hosting has been provisioned. Static pages and scripts still consume space; no finite hosting allowance supports unlimited content.

Identical, unconverted assets in the source and deployment folders share disk storage through NTFS hard links. Both paths remain valid, but the image bytes are stored once. Edit source assets by replacing files rather than overwriting their bytes in place. GitHub uploads treat these as normal files; this local saving does not reduce the published-site size further.
