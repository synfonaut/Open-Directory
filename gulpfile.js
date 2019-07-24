const gulp = require("gulp");
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const babel = require("gulp-babel");
const cleanCSS = require('gulp-clean-css');
const all = require('gulp-all')

gulp.task("default", function () {

    return gulp.src([
        "public/static/css/normalize.css",
        "public/static/css/milligram.css",
        "public/static/css/app.css",
    ])
    .pipe(cleanCSS())
    .pipe(concat('bundle.min.css'))
    .pipe(gulp.dest("public/static/css/"))
});

