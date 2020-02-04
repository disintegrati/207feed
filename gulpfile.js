var gulp = require("gulp"),
    sass = require("gulp-sass"),
    postcss = require("gulp-postcss"),
    autoprefixer = require("autoprefixer"),
    cssnano = require("cssnano"),
    bourbon = require("bourbon").includePaths,
    sourcemaps = require("gulp-sourcemaps"),
    jshint = require("gulp-jshint");

var browserSync = require("browser-sync").create();

var paths = {
  styles: {
    // By using styles/**/*.sass we're telling gulp to check all folders for any sass file
    src: "src/sass/**/*.scss",
    // Compiled files will end up in whichever folder it's found in (partials are not compiled)
    dest: "./"
  }
};

function style() {
  return (
    gulp
      .src(paths.styles.src)
      // Initialize sourcemaps before compilation starts
      .pipe(sourcemaps.init())
      .pipe(sass(
        {
          includePaths: [bourbon]
        }
      ))
      .on("error", sass.logError)
      // Use postcss with autoprefixer and compress the compiled file using cssnano
      .pipe(postcss([autoprefixer(), cssnano()]))
      // Now add/write the sourcemaps
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(paths.styles.dest))
      // After compilation
      .pipe(browserSync.stream())
  );
}

// Expose the task by exporting it
// This allows you to run it from the commandline using
// $ gulp style
exports.style = style;

function reload() {
  browserSync.reload();
}

function watch() {
  browserSync.init({
    server: {
      baseDir: "./"
    },
    // proxy: "localhost/odeonartists.com",
    // port: 80 
  });
  // gulp.watch takes in the location of the files to watch for changes
  // and the name of the function we want to run on change
  gulp.watch(paths.styles.src, style);
  gulp.watch("*.html").on('change', browserSync.reload);
  gulp.watch("*.php").on('change', browserSync.reload);
  //gulp.watch('*.js', js);
}

// Don't forget to expose the task!
exports.watch = watch