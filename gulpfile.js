const { src, dest, series, parallel } = require("gulp");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const terser = require("gulp-terser");
const sharp = require("sharp");
const fs = require("fs/promises");
const path = require("path");

const paths = {
  css: "css/styles.css",
  js: "js/app.js",
  images: "assets/*.{jpg,jpeg,png}",
  optimized: "assets/optimized",
  distCss: "dist/css",
  distJs: "dist/js",
};

function styles() {
  return src(paths.css)
    .pipe(postcss([autoprefixer(), cssnano({ preset: "default" })]))
    .pipe(dest(paths.distCss));
}

function scripts() {
  return src(paths.js).pipe(terser()).pipe(dest(paths.distJs));
}

async function images() {
  await fs.mkdir(paths.optimized, { recursive: true });
  const entries = await fs.readdir("assets", { withFileTypes: true });
  const imageFiles = entries
    .filter((entry) => entry.isFile() && /\.(jpe?g|png)$/i.test(entry.name))
    .map((entry) => entry.name);

  await Promise.all(
    imageFiles.flatMap((file) => {
      const input = path.join("assets", file);
      const parsed = path.parse(file);
      const base = parsed.name.replace(/\s+/g, "-").toLowerCase();
      const pipeline = sharp(input, { animated: false }).rotate();
      const resizeOptions = /\.(jpe?g)$/i.test(file)
        ? { width: 2200, height: 2200, fit: "inside", withoutEnlargement: true }
        : { withoutEnlargement: true };

      return [
        pipeline
          .clone()
          .resize(resizeOptions)
          .webp({ quality: /\.(png)$/i.test(file) ? 92 : 78, effort: 6 })
          .toFile(path.join(paths.optimized, `${base}.webp`)),
        pipeline
          .clone()
          .resize(resizeOptions)
          .avif({ quality: /\.(png)$/i.test(file) ? 78 : 52, effort: 7 })
          .toFile(path.join(paths.optimized, `${base}.avif`)),
      ];
    })
  );
}

exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.build = series(images, parallel(styles, scripts));
exports.default = exports.build;
