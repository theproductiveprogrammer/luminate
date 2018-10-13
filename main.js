'use strict'

/*      understand/
 * We use the Twelve-Factor App methodology to separate our
 * configuration from our code. Towards that end we take a lot of
 * configuration paramters from the environment. `dotenv` allows us to
 * additionally use a `.env` file for simplifying setting these
 * variables
 */
require('dotenv').config()

/*      section/
 * Import all the things!
 */
const chalk = require('chalk')

/*      section/
 * Our modules
 */
const showhelp = require('./help')

/*      understand/
 * We export the `main` function that runs `luminate` as a command line
 * program
 */
module.exports = main

function main() {
    const cfg = getConfiguration()
    const op = setupOutput(cfg)
    showhelp(cfg, op)
}

/*      outcome/
 * Gets the configuration from environment variables. See also `dotenv`.
 */
function getConfiguration() {
    let cfg = {}
    if(process.env.LM__NO_COLOR) cfg.noColor = true
    if(process.env.LM__AS_SCRIPT) cfg.asScript = true
    return cfg
}

/*      outcome/
 * Set up input and output functions as well as formatting and any other
 * parameters
 */
function setupOutput(cfg) {
    let op = {
        out: console.log,
        err: console.error,
        chalk: setup_chalk_1(),
        istty: process.stdout.isTTY,
        rows: process.stdout.rows,
        cols: process.stdout.columns,
    }
    process.stdout.on('resize', () => {
        op.rows = process.stdout.rows
        op.cols = process.stdout.columns
    })

    op.out = paged_generator_1(op)

    return op

    /*      outcome/
     * Show paged output
     */
    function paged_generator_1(op) {
        if(!op.istty) return console.log
        return function(txt) {
            let lines = txt.split('\n')
            let rows = op.rows - 5 // Keep a buffer for multi-line prompts and overflows
            if(lines.length < rows) {
                console.log(txt)
            }
            show_lines_from_1(0)

            function show_lines_from_1(ndx) {
                console.log(lines.slice(ndx,ndx+rows).join('\n'))
                if(lines.length >= ndx+rows) {
                    wait_for_keypress_1(() => show_lines_from_1(ndx+rows))
                } else {
                    process.exit()
                }
            }

            function wait_for_keypress_1(cb) {
                process.stdin.setRawMode(true)
                process.stdin.once('data', () => {
                    process.stdin.setRawMode(false)
                    cb()
                })
            }
        }
    }

    /*      problem/
     * The `chalk` package automatically detects if the terminal supports
     * colors and turns them off if it doesn't. However there are situations
     * where the user would like to switch off coloring for some reason and
     * we also would not like to have colors if we are part of a script.
     *
     *      way/
     * If we are configured to be in a script or the user has turned off
     * colors we disable chalk coloring. Otherwise we let `chalk` decide if
     * it can show colors and let it proceed.
     */
    function setup_chalk_1() {
        if(cfg.noColor || cfg.asScript) chalk.enabled = false
        return chalk
    }
}

