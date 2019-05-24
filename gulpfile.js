const gulp = require("gulp");
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const babel = require("gulp-babel");
const cleanCSS = require('gulp-clean-css');
const all = require('gulp-all')

gulp.task("default", function () {
    return all(
        gulp.src([
            "public/static/css/normalize.css",
            "public/static/css/milligram.css",
            "public/static/css/app.css",
        ])
        .pipe(cleanCSS())
        .pipe(concat('bundle.min.css'))
        .pipe(gulp.dest("public/static/css/"))
        ,

        gulp.src([
            "public/static/js/cached_homepage.js",

            "public/static/js/databutton-0.0.4.js", // customized databutton

            "public/static/js/settings.js",
            "public/static/js/helpers.js",
            "public/static/js/process.js",
            "public/static/js/bsv_price.js",
            "public/static/js/admin.js",

            "public/static/js/search.js",
            "public/static/js/tipchain.js",
            "public/static/js/delete.js",
            "public/static/js/item.js",
            "public/static/js/fork.js",
            "public/static/js/entry.js",
            "public/static/js/category.js",
            "public/static/js/list.js",
            "public/static/js/changelog.js",

            "public/static/js/app.js",
        ])
        .pipe(babel({
            presets: ['@babel/env','@babel/react'],
            plugins: ['transform-react-jsx']
        }))
        .pipe(uglify())
        .pipe(concat('bundle.min.js'))
        .pipe(gulp.dest("public/static/js/"))
    )
});

