const fs = require('fs');
const https = require('https');
const path = require('path');

const index = require('./index.json');
const htmlDir = path.join(__dirname, 'html_dumps');

if (!fs.existsSync(htmlDir)) {
    fs.mkdirSync(htmlDir);
}

function download(url, dest) {
    return new Promise((resolve, reject) => {
        if (!url) return resolve(false);
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(true);
                });
            } else if (response.statusCode === 302 || response.statusCode === 301) {
                // handle redirect
                download(response.headers.location, dest).then(resolve).catch(reject);
            } else {
                file.close();
                fs.unlink(dest, () => { });
                reject(new Error(`Server responded with ${response.statusCode}: ${response.statusMessage}`));
            }
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function run() {
    let success = 0;

    // We only need to download valid screens with HTML
    const validScreens = index.filter(s => s.htmlUrl && s.id);
    console.log(`Downloading HTML for ${validScreens.length} screens...`);

    // Batch downloads to avoid overwhelming connection limits
    const batchSize = 10;

    for (let i = 0; i < validScreens.length; i += batchSize) {
        const batch = validScreens.slice(i, i + batchSize);
        const promises = batch.map(screen => {
            const dest = path.join(htmlDir, `${screen.id}.html`);
            return download(screen.htmlUrl, dest)
                .then(res => { if (res) success++; })
                .catch(err => console.log(`Failed to download ${screen.id}: ${err.message}`));
        });

        await Promise.all(promises);
        console.log(`Processed ${Math.min(i + batchSize, validScreens.length)} / ${validScreens.length}`);
    }

    console.log(`Finished downloading ${success} HTML files.`);
}

run();
