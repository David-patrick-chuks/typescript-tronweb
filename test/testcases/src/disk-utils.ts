import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

export function saveTests(tag, data) {
    const filename = path.resolve(__dirname, '../', tag + '.json.gz');

    fs.writeFileSync(
        filename,
        zlib.gzipSync(JSON.stringify(data, undefined, ' ') + '\n'),
    );

    console.log('Save testcase: ' + filename);
}

export function loadTests(tag) {
    const filename = path.resolve(__dirname, '../', tag + '.json.gz');
    return JSON.parse(zlib.gunzipSync(fs.readFileSync(filename)).toString());
}

export function loadTestsJSON(tag) {
    const filename = path.resolve(__dirname, '../', tag + '.json');
    return JSON.parse(fs.readFileSync(filename).toString());
}

export function loadData(filename) {
    return fs.readFileSync(path.resolve(__dirname, filename));
}

export function saveJson(tag, data) {
    const filename = path.resolve(__dirname, '../', tag + '.json');

    fs.writeFileSync(filename, JSON.stringify(data, undefined, ' '));

    console.log('Save testcase: ' + filename);
}
