'use strict';

module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-mocha-istanbul')

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    quiet: false,
                    timeout: 15000
                },
                src: ["test/**/*_test.js"]
            }
        },
        mocha_istanbul: {
            coverage: {
                src: 'test',
                options: {
                    mask: '*.js',
                    quiet: false,
                    check: {
                        lines: 80,
                        statements: 80
                    },
                }
            },
        }
    });

    grunt.registerTask('test', ['mocha_istanbul']);
    grunt.registerTask('coverage', ['mocha_istanbul']);
};