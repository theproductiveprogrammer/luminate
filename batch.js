'use strict'

const util = require('util');
const stream = require('stream');
const fs = require('fs');
const CsvReadableStream = require('csv-reader');
const filter = require("stream-filter");

/**         understand/
 * We need a way to process each row in a file which contains batch operations/accounts
 * synchronously since we do not want multiple stellar operations to run concurrently.
 * Therefore we introduce a Stream processor which uses pause/resume and a the resolution
 * of a promise to achieve this synchronous processing.
 */
function RowProcessor(processFn, options) {
    // allow use without new
    if (!(this instanceof RowProcessor)) {
        return new RowProcessor(processFn, options);
    }

    this.processorFn = processFn;

    // init Transform
    if (!options) options = {}; // ensure object
    options.objectMode = true; // forcing object mode
    stream.Transform.call(this, options);
}
util.inherits(RowProcessor, stream.Transform);

RowProcessor.prototype._transform = function (obj, enc, cb) {
    this.pause();
    this.processorFn(obj, (err, res) => {
        if (err) throw new Error(err);
        this.push(res);
        cb();
        this.resume();
    });
};

/**
 *          way/
 * To support commenting out lines in batch files we use a stream filter which removes lines starting with `#`
 */
const commentFilter = filter.obj(line => !line[0].startsWith('#'));

function processCSVFile(csvFile, processorFn) {
    return fs.createReadStream(csvFile, 'utf8')
        .pipe(CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true }))
        .pipe(commentFilter)
        .pipe(RowProcessor(processorFn));
}

module.exports = {
    processCSVFile: processCSVFile
};